/**
 * Orchestrates the compiler pipeline: lexical → syntax → semantic → codegen.
 */

import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { analyze } from './semantic.js'
import { generate } from './codegen.js'

/**
 * Run all phases on source text.
 *
 * @param {string} source
 * @returns {{
 *   tokens: import('./lexer.js').Token[],
 *   ast: any,
 *   symbolTable: any[],
 *   instructions: string[],
 *   errors: import('./types.js').CompileError[],
 *   phase: 'ok' | 'lexical' | 'syntax' | 'semantic'
 * }}
 */
export function compile(source) {
  const { tokens, errors: lexErrs } = tokenize(source)
  const { ast, errors: synErrs } = parse(tokens, lexErrs)
  const { symbolTable, errors: semErrs } = analyze(ast, synErrs)
  const { instructions } = generate(ast, semErrs)

  const errors = semErrs
  let phase = /** @type {'ok' | 'lexical' | 'syntax' | 'semantic'} */ ('ok')
  if (errors.some((e) => e.phase === 'lexical')) phase = 'lexical'
  else if (errors.some((e) => e.phase === 'syntax')) phase = 'syntax'
  else if (errors.some((e) => e.phase === 'semantic')) phase = 'semantic'

  return { tokens, ast, symbolTable, instructions, errors, phase }
}

/** Sample programs for the demo dropdown */
export const SAMPLE_PROGRAMS = [
  {
    label: 'Hello variables',
    code: `string msg = "Hello, MiniLang!";
print(msg);

int a = 3;
int b = 4;
print(a + b);
`,
  },
  {
    label: 'Loops & logic',
    code: `int sum = 0;
for (int i = 0; i < 5; i = i + 1) {
  sum = sum + i;
}
print(sum);

int x = 10;
while (x > 0) {
  x = x - 1;
}
print(x);
`,
  },
  {
    label: 'Functions',
    code: `fn add(a: int, b: int): int {
  return a + b;
}

int r = add(2, 3);
print(r);

fn greet(name: string): void {
  print(name);
}

greet("compiler");
`,
  },
  {
    label: 'Types & conditionals',
    code: `float pi = 3.14;
int n = 2;
float area = pi * n * n;
print(area);

bool ok = true && !false;
if (ok) {
  print(1);
} else {
  print(0);
}
`,
  },
]
