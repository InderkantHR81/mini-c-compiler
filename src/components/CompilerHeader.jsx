import { BookOpen, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavLink } from '@/components/NavLink'
import { SAMPLE_PROGRAMS } from '@/lib/compiler/pipeline.js'

export function CompilerHeader({
  dark,
  onToggleDark,
  selectedSample,
  onSelectSample,
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <BookOpen className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">MiniLang Compiler Lab</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Watch tokens, the AST, symbols, and IR update as you edit.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <nav className="flex flex-wrap items-center gap-3 border-r border-border pr-3 mr-1">
            <NavLink id="panel-results" label="Results" />
            <NavLink id="panel-help" label="Tips" />
          </nav>

          <label className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <span className="hidden sm:inline">Examples</span>
            <select
              className="h-9 max-w-[10rem] rounded-md border border-input bg-background px-2 text-sm text-foreground sm:max-w-xs"
              value={selectedSample}
              onChange={(e) => onSelectSample(e.target.value)}
            >
              <option value="">Custom code</option>
              {SAMPLE_PROGRAMS.map((s, i) => (
                <option key={s.label} value={String(i)}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <Button type="button" variant="outline" size="icon" onClick={onToggleDark} title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
