import { Check, Circle, AlertCircle } from 'lucide-react'

const PHASES = [
  { id: 'lexical', label: 'Lex', description: 'Scan & tokenize' },
  { id: 'syntax', label: 'Parse', description: 'Build AST' },
  { id: 'semantic', label: 'Analyze', description: 'Types & symbols' },
  { id: 'codegen', label: 'Codegen', description: 'Intermediate IR' },
]

/**
 * Shows pipeline progress. `phase` is the first failing phase from compile result, or 'ok'.
 */
export function PhaseIndicator({ phase, errorCount }) {
  const order = ['lexical', 'syntax', 'semantic', 'codegen', 'ok']
  const failIdx = phase === 'ok' ? -1 : order.indexOf(phase)

  return (
    <div className="w-full">
      <ol className="flex flex-wrap items-center gap-2 sm:gap-4">
        {PHASES.map((p, i) => {
          const done = phase === 'ok' ? true : i < failIdx
          const failed = phase !== 'ok' && i === failIdx
          return (
            <li key={p.id} className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                  failed
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : done
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-muted-foreground/30 text-muted-foreground'
                }`}
                title={p.description}
              >
                {failed ? <AlertCircle className="h-4 w-4" /> : done ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold leading-tight sm:text-sm">{p.label}</div>
                <div className="hidden text-[11px] text-muted-foreground sm:block">{p.description}</div>
              </div>
              {i < PHASES.length - 1 ? <div className="mx-1 hidden h-px w-6 bg-border sm:block" aria-hidden /> : null}
            </li>
          )
        })}
      </ol>
      {errorCount > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {errorCount} issue{errorCount === 1 ? '' : 's'} — open the Errors tab for details.
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">All phases completed without blocking errors.</p>
      )}
    </div>
  )
}
