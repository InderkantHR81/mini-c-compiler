/**
 * Syntax analysis: recursive-descent parser building an AST from tokens.
 * Operator precedence matches typical C-like languages (&& over ||, etc.).
 */

import { TokenKind, isTypeToken } from './lexer.js'

/**
 * @typedef {import('./lexer.js').Token} Token
 * @typedef {import('./types.js').CompileError} CompileError
 */

/**
 * @param {Token[]} tokens
 * @param {CompileError[]} lexicalErrors
 */
export function parse(tokens, lexicalErrors) {
  const errors = lexicalErrors.slice()
  const parser = new Parser(tokens, errors)
  const ast = parser.parseProgram()
  return { ast, errors }
}

class Parser {
  /**
   * @param {Token[]} tokens
   * @param {CompileError[]} errors
   */
  constructor(tokens, errors) {
    this.tokens = tokens
    this.i = 0
    this.errors = errors
  }

  /** @returns {Token} */
  cur() {
    return this.tokens[this.i] ?? this.tokens[this.tokens.length - 1]
  }

  /** @returns {Token | undefined} */
  peekAhead(n = 1) {
    return this.tokens[this.i + n]
  }

  /** @returns {Token} */
  advance() {
    const t = this.cur()
    if (t.kind !== TokenKind.EOF) this.i++
    return t
  }

  /**
   * @param {string} kind TokenKind
   * @param {string} [message]
   */
  expect(kind, message) {
    const t = this.cur()
    if (t.kind !== kind) {
      this.syntaxError(message ?? `Expected ${kind}, found ${t.kind}`)
      return t
    }
    return this.advance()
  }

  /** @param {string} message */
  syntaxError(message) {
    const t = this.cur()
    this.errors.push({
      phase: 'syntax',
      message,
      line: t.line,
      column: t.column,
      endColumn: t.endColumn,
    })
  }

  /** @param {string} kind */
  match(kind) {
    if (this.cur().kind === kind) {
      this.advance()
      return true
    }
    return false
  }

  parseProgram() {
    const line = this.cur().line
    const column = this.cur().column
    /** @type {any[]} */
    const body = []
    while (this.cur().kind !== TokenKind.EOF) {
      body.push(this.parseDeclOrStmt())
    }
    return { type: 'Program', body, line, column }
  }

  parseDeclOrStmt() {
    if (this.cur().kind === TokenKind.FN) return this.parseFnDecl()
    if (isTypeToken(this.cur().kind)) return this.parseVarDecl()
    return this.parseStmt()
  }

  parseVarDecl() {
    const t = this.parseTypeName()
    const id = this.expect(TokenKind.IDENT, 'Expected variable name after type')
    let init = null
    if (this.match(TokenKind.ASSIGN)) init = this.parseExpr()
    this.expect(TokenKind.SEMI, 'Expected `;` after variable declaration')
    return {
      type: 'VarDecl',
      dataType: t,
      name: id.lexeme,
      init,
      line: id.line,
      column: id.column,
    }
  }

  parseFnDecl() {
    const kw = this.expect(TokenKind.FN, 'Expected `fn`')
    const id = this.expect(TokenKind.IDENT, 'Expected function name')
    this.expect(TokenKind.LPAREN, 'Expected `(` after function name')
    /** @type {{ name: string, dataType: string, line: number, column: number }[]} */
    const params = []
    if (this.cur().kind !== TokenKind.RPAREN) {
      do {
        // Support both parameter styles:
        // - C-like:   int a
        // - TS-like:  a: int
        let pid = null
        let pt = null

        if (this.cur().kind === TokenKind.IDENT && this.peekAhead(1)?.kind === TokenKind.COLON) {
          // a: int
          pid = this.advance()
          this.advance() // :
          pt = this.parseTypeName()
        } else {
          // int a
          pt = this.parseTypeName()
          pid = this.expect(TokenKind.IDENT, 'Expected parameter name')
        }

        params.push({
          name: pid.lexeme,
          dataType: pt,
          line: pid.line,
          column: pid.column,
        })
      } while (this.match(TokenKind.COMMA))
    }
    this.expect(TokenKind.RPAREN, 'Expected `)` after parameters')
    let returnType = 'void'
    if (this.match(TokenKind.COLON)) {
      returnType = this.parseTypeName()
    }
    const body = this.parseBlock()
    return {
      type: 'FnDecl',
      name: id.lexeme,
      params,
      returnType,
      body,
      line: kw.line,
      column: kw.column,
    }
  }

  /** @returns {string} */
  parseTypeName() {
    const t = this.cur()
    switch (t.kind) {
      case TokenKind.INT:
        this.advance()
        return 'int'
      case TokenKind.FLOAT:
        this.advance()
        return 'float'
      case TokenKind.STRING:
        this.advance()
        return 'string'
      case TokenKind.BOOL:
        this.advance()
        return 'bool'
      case TokenKind.VOID:
        this.advance()
        return 'void'
      default:
        this.syntaxError('Expected type name')
        this.advance()
        return 'int'
    }
  }

