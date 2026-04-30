/**
 * Semantic analysis: symbol tables, name resolution, and type checking.
 * Walks the AST and annotates expressions with their computed types where helpful.
 */

/**
 * @typedef {import('./types.js').CompileError} CompileError
 * @typedef {import('./types.js').LangType} LangType
 */

/** Built-in pseudo-functions used by the language */
const BUILTINS = {
  read_int: { kind: 'fn', params: [], returnType: 'int' },
}

/**
 * @param {any} ast
 * @param {CompileError[]} syntaxErrors
 */
export function analyze(ast, syntaxErrors) {
  const errors = syntaxErrors.slice()
  const symbols = createSymbolTable()
  const analyzer = new SemanticAnalyzer(errors, symbols)
  analyzer.visitProgram(ast)
  return {
    symbolTable: symbols.flatten(),
    errors,
  }
}

function createSymbolTable() {
  /** @type {Map<string, any>[]} */
  const scopes = [new Map()]
  return {
    /** @param {string} name @param {any} info */
    define(name, info) {
      const top = scopes[scopes.length - 1]
      if (top.has(name)) {
        return false
      }
      top.set(name, info)
      return true
    },
    /** @param {string} name */
    resolve(name) {
      for (let i = scopes.length - 1; i >= 0; i--) {
        if (scopes[i].has(name)) return scopes[i].get(name)
      }
      return null
    },
    pushScope() {
      scopes.push(new Map())
    },
    popScope() {
      scopes.pop()
    },
    /** Export rows for UI */
    flatten() {
      /** @type {any[]} */
      const rows = []
      for (let si = 0; si < scopes.length; si++) {
        for (const [name, info] of scopes[si].entries()) {
          rows.push({
            name,
            kind: info.kind,
            dataType: info.dataType ?? info.returnType ?? '',
            scopeDepth: si,
            line: info.line,
            value: info.value,
            params: info.params,
          })
        }
      }
      return rows
    },
  }
}

class SemanticAnalyzer {
  /**
   * @param {CompileError[]} errors
   * @param {ReturnType<typeof createSymbolTable>} symbols
   */
  constructor(errors, symbols) {
    this.errors = errors
    this.symbols = symbols
    /** @type {LangType | 'void'} */
    this.currentFunctionReturn = 'void'
  }

  /** @param {string} message @param {number} line @param {number} column */
  semanticError(message, line, column) {
    this.errors.push({ phase: 'semantic', message, line, column, endColumn: column })
  }

  visitProgram(node) {
    if (!node || node.type !== 'Program') return
    for (const fn of Object.keys(BUILTINS)) {
      this.symbols.define(fn, { ...BUILTINS[fn], line: 0, builtin: true })
    }
    for (const stmt of node.body) {
      this.visitDeclOrStmt(stmt)
    }
  }

  /** @param {any} node */
  visitDeclOrStmt(node) {
    if (!node) return
    switch (node.type) {
      case 'VarDecl':
        this.visitVarDecl(node)
        break
      case 'FnDecl':
        this.visitFnDecl(node)
        break
      case 'Block':
        this.visitBlock(node)
        break
      default:
        this.visitStmt(node)
    }
  }

  /** @param {any} node */
  visitVarDecl(node) {
    const ok = this.symbols.define(node.name, {
      kind: 'variable',
      dataType: node.dataType,
      line: node.line,
    })
    if (!ok) {
      this.semanticError(`Redeclaration of "${node.name}"`, node.line, node.column)
    }
    if (node.init) {
      const t = this.inferExpr(node.init)
      if (t && !this.isAssignable(node.dataType, t)) {
        this.semanticError(
          `Cannot initialize ${node.dataType} ${node.name} with ${t} value`,
          node.line,
          node.column
        )
      }
    }
  }

