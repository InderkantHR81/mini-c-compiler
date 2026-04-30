/**
 * Lexical analysis: converts source text into a stream of tokens.
 * Each token records its kind, lexeme (raw text), and source span for diagnostics.
 */

export const TokenKind = {
  // Keywords mirror the MiniLang grammar
  INT: 'INT',
  FLOAT: 'FLOAT',
  STRING: 'STRING',
  BOOL: 'BOOL',
  IF: 'IF',
  ELSE: 'ELSE',
  WHILE: 'WHILE',
  FOR: 'FOR',
  FN: 'FN',
  RETURN: 'RETURN',
  PRINT: 'PRINT',
  READ_INT: 'READ_INT',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  VOID: 'VOID',
  IDENT: 'IDENT',
  NUMBER: 'NUMBER',
  STRING_LIT: 'STRING_LIT',
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  STAR: 'STAR',
  SLASH: 'SLASH',
  PERCENT: 'PERCENT',
  EQ: 'EQ',
  NE: 'NE',
  LT: 'LT',
  LE: 'LE',
  GT: 'GT',
  GE: 'GE',
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  ASSIGN: 'ASSIGN',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  COMMA: 'COMMA',
  SEMI: 'SEMI',
  COLON: 'COLON',
  EOF: 'EOF',
}

const KEYWORDS = {
  int: TokenKind.INT,
  float: TokenKind.FLOAT,
  string: TokenKind.STRING,
  bool: TokenKind.BOOL,
  void: TokenKind.VOID,
  if: TokenKind.IF,
  else: TokenKind.ELSE,
  while: TokenKind.WHILE,
  for: TokenKind.FOR,
  fn: TokenKind.FN,
  return: TokenKind.RETURN,
  print: TokenKind.PRINT,
  read_int: TokenKind.READ_INT,
  true: TokenKind.TRUE,
  false: TokenKind.FALSE,
}

const TYPE_TOKENS = new Set([
  TokenKind.INT,
  TokenKind.FLOAT,
  TokenKind.STRING,
  TokenKind.BOOL,
  TokenKind.VOID,
])

/** @param {string} kind */
export function isTypeToken(kind) {
  return TYPE_TOKENS.has(kind)
}

/**
 * @typedef {{ kind: string, lexeme: string, line: number, column: number, endColumn: number, value?: string|number|boolean }} Token
 */

/**
 * Tokenize MiniLang source. Collects lexical errors instead of throwing
 * so the UI can still show partial tokens when possible.
 *
 * @param {string} source
 * @returns {{ tokens: Token[], errors: import('./types.js').CompileError[] }}
 */
