import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export function ErrorPanel({ errors, onSelectError }) {
  if (!errors?.length) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <span className="mt-0.5 text-primary">✓</span>
        <div>No errors reported. Try introducing a typo or mismatched types to see diagnostics here.</div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[min(420px,55vh)] w-full rounded-md border">
      <ul className="divide-y divide-border p-2">
        {errors.map((e, i) => (
          <li key={i} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={e.phase === 'semantic' ? 'destructive' : 'secondary'}
                    className="text-[10px] uppercase"
                  >
                    {e.phase}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Line {e.line}, col {e.column}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground">{e.message}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 self-start"
              onClick={() => onSelectError?.(e)}
            >
              Show in editor
            </Button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}
