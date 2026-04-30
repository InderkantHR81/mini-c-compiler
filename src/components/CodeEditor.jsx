import * as React from 'react'

const Editor = React.lazy(() => import('@monaco-editor/react'))

export function CodeEditor({ value, onChange, markers = [], jump }) {
  const editorRef = React.useRef(null)
  const monacoRef = React.useRef(null)

  const onMount = React.useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    if (!window.__MINILANG_LANG__) {
      window.__MINILANG_LANG__ = true
      monaco.languages.register({ id: 'minilang' })
      monaco.languages.setMonarchTokensProvider('minilang', {
        keywords: [
          'int',
          'float',
          'string',
          'bool',
          'void',
          'if',
          'else',
          'while',
          'for',
          'fn',
          'return',
          'print',
          'read_int',
          'true',
          'false',
        ],
        tokenizer: {
          root: [
            [/\b(?:int|float|string|bool|void|if|else|while|for|fn|return|print|read_int|true|false)\b/, 'keyword'],
            [/[A-Za-z_]\w*/, 'identifier'],
            [/"(?:[^"\\]|\\.)*"/, 'string'],
            [/0x[0-9a-fA-F]+|\d+(\.\d+)?/, 'number'],
            [/\/\/.*$/, 'comment'],
            [/[+\-*/%=<>!]+|&&|\|\|/, 'operator'],
            [/[\u005b\u005d{}();,.:]/, 'delimiter'],
          ],
        },
      })
    }
  }, [])

  React.useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return
    const model = editor.getModel()
    if (!model) return
    monaco.editor.setModelMarkers(model, 'compiler', markers ?? [])
  }, [markers])

  React.useEffect(() => {
    const editor = editorRef.current
    if (!editor || !jump) return
    editor.focus()
    editor.setPosition({ lineNumber: jump.line, column: jump.column })
    editor.revealLineInCenter(jump.line)
  }, [jump])

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#1e1e1e] shadow-sm dark:bg-[#0d1117]">
      <React.Suspense
        fallback={
          <div className="flex h-[min(380px,45vh)] items-center justify-center text-sm text-muted-foreground">
            Loading editor…
          </div>
        }
      >
        <Editor
          height="min(380px, 45vh)"
          defaultLanguage="minilang"
          theme="vs-dark"
          value={value}
          path="program.minilang"
          onChange={(v) => onChange(v ?? '')}
          onMount={onMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'ui-monospace, Consolas, monospace',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            tabSize: 2,
            automaticLayout: true,
          }}
        />
      </React.Suspense>
    </div>
  )
}
