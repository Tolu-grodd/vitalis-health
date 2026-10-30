import { Suspense, lazy, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { ServiceWorkerNotice } from '@/components/PWA'
import { SkeletonBlock, Spinner, ToastProvider } from '@/components/ui'
import { Logo } from '@/components/Logo'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useData'
import { RangeProvider } from '@/hooks/useRange'
import { displayPrefs, syncDisplayPrefs } from '@/lib/prefs'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'

// Routes past the dashboard load on navigation, so first paint stays light.
const Meals = lazy(() => import('@/pages/Meals').then((m) => ({ default: m.Meals })))
const Recipes = lazy(() => import('@/pages/Recipes').then((m) => ({ default: m.Recipes })))
const Schedule = lazy(() => import('@/pages/Schedule').then((m) => ({ default: m.Schedule })))
const Gym = lazy(() => import('@/pages/Gym').then((m) => ({ default: m.Gym })))
const BloodPressure = lazy(() => import('@/pages/BloodPressure').then((m) => ({ default: m.BloodPressure })))
const Vitals = lazy(() => import('@/pages/Vitals').then((m) => ({ default: m.Vitals })))
const History = lazy(() => import('@/pages/History').then((m) => ({ default: m.History })))
const Insights = lazy(() => import('@/pages/Insights').then((m) => ({ default: m.Insights })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))

function PageFallback() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-10 w-64" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
      </div>
      <SkeletonBlock className="h-72" />
    </div>
  )
}

function Booting() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4">
      <Logo />
      <Spinner className="h-5 w-5 text-ink-3" />
    </div>
  )
}

/**
 * Mirrors the formatting preferences into the module-level store, then keys the
 * subtree on them. Remounting on change is what makes an already-rendered
 * screen adopt a new time format or week start immediately.
 */
function Routed() {
  const { user, loading } = useAuth()
  const { settings } = useSettings()
  const [, setTick] = useState(0)

  useEffect(() => {
    if (syncDisplayPrefs(settings)) setTick((t) => t + 1)
  }, [settings])

  if (loading) return <Booting />
  if (!user) return <Login />

  const prefs = displayPrefs()

  return (
    <RangeProvider key={`${prefs.timeFormat}-${prefs.weekStartsOn}-${prefs.weightUnit}`}>
      <AppShell>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/meals" element={<Meals />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/gym" element={<Gym />} />
            <Route path="/blood-pressure" element={<BloodPressure />} />
            <Route path="/vitals" element={<Vitals />} />
            <Route path="/history" element={<History />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </RangeProvider>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routed />
          <ServiceWorkerNotice />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