  parseBlock() {
    this.expect(TokenKind.LBRACE, 'Expected `{`')
    /** @type {any[]} */
    const body = []
    while (this.cur().kind !== TokenKind.RBRACE && this.cur().kind !== TokenKind.EOF) {
      body.push(this.parseDeclOrStmt())
    }
    this.expect(TokenKind.RBRACE, 'Expected `}`')
    return { type: 'Block', body }
  }

  parseStmt() {
    const t = this.cur()
    switch (t.kind) {
      case TokenKind.IF:
        return this.parseIf()
      case TokenKind.WHILE:
        return this.parseWhile()
      case TokenKind.FOR:
        return this.parseFor()
      case TokenKind.RETURN:
        return this.parseReturn()
      case TokenKind.PRINT:
        return this.parsePrint()
      case TokenKind.LBRACE:
        return this.parseBlock()
      case TokenKind.SEMI:
        this.advance()
        return { type: 'EmptyStmt' }
      case TokenKind.IDENT: {
        const next = this.peekAhead(1)
        if (next?.kind === TokenKind.ASSIGN) {
          const id = this.advance()
          this.advance()
          const val = this.parseExpr()
          this.expect(TokenKind.SEMI, 'Expected `;` after assignment')
          return {
            type: 'Assign',
            name: id.lexeme,
            value: val,
            line: id.line,
            column: id.column,
          }
        }
        const e = this.parseExpr()
        this.expect(TokenKind.SEMI, 'Expected `;` after expression')
        return { type: 'ExprStmt', expr: e }
      }
      default: {
        if (isTypeToken(t.kind)) {
          return this.parseVarDecl()
        }
        const e = this.parseExpr()
        this.expect(TokenKind.SEMI, 'Expected `;` after expression')
        return { type: 'ExprStmt', expr: e }
      }
    }
  }

  parseIf() {
    this.expect(TokenKind.IF, '')
    this.expect(TokenKind.LPAREN, 'Expected `(` after `if`')
    const test = this.parseExpr()
    this.expect(TokenKind.RPAREN, 'Expected `)` after condition')
    const consequent = this.parseStmt()
    let alternate = null
    if (this.match(TokenKind.ELSE)) {
      alternate = this.parseStmt()
    }
    return { type: 'If', test, consequent, alternate }
  }

  parseWhile() {
    this.expect(TokenKind.WHILE, '')
    this.expect(TokenKind.LPAREN, 'Expected `(` after `while`')
    const test = this.parseExpr()
    this.expect(TokenKind.RPAREN, 'Expected `)` after condition')
    const body = this.parseStmt()
    return { type: 'While', test, body }
  }

  parseFor() {
    this.expect(TokenKind.FOR, '')
    this.expect(TokenKind.LPAREN, 'Expected `(` after `for`')
    let init = null
    if (!this.match(TokenKind.SEMI)) {
      init = this.parseForInit()
      this.expect(TokenKind.SEMI, 'Expected `;` in for-loop header')
    }
    let test = null
    if (!this.match(TokenKind.SEMI)) {
      test = this.parseExpr()
      this.expect(TokenKind.SEMI, 'Expected `;` in for-loop header')
    } else {
      // second semicolon already consumed
    }
    let update = null
    if (!this.match(TokenKind.RPAREN)) {
      if (this.cur().kind === TokenKind.IDENT && this.peekAhead(1)?.kind === TokenKind.ASSIGN) {
        const id = this.advance()
        this.advance()
        const val = this.parseExpr()
        update = { type: 'Assign', name: id.lexeme, value: val, line: id.line, column: id.column }
      } else {
        update = this.parseExpr()
      }
      this.expect(TokenKind.RPAREN, 'Expected `)` after for-loop header')
    }
    const body = this.parseStmt()
    return { type: 'For', init, test, update, body }
  }

  parseForInit() {
    if (isTypeToken(this.cur().kind)) {
      const dt = this.parseTypeName()
      const id = this.expect(TokenKind.IDENT, 'Expected name in for-init')
      let init = null
      if (this.match(TokenKind.ASSIGN)) init = this.parseExpr()
      return { type: 'VarDecl', dataType: dt, name: id.lexeme, init, line: id.line, column: id.column }
    }
    if (this.cur().kind === TokenKind.IDENT && this.peekAhead(1)?.kind === TokenKind.ASSIGN) {
      const id = this.advance()
      this.advance()
      const val = this.parseExpr()
      return { type: 'Assign', name: id.lexeme, value: val, line: id.line, column: id.column }
    }
    this.syntaxError('Invalid for-loop initializer')
    this.advance()
    return { type: 'EmptyStmt' }
  }

  parseReturn() {
    const kw = this.expect(TokenKind.RETURN, '')
    let argument = null
    if (this.cur().kind !== TokenKind.SEMI) {
      argument = this.parseExpr()
    }
    this.expect(TokenKind.SEMI, 'Expected `;` after return')
    return { type: 'Return', argument, line: kw.line, column: kw.column }
  }

  parsePrint() {
    this.expect(TokenKind.PRINT, '')
    this.expect(TokenKind.LPAREN, 'Expected `(` after print')
    const arg = this.parseExpr()
    this.expect(TokenKind.RPAREN, 'Expected `)` after print argument')
    this.expect(TokenKind.SEMI, 'Expected `;` after print')
    return { type: 'Print', argument: arg }
  }

