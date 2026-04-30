# PBL Notes - MiniLang Compiler Lab

## 1) Project Title
MiniLang Compiler Lab with AI Project Assistant

## 2) Problem Statement
Many students find compiler design difficult because internal phases (lexical analysis, parsing, semantic checks, code generation) are abstract and not visible.  
This project builds an interactive web app that visualizes each compiler phase in real time so users can learn by experimenting.

## 3) Objective
- Build a user-friendly compiler demo platform.
- Show each compiler phase output clearly.
- Support code editing with instant diagnostics.
- Add an assistant panel to suggest project ideas from code/prompts.

## 4) Technologies Used
- Frontend: React (JavaScript) + Vite
- Styling: Tailwind CSS + shadcn-style UI components
- Editor: Monaco Editor
- Routing: React Router
- Linting: ESLint
- Optional AI integration path: backend proxy endpoint for ChatGPT

## 5) System Overview
The app processes user code through a pipeline:
1. Lexer -> converts source code into tokens.
2. Parser -> builds AST (parse tree).
3. Semantic Analyzer -> validates declarations, scopes, and types.
4. Code Generator -> produces intermediate representation (IR).

The UI presents each phase in separate tabs:
- Tokens
- Parse Tree
- Symbol Table
- Intermediate Code
- Errors
- AI Helper

## 6) Key Features Implemented
- Real-time code compilation with Monaco editor.
- Syntax highlighting for MiniLang.
- Error diagnostics with line/column info.
- Click-to-focus from error panel to editor location.
- Parse tree and symbol table visualization.
- Intermediate code generation display.
- Dark mode toggle.
- Sample programs for quick testing.
- AI helper tab (offline idea engine currently).

## 7) Language Design (MiniLang)
MiniLang includes:
- Data types: int, float, string, bool, void
- Variables and assignments
- Arithmetic and logical expressions
- if/else, while, for loops
- Functions and return types
- Basic I/O-like calls (print, read_int)

Function parameters now support both styles:
- C-like: `int a`
- TS-like: `a: int`

## 8) Project Structure Summary
- `src/lib/compiler/lexer.js` -> tokenization
- `src/lib/compiler/parser.js` -> recursive descent parser + AST
- `src/lib/compiler/semantic.js` -> type/scope validation
- `src/lib/compiler/codegen.js` -> IR generation
- `src/lib/compiler/pipeline.js` -> orchestration of full compile flow
- `src/components/*` -> editor/panels/UI parts
- `src/components/AIAssistantPanel.jsx` -> chat-style assistant UI
- `src/lib/ai/ideaEngine.js` -> local AI-like project idea logic

## 9) Working Flow
1. User writes code in editor.
2. Debounced compile triggers pipeline.
3. Results update tabs instantly.
4. If errors exist, phase indicator stops at failing phase.
5. AI helper can suggest project ideas from prompt + code context.

## 10) Challenges Faced
- Keeping parsing robust across different function parameter styles.
- Balancing real-time updates and UI responsiveness.
- Making diagnostics understandable for beginners.
- Preventing repetitive assistant responses in offline mode.
- Encoding/parsing issues in generated JS file (resolved by clean UTF-8 rewrite).

## 11) Security/Deployment Notes
- Current app is static and runs offline.
- Real ChatGPT should NOT be called directly from frontend with API key.
- Use backend proxy (`/api/chat`) to keep keys secure.

## 12) Testing and Validation
- Lint checks used to maintain code quality (`npm run lint`).
- Manual testing performed for:
  - sample programs
  - syntax/semantic error reporting
  - for/if/while/function handling
  - panel rendering and navigation

## 13) Learning Outcomes
- Understood full compiler pipeline implementation.
- Learned recursive descent parsing and precedence handling.
- Implemented semantic analysis with symbol table and scope tracking.
- Built educational UI for technical concepts.
- Integrated assistant experience with fallback design.

## 14) Future Enhancements
- Add real backend-powered ChatGPT mode with streaming responses.
- Support additional languages in compiler mode.
- Improve AST visualization (graph/tree canvas).
- Add optimization pass visualization.
- Add downloadable compile report (PDF/Markdown).

## 15) Conclusion
This project successfully demonstrates compiler internals in an interactive and student-friendly way.  
It combines core compiler concepts with modern frontend UX and an assistant panel, making learning practical and engaging.

---

## Viva/Presentation One-Liners
- "This project converts compiler theory into a live, visual learning t ool."
- "Each compiler phase is isolated and inspectable, improving conceptual clarity."
- "The architecture is modular, so new language features can be added incrementally."
- "The assistant panel improves ideation and project planning on top of the core compiler."