export function tokenize(source) {
  /** @type {Token[]} */
  const tokens = []
  /** @type {import('./types.js').CompileError[]} */
  const errors = []
  let i = 0
  let line = 1
  let column = 1

  /** @param {string} message */
  function err(message) {
    errors.push({
      phase: 'lexical',
      message,
      line,
      column,
      endColumn: column,
    })
  }

  function peek() {
    return source[i] ?? ''
  }

  function advance() {
    const c = peek()
    if (c === '\n') {
      line++
      column = 1
    } else if (c) {
      column++
    }
    i++
    return c
  }

  function skipWhitespaceAndComments() {
    while (i < source.length) {
      const c = peek()
      if (c === ' ' || c === '\t' || c === '\r' || c === '\n') {
        advance()
        continue
      }
      if (c === '/' && source[i + 1] === '/') {
        while (i < source.length && peek() !== '\n') advance()
        continue
      }
      break
    }
  }

  /** @param {string} kind */
  function push(kind, lexeme, value) {
    const startCol = column
    const tk = {
      kind,
      lexeme,
      line,
      column: startCol,
      endColumn: startCol + lexeme.length,
    }
    if (value !== undefined) tk.value = value
    tokens.push(tk)
  }

  while (i < source.length) {
    skipWhitespaceAndComments()
    if (i >= source.length) break

    const c = peek()

    if (/[a-zA-Z_]/.test(c)) {
      let lex = ''
      while (i < source.length && /[a-zA-Z0-9_]/.test(peek())) {
        lex += advance()
      }
      const kw = KEYWORDS[lex]
      if (kw) push(kw, lex)
      else push(TokenKind.IDENT, lex)
      continue
    }

    if (/[0-9]/.test(c)) {
      let lex = ''
      while (i < source.length && /[0-9]/.test(peek())) lex += advance()
      let isFloat = false
      if (peek() === '.' && /[0-9]/.test(source[i + 1] ?? '')) {
        isFloat = true
        lex += advance() // dot
        while (i < source.length && /[0-9]/.test(peek())) lex += advance()
      }
      const num = isFloat ? parseFloat(lex) : parseInt(lex, 10)
      if (Number.isNaN(num)) {
        err(`Invalid number literal "${lex}"`)
        push(TokenKind.NUMBER, lex, 0)
      } else {
        push(TokenKind.NUMBER, lex, num)
      }
      continue
    }

    if (c === '"') {
      advance() // opening quote
      let str = ''
      while (i < source.length && peek() !== '"') {
        if (peek() === '\\') {
          advance()
          const esc = peek()
          if (esc === 'n') {
            advance()
            str += '\n'
          } else if (esc === 't') {
            advance()
            str += '\t'
          } else if (esc === '\\' || esc === '"') {
            str += advance()
          } else if (!esc) {
            err('Unterminated string')
            break
          } else {
            str += advance()
          }
        } else if (peek() === '\n' || peek() === '') {
          err('Unterminated string')
          break
        } else {
          str += advance()
        }
      }
      if (peek() === '"') advance()
      push(TokenKind.STRING_LIT, `"${str}"`, str)
      continue
    }

    const two = c + (source[i + 1] ?? '')
    if (two === '==') {
      advance()
      advance()
      push(TokenKind.EQ, '==')
      continue
    }
    if (two === '!=') {
      advance()
      advance()
      push(TokenKind.NE, '!=')
      continue
    }
    if (two === '<=') {
      advance()
      advance()
      push(TokenKind.LE, '<=')
      continue
    }
    if (two === '>=') {
      advance()
      advance()
      push(TokenKind.GE, '>=')
      continue
    }
    if (two === '&&') {
      advance()
      advance()
      push(TokenKind.AND, '&&')
      continue
    }
    if (two === '||') {
      advance()
      advance()
      push(TokenKind.OR, '||')
      continue
    }

    switch (c) {
      case '+':
        advance()
        push(TokenKind.PLUS, '+')
        break
      case '-':
        advance()
        push(TokenKind.MINUS, '-')
        break
      case '*':
        advance()
        push(TokenKind.STAR, '*')
        break
      case '/':
        advance()
        push(TokenKind.SLASH, '/')
        break
      case '%':
        advance()
        push(TokenKind.PERCENT, '%')
        break
      case '<':
        advance()
        push(TokenKind.LT, '<')
        break
      case '>':
        advance()
        push(TokenKind.GT, '>')
        break
      case '!':
        advance()
        push(TokenKind.NOT, '!')
        break
      case '=':
        advance()
        push(TokenKind.ASSIGN, '=')
        break
      case '(':
        advance()
        push(TokenKind.LPAREN, '(')
        break
      case ')':
        advance()
        push(TokenKind.RPAREN, ')')
        break
      case '{':
        advance()
        push(TokenKind.LBRACE, '{')
        break
      case '}':
        advance()
        push(TokenKind.RBRACE, '}')
        break
      case ',':
        advance()
        push(TokenKind.COMMA, ',')
        break
      case ';':
        advance()
        push(TokenKind.SEMI, ';')
        break
      case ':':
        advance()
        push(TokenKind.COLON, ':')
        break
      default:
        err(`Unexpected character '${c}'`)
        advance()
        break
    }
  }

  tokens.push({
    kind: TokenKind.EOF,
    lexeme: '',
    line,
    column,
    endColumn: column,
  })

  return { tokens, errors }
}
