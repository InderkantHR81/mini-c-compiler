import { ScrollArea } from '@/components/ui/scroll-area'

export function IntermediateCodePanel({ instructions }) {
  if (!instructions?.length) {
    return <p className="text-sm text-muted-foreground">No intermediate code generated.</p>
  }

  return (
    <ScrollArea className="h-[min(420px,55vh)] w-full rounded-md border bg-card">
      <ol className="list-none p-3 font-mono text-xs leading-relaxed sm:text-sm">
        {instructions.map((line, i) => (
          <li key={i} className="flex gap-3 border-b border-border/40 py-1 last:border-0">
            <span className="w-8 shrink-0 text-right text-muted-foreground tabular-nums">{i + 1}</span>
            <code className="break-all text-foreground">{line}</code>
          </li>
        ))}
      </ol>
    </ScrollArea>
  )
}
