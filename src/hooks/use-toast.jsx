import * as React from 'react'

const ToastContext = React.createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = React.useState(null)
  const tRef = React.useRef(0)
  const show = React.useCallback((message) => {
    setToast(message)
    window.clearTimeout(tRef.current)
    tRef.current = window.setTimeout(() => setToast(null), 3200)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border bg-card px-4 py-2 text-sm text-card-foreground shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) return () => {}
  return ctx
}
