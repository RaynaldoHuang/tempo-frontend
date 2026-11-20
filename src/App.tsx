import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RouteLoading } from '@/components/shared/route-loading'
import { Toaster } from '@/components/ui/sonner'
import './padel.css'

const TV = lazy(() => import('@/pages/padel/tv-page'))
const PrivateApp = lazy(() => import('@/pages/padel/admin-app'))

export function AppRoutes() {
  return <Suspense fallback={<RouteLoading />}><Routes>
    <Route path="/" element={<TV />} />
    <Route path="/tv" element={<Navigate to="/" replace />} />
    <Route path="/admintempo/*" element={<PrivateApp />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>
}

export default function App() {
  return <BrowserRouter><Toaster richColors position="top-right" /><AppRoutes /></BrowserRouter>
}
