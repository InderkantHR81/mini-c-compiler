import * as React from 'react'
import { compile, SAMPLE_PROGRAMS } from '@/lib/compiler/pipeline.js'
import { CompilerHeader } from '@/components/CompilerHeader.jsx'
import { PhaseIndicator } from '@/components/PhaseIndicator.jsx'
import { CodeEditor } from '@/components/CodeEditor.jsx'
import { TokenPanel } from '@/components/TokenPanel.jsx'
import { ParseTreePanel } from '@/components/ParseTreePanel.jsx'
import { SymbolTablePanel } from '@/components/SymbolTablePanel.jsx'
import { IntermediateCodePanel } from '@/components/IntermediateCodePanel.jsx'
import { ErrorPanel } from '@/components/ErrorPanel.jsx'
import { AIAssistantPanel } from '@/components/AIAssistantPanel.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const DEFAULT_CODE = SAMPLE_PROGRAMS[0]?.code ?? 'print("Hello");'

function useDebounced(value, delay) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const t = window.setTimeout(() => setV(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return v
}

function errorsToMarkers(errors) {
  return errors.map((e) => ({
    severity: /* monaco.MarkerSeverity.Error */ 8,
    message: `[${e.phase}] ${e.message}`,
    startLineNumber: e.line,
    startColumn: e.column,
    endLineNumber: e.line,
    endColumn: e.endColumn ?? e.column + 1,
  }))
}

export default function Index() {
  const [code, setCode] = React.useState(DEFAULT_CODE)
  const [dark, setDark] = React.useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
  const [sampleKey, setSampleKey] = React.useState('0')
  const [jump, setJump] = React.useState(null)

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const debouncedCode = useDebounced(code, 280)
  const result = React.useMemo(() => compile(debouncedCode), [debouncedCode])
  const markers = React.useMemo(() => errorsToMarkers(result.errors), [result.errors])

  const onSelectSample = (key) => {
    setSampleKey(key)
    if (key === '') return
    const s = SAMPLE_PROGRAMS[Number(key)]
    if (s) setCode(s.code)
  }

  return (
    <div className="min-h-screen bg-background">
      <CompilerHeader
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        selectedSample={sampleKey}
        onSelectSample={onSelectSample}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6">
        <Card>
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-base sm:text-lg">Compilation pipeline</CardTitle>
            <CardDescription>Phases run in order; the first phase with problems is highlighted.</CardDescription>
            <PhaseIndicator phase={result.phase} errorCount={result.errors.length} />
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeEditor
              value={code}
              onChange={(v) => {
                setCode(v)
                setSampleKey('')
              }}
              markers={markers}
              jump={jump}
            />
            <p className="text-xs text-muted-foreground">
              Edits are analyzed after a short pause so typing stays smooth.
            </p>
          </CardContent>
        </Card>

        <section id="panel-results">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Phase outputs</CardTitle>
              <CardDescription>Explore what each compiler pass produced for the current source.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tokens" className="w-full">
                <TabsList className="flex w-full flex-wrap justify-start gap-1">
                  <TabsTrigger value="tokens">Tokens</TabsTrigger>
                  <TabsTrigger value="ast">Parse tree</TabsTrigger>
                  <TabsTrigger value="symbols">Symbols</TabsTrigger>
                  <TabsTrigger value="ir">IR</TabsTrigger>
                  <TabsTrigger value="errors">Errors</TabsTrigger>
                  <TabsTrigger value="ai">AI helper</TabsTrigger>
                </TabsList>
                <TabsContent value="tokens" className="outline-none">
                  <TokenPanel tokens={result.tokens} />
                </TabsContent>
                <TabsContent value="ast">
                  <ParseTreePanel ast={result.ast} />
                </TabsContent>
                <TabsContent value="symbols">
                  <SymbolTablePanel symbols={result.symbolTable} />
                </TabsContent>
                <TabsContent value="ir">
                  <IntermediateCodePanel instructions={result.instructions} />
                </TabsContent>
                <TabsContent value="errors">
                  <ErrorPanel
                    errors={result.errors}
                    onSelectError={(e) => {
                      setJump({ line: e.line, column: e.column })
                      window.setTimeout(() => setJump(null), 400)
                    }}
                  />
                </TabsContent>
                <TabsContent value="ai">
                  <AIAssistantPanel currentCode={code} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        <section id="panel-help">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Language tips</CardTitle>
              <CardDescription>MiniLang is a teaching subset with explicit types.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <p className="font-medium text-foreground">Declarations</p>
                <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
                  {`int x = 1;
float y = 2.5;
string s = "hi";
bool b = true;`}
                </pre>
              </div>
              <div>
                <p className="font-medium text-foreground">Functions &amp; I/O</p>
                <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
                  {`fn add(a: int, b: int): int {
  return a + b;
}
print(add(3, 4));
int n = read_int();`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
