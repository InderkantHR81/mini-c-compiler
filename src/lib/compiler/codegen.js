/**
 * Intermediate Representation (IR) Code Generator.
 *
 * @param {any} ast
 * @param {import('./types.js').CompileError[]} semErrs
 * @returns {{ instructions: string[] }}
 */
export function generate(ast, semErrs) {
  if (semErrs && semErrs.length > 0) {
    return { instructions: [] }
  }

  const instructions = []
  let labelCounter = 0

  function getLabel() {
    return `L${labelCounter++}`
  }

  function emit(instr) {
    instructions.push(instr)
  }

  function visit(node) {
    if (!node) return
    switch (node.type) {
      case 'Program':
      case 'Block':
        if (node.body) {
          node.body.forEach(visit)
        }
        break
      case 'VarDecl':
        if (node.init) {
          visit(node.init)
          emit(`STORE ${node.name}`)
        }
        break
      case 'Assign':
        visit(node.value)
        emit(`STORE ${node.name}`)
        break
      case 'ExprStmt':
        visit(node.expr)
        emit(`POP`)
        break
      case 'Binary':
        visit(node.left)
        visit(node.right)
        emit(`OP ${node.op}`)
        break
      case 'Unary':
        visit(node.argument)
        emit(`OP_UNARY ${node.op}`)
        break
      case 'Literal':
        emit(`LOAD_CONST ${node.value}`)
        break
      case 'Identifier':
        emit(`LOAD_VAR ${node.name}`)
        break
      case 'Call':
        if (node.arguments) {
          node.arguments.forEach(visit)
        }
        emit(`CALL ${node.callee}`)
        break
      case 'Print':
        visit(node.argument)
        emit(`PRINT`)
        break
      case 'ReadInt':
        emit(`READ_INT`)
        break
      case 'If': {
        const lEnd = getLabel()
        visit(node.test)
        if (node.alternate) {
          const lAlt = getLabel()
          emit(`JUMP_IF_FALSE ${lAlt}`)
          visit(node.consequent)
          emit(`JUMP ${lEnd}`)
          emit(`${lAlt}:`)
          visit(node.alternate)
        } else {
          emit(`JUMP_IF_FALSE ${lEnd}`)
          visit(node.consequent)
        }
        emit(`${lEnd}:`)
        break
      }
      case 'While': {
        const lStart = getLabel()
        const lEnd = getLabel()
        emit(`${lStart}:`)
        visit(node.test)
        emit(`JUMP_IF_FALSE ${lEnd}`)
        visit(node.body)
        emit(`JUMP ${lStart}`)
        emit(`${lEnd}:`)
        break
      }
      case 'For': {
        const lStart = getLabel()
        const lEnd = getLabel()
        if (node.init) visit(node.init)
        emit(`${lStart}:`)
        if (node.test) {
          visit(node.test)
          emit(`JUMP_IF_FALSE ${lEnd}`)
        }
        visit(node.body)
        if (node.update) visit(node.update)
        emit(`JUMP ${lStart}`)
        emit(`${lEnd}:`)
        break
      }
      case 'FnDecl':
        emit(`FUNC_START ${node.name}`)
        visit(node.body)
        emit(`FUNC_END`)
        break
      case 'Return':
        if (node.argument) {
          visit(node.argument)
        }
        emit(`RETURN`)
        break
      case 'EmptyStmt':
        break
      default:
        emit(`// Unhandled node type: ${node.type}`)
        break
    }
  }

  try {
    visit(ast)
  } catch (e) {
    emit(`// Code generation error: ${e.message}`)
  }

  return { instructions }
}
