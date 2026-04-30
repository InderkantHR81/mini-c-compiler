import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/hooks/use-toast.jsx'
import Index from '@/pages/Index.jsx'
import NotFound from '@/pages/NotFound.jsx'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