  /** @param {any} node */
  visitFnDecl(node) {
    const paramList = node.params.map((p) => `${p.name}: ${p.dataType}`).join(', ')
    const paramTypes = node.params.map((p) => p.dataType)
    const ok = this.symbols.define(node.name, {
      kind: 'function',
      returnType: node.returnType,
      params: paramList,
      paramCount: node.params.length,
      paramTypes,
      line: node.line,
    })
    if (!ok) {
      this.semanticError(`Redeclaration of function "${node.name}"`, node.line, node.column)
    }

    this.symbols.pushScope()
    const prev = this.currentFunctionReturn
    this.currentFunctionReturn = /** @type {any} */ (node.returnType)
    for (const p of node.params) {
      const pok = this.symbols.define(p.name, {
        kind: 'parameter',
        dataType: p.dataType,
        line: p.line,
      })
      if (!pok) {
        this.semanticError(`Duplicate parameter "${p.name}"`, p.line, p.column)
      }
    }
    this.visitBlock(node.body)
    this.symbols.popScope()
    this.currentFunctionReturn = prev
  }

  /** @param {any} node */
  visitBlock(node) {
    this.symbols.pushScope()
    for (const s of node.body) {
      this.visitDeclOrStmt(s)
    }
    this.symbols.popScope()
  }

  /** @param {any} node */
  visitStmt(node) {
    if (!node) return
    switch (node.type) {
      case 'If':
        this.checkBool(this.inferExpr(node.test), node.test)
        this.visitStmt(node.consequent)
        if (node.alternate) this.visitStmt(node.alternate)
        break
      case 'While':
        this.checkBool(this.inferExpr(node.test), node.test)
        this.visitStmt(node.body)
        break
      case 'For':
        if (node.init?.type === 'VarDecl') this.visitVarDecl(node.init)
        else if (node.init?.type === 'Assign') this.visitAssign(node.init)
        if (node.test) this.checkBool(this.inferExpr(node.test), node.test)
        if (node.update) {
          if (node.update.type === 'Assign') this.visitAssign(node.update)
          else this.inferExpr(node.update)
        }
        this.visitStmt(node.body)
        break
      case 'Return': {
        const rt = this.currentFunctionReturn
        if (rt === 'void') {
          if (node.argument) {
            this.semanticError('Unexpected value in return for void function', node.line, node.column)
          }
        } else if (!node.argument) {
          this.semanticError(`Expected return value of type ${rt}`, node.line, node.column)
        } else {
          const t = this.inferExpr(node.argument)
          if (t && !this.isAssignable(rt, t)) {
            this.semanticError(`Return type mismatch: expected ${rt}, got ${t}`, node.line, node.column)
          }
        }
        break
      }
      case 'Print': {
        this.inferExpr(node.argument)
        break
      }
      case 'Assign':
        this.visitAssign(node)
        break
      case 'ExprStmt':
        this.inferExpr(node.expr)
        break
      case 'EmptyStmt':
        break
      case 'Block':
        this.visitBlock(node)
        break
      default:
        break
    }
  }

  /** @param {any} node */
  visitAssign(node) {
    const sym = this.symbols.resolve(node.name)
    if (!sym) {
      this.semanticError(`Undeclared variable "${node.name}"`, node.line, node.column)
      return
    }
    if (sym.kind !== 'variable' && sym.kind !== 'parameter') {
      this.semanticError(`"${node.name}" is not assignable`, node.line, node.column)
      return
    }
    const t = this.inferExpr(node.value)
    if (t && !this.isAssignable(sym.dataType, t)) {
      this.semanticError(`Cannot assign ${t} to ${sym.dataType}`, node.line, node.column)
    }
  }

  /**
   * @param {LangType | null} target
   * @param {LangType | null} value
   */
  isAssignable(target, value) {
    if (!target || !value) return true
    if (target === value) return true
    if (target === 'float' && value === 'int') return true
    return false
  }

  /**
   * @param {LangType | null} t
   * @param {any} node
   */
  checkBool(t, node) {
    if (t && t !== 'bool') {
      this.semanticError('Condition must be bool', node.line ?? 1, node.column ?? 1)
    }
  }