  parseExpr() {
    return this.parseLogicalOr()
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd()
    while (this.cur().kind === TokenKind.OR) {
      const op = this.advance().lexeme
      const right = this.parseLogicalAnd()
      left = { type: 'Binary', op, left, right }
    }
    return left
  }

  parseLogicalAnd() {
    let left = this.parseEquality()
    while (this.cur().kind === TokenKind.AND) {
      const op = this.advance().lexeme
      const right = this.parseEquality()
      left = { type: 'Binary', op, left, right }
    }
    return left
  }

  parseEquality() {
    let left = this.parseRelational()
    while (this.cur().kind === TokenKind.EQ || this.cur().kind === TokenKind.NE) {
      const op = this.advance().lexeme
      const right = this.parseRelational()
      left = { type: 'Binary', op, left, right }
    }
    return left
  }

  parseRelational() {
    let left = this.parseAdditive()
    while (
      this.cur().kind === TokenKind.LT ||
      this.cur().kind === TokenKind.LE ||
      this.cur().kind === TokenKind.GT ||
      this.cur().kind === TokenKind.GE
    ) {
      const op = this.advance().lexeme
      const right = this.parseAdditive()
      left = { type: 'Binary', op, left, right }
    }
    return left
  }

  parseAdditive() {
    let left = this.parseMultiplicative()
    while (this.cur().kind === TokenKind.PLUS || this.cur().kind === TokenKind.MINUS) {
      const op = this.advance().lexeme
      const right = this.parseMultiplicative()
      left = { type: 'Binary', op, left, right }
    }
    return left
  }

  parseMultiplicative() {
    let left = this.parseUnary()
    while (
      this.cur().kind === TokenKind.STAR ||
      this.cur().kind === TokenKind.SLASH ||
      this.cur().kind === TokenKind.PERCENT
    ) {
      const op = this.advance().lexeme
      const right = this.parseUnary()
      left = { type: 'Binary', op, left, right }
    }
    return left
  }

  parseUnary() {
    if (this.cur().kind === TokenKind.NOT) {
      const op = this.advance().lexeme
      const arg = this.parseUnary()
      return { type: 'Unary', op, argument: arg }
    }
    if (this.cur().kind === TokenKind.MINUS) {
      const op = this.advance().lexeme
      const arg = this.parseUnary()
      return { type: 'Unary', op, argument: arg }
    }
    return this.parsePostfix()
  }

  parsePostfix() {
    let expr = this.parsePrimary()
    while (this.cur().kind === TokenKind.LPAREN) {
      if (expr.type !== 'Identifier') {
        this.syntaxError('Invalid call target')
        this.skipCallArgs()
        break
      }
      this.advance()
      /** @type {any[]} */
      const args = []
      if (this.cur().kind !== TokenKind.RPAREN) {
        do {
          args.push(this.parseExpr())
        } while (this.match(TokenKind.COMMA))
      }
      this.expect(TokenKind.RPAREN, 'Expected `)` after arguments')
      expr = {
        type: 'Call',
        callee: expr.name,
        arguments: args,
        line: expr.line,
        column: expr.column,
      }
    }
    return expr
  }

  skipCallArgs() {
    let depth = 1
    while (depth > 0 && this.cur().kind !== TokenKind.EOF) {
      if (this.cur().kind === TokenKind.LPAREN) depth++
      else if (this.cur().kind === TokenKind.RPAREN) depth--
      this.advance()
    }
  }

  parsePrimary() {
    const t = this.cur()
    if (t.kind === TokenKind.NUMBER) {
      this.advance()
      const litType = Number.isInteger(t.value) ? 'int' : 'float'
      return { type: 'Literal', value: t.value, literalType: litType, line: t.line, column: t.column }
    }
    if (t.kind === TokenKind.STRING_LIT) {
      this.advance()
      return { type: 'Literal', value: t.value, literalType: 'string', line: t.line, column: t.column }
    }
    if (t.kind === TokenKind.TRUE || t.kind === TokenKind.FALSE) {
      this.advance()
      return { type: 'Literal', value: t.kind === TokenKind.TRUE, literalType: 'bool', line: t.line, column: t.column }
    }
    if (t.kind === TokenKind.IDENT) {
      this.advance()
      return { type: 'Identifier', name: t.lexeme, line: t.line, column: t.column }
    }
    if (t.kind === TokenKind.READ_INT) {
      this.advance()
      this.expect(TokenKind.LPAREN, 'Expected `(` after read_int')
      this.expect(TokenKind.RPAREN, 'Expected `)` after read_int')
      return { type: 'ReadInt', line: t.line, column: t.column }
    }
    if (t.kind === TokenKind.LPAREN) {
      this.advance()
      const inner = this.parseExpr()
      this.expect(TokenKind.RPAREN, 'Expected `)`')
      return inner
    }
    this.syntaxError(`Unexpected token ${t.kind} in expression`)
    this.advance()
    return { type: 'ErrorExpr' }
  }
}
