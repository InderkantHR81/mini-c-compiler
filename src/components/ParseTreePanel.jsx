import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'

function AstNode({ node, depth = 0 }) {
  if (node === null || node === undefined) {
    return <span className="text-muted-foreground">null</span>
  }
  if (typeof node !== 'object') {
    return <span className="font-mono text-sm">{JSON.stringify(node)}</span>
  }

  const { type, ...rest } = node
  const keys = Object.keys(rest)

  if (keys.length === 0) {
    return (
      <span className="font-mono text-sm">
        <span className="text-primary font-semibold">{type}</span>
      </span>
    )
  }

  return (
    <div className="space-y-1" style={{ marginLeft: depth ? 8 : 0 }}>
      <div className="font-mono text-sm">
        <span className="text-primary font-semibold">{type}</span>
      </div>
      <ul className="ml-3 list-none space-y-2 border-l border-border pl-3">
        {keys.map((k) => {
          const v = rest[k]
          if (v === null || v === undefined) {
            return (
              <li key={k}>
                <span className="text-muted-foreground">{k}:</span> <span className="text-muted-foreground">null</span>
              </li>
            )
          }
          if (Array.isArray(v)) {
            return (
              <li key={k}>
                <span className="text-muted-foreground">{k}:</span>
                <ul className="mt-1 list-none space-y-2">
                  {v.map((item, i) => (
                    <li key={i}>
                      <AstNode node={item} depth={depth + 1} />
                    </li>
                  ))}
                </ul>
              </li>
            )
          }
          if (typeof v === 'object') {
            return (
              <li key={k}>
                <span className="text-muted-foreground">{k}:</span>
                <div className="mt-1">
                  <AstNode node={v} depth={depth + 1} />
                </div>
              </li>
            )
          }
          return (
            <li key={k}>
              <span className="text-muted-foreground">{k}:</span>{' '}
              <span className="font-mono text-sm">{String(v)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function ParseTreePanel({ ast }) {
  if (!ast || ast.type !== 'Program') {
    return <p className="text-sm text-muted-foreground">No AST available (fix syntax errors first).</p>
  }

  return (
    <ScrollArea className="h-[min(420px,55vh)] w-full rounded-md border p-3">
      <Accordion type="multiple" defaultValue={['ast']} className="w-full">
        <AccordionItem value="ast">
          <AccordionTrigger className="py-2 text-sm">Full program tree</AccordionTrigger>
          <AccordionContent>
            <AstNode node={ast} />
          </AccordionContent>
        </AccordionItem>
        {ast.body?.map((stmt, i) => (
          <AccordionItem key={i} value={`stmt-${i}`}>
            <AccordionTrigger className="py-2 text-sm">
              Statement {i + 1}: <span className="ml-1 text-primary">{stmt?.type ?? '?'}</span>
            </AccordionTrigger>
            <AccordionContent>
              <AstNode node={stmt} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  )
}
