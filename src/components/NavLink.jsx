import { cn } from '@/lib/utils'

/**
 * In-app section link (scroll target) with accessible styling.
 */
export function NavLink({ id, label, className, onClick }) {
  return (
    <button
      type="button"
      onClick={() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        onClick?.()
      }}
      className={cn(
        'text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline',
        className
      )}
    >
      {label}
    </button>
  )
}