  /**
   * @param {any} node
   * @returns {LangType | null}
   */
  inferExpr(node) {
    if (!node) return null
    switch (node.type) {
      case 'Literal':
        return /** @type {LangType} */ (node.literalType)
      case 'Identifier': {
        const sym = this.symbols.resolve(node.name)
        if (!sym) {
          this.semanticError(`Undeclared identifier "${node.name}"`, node.line, node.column)
          return null
        }
        if (sym.kind === 'function' || sym.builtin) {
          this.semanticError(`"${node.name}" is a function, not a value`, node.line, node.column)
          return null
        }
        return sym.dataType
      }
      case 'ReadInt':
        return 'int'
      case 'Unary': {
        const t = this.inferExpr(node.argument)
        if (node.op === '!') {
          if (t && t !== 'bool') this.semanticError('! expects bool', node.argument.line ?? 1, node.argument.column ?? 1)
          return 'bool'
        }
        if (node.op === '-') {
          if (t && t !== 'int' && t !== 'float') {
            this.semanticError('Unary - expects number', node.argument.line ?? 1, node.argument.column ?? 1)
          }
          return t
        }
        return t
      }
      case 'Binary': {
        const lt = this.inferExpr(node.left)
        const rt = this.inferExpr(node.right)
        if (node.op === '&&' || node.op === '||') {
          if (lt && lt !== 'bool') this.semanticError(`${node.op} expects bool`, node.left.line ?? 1, node.left.column ?? 1)
          if (rt && rt !== 'bool') this.semanticError(`${node.op} expects bool`, node.right.line ?? 1, node.right.column ?? 1)
          return 'bool'
        }
        if (node.op === '==' || node.op === '!=') {
          if (lt && rt && lt !== rt && !(lt === 'float' && rt === 'int') && !(lt === 'int' && rt === 'float')) {
            this.semanticError(`Cannot compare ${lt} with ${rt}`, node.left.line ?? 1, node.left.column ?? 1)
          }
          return 'bool'
        }
        if (['<', '<=', '>', '>='].includes(node.op)) {
          if (lt && rt && !this.isNumeric(lt) && !this.isNumeric(rt)) {
            this.semanticError('Comparison expects numbers', node.left.line ?? 1, node.left.column ?? 1)
          }
          return 'bool'
        }
        return this.numericBinary(lt, rt, node.op, node.left)
      }
      case 'Call': {
        const sym = this.symbols.resolve(node.callee)
        if (!sym || (sym.kind !== 'function' && !sym.builtin)) {
          this.semanticError(`Unknown function "${node.callee}"`, node.line ?? 1, node.column ?? 1)
          return null
        }
        if (sym.builtin) {
          if (node.arguments.length !== sym.params.length) {
            this.semanticError(`Wrong arg count for ${node.callee}`, node.line ?? 1, node.column ?? 1)
          }
          return /** @type {LangType} */ (sym.returnType)
        }
        if (node.arguments.length !== sym.paramCount) {
          this.semanticError(`Wrong number of arguments to ${node.callee}`, node.line ?? 1, node.column ?? 1)
        } else {
          for (let i = 0; i < node.arguments.length; i++) {
            const at = this.inferExpr(node.arguments[i])
            const expected = sym.paramTypes[i]
            if (at && !this.isAssignable(expected, at)) {
              this.semanticError(
                `Argument ${i + 1} to ${node.callee}: expected ${expected}, got ${at}`,
                node.line ?? 1,
                node.column ?? 1
              )
            }
          }
        }
        return sym.returnType === 'void' ? null : /** @type {LangType} */ (sym.returnType)
      }
      case 'ErrorExpr':
        return null
      default:
        return null
    }
  }

  /**
   * @param {LangType | null} lt
   * @param {LangType | null} rt
   * @param {string} op
   * @param {any} leftNode
   */
  numericBinary(lt, rt, op, leftNode) {
    if (['+', '-', '*', '/', '%'].includes(op)) {
      if (op === '%' && ((lt && lt === 'float') || (rt && rt === 'float'))) {
        this.semanticError('% requires integers', leftNode.line ?? 1, leftNode.column ?? 1)
      }
      if (lt === 'string' && rt === 'string' && op === '+') return 'string'
      if (this.isNumeric(lt) && this.isNumeric(rt)) {
        if (lt === 'float' || rt === 'float') return 'float'
        return 'int'
      }
      if (lt && rt) {
        this.semanticError(`Invalid operands for ${op}: ${lt}, ${rt}`, leftNode.line ?? 1, leftNode.column ?? 1)
      }
    }
    return 'int'
  }

  /** @param {LangType | null} t */
  isNumeric(t) {
    return t === 'int' || t === 'float'
  }
}
