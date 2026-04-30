import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export function SymbolTablePanel({ symbols }) {
  if (!symbols?.length) {
    return <p className="text-sm text-muted-foreground">No symbols recorded yet.</p>
  }

  const rows = [...symbols].sort((a, b) => a.scopeDepth - b.scopeDepth || a.name.localeCompare(b.name))

  return (
    <ScrollArea className="h-[min(420px,55vh)] w-full rounded-md border">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur">
          <tr>
            <th className="p-2 font-medium">Name</th>
            <th className="p-2 font-medium">Kind</th>
            <th className="p-2 font-medium">Type</th>
            <th className="p-2 font-medium">Scope</th>
            <th className="p-2 font-medium">Extra</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => (
            <tr key={`${s.name}-${s.scopeDepth}-${i}`} className="border-t border-border/60 hover:bg-muted/40">
              <td className="p-2 font-mono font-medium">{s.name}</td>
              <td className="p-2">
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  {s.kind}
                </Badge>
              </td>
              <td className="p-2 font-mono text-muted-foreground">{s.dataType || s.returnType || '—'}</td>
              <td className="p-2 text-muted-foreground">{s.scopeDepth}</td>
              <td className="max-w-[140px] truncate p-2 text-muted-foreground sm:max-w-[220px]" title={s.params || ''}>
                {s.builtin ? 'builtin' : s.params || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  )
}
