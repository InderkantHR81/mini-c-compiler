import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export function TokenPanel({ tokens }) {
  if (!tokens?.length) {
    return <p className="text-sm text-muted-foreground">No tokens yet. Start typing in the editor.</p>
  }

  return (
    <ScrollArea className="h-[min(420px,55vh)] w-full rounded-md border">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur">
          <tr>
            <th className="p-2 font-medium">#</th>
            <th className="p-2 font-medium">Kind</th>
            <th className="p-2 font-medium">Lexeme</th>
            <th className="p-2 font-medium">Position</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t, i) => (
            <tr key={`${i}-${t.line}-${t.column}-${t.kind}`} className="border-t border-border/60 hover:bg-muted/40">
              <td className="p-2 text-muted-foreground">{i + 1}</td>
              <td className="p-2">
                <Badge variant="secondary" className="font-mono text-[10px] sm:text-xs">
                  {t.kind}
                </Badge>
              </td>
              <td className="max-w-[120px] truncate p-2 font-mono sm:max-w-none">{t.lexeme || '—'}</td>
              <td className="p-2 text-muted-foreground">
                {t.line}:{t.column}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  )
}
