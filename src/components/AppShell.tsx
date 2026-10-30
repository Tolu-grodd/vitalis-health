import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Activity,
  CalendarClock,
  CalendarRange,
  ChefHat,
  Dumbbell,
  Heart,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Monitor,
  Moon,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { Logo, Mark } from './Logo'
import { DateRangeFilter } from './DateRangeFilter'
import { cn, useLocalStorage, useOnClickOutside } from './ui'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  to: string
  label: string
  short: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const NAV_GROUPS: Array<{ label?: string; items: NavItem[] }> = [
  { items: [{ to: '/', label: 'Dashboard', short: 'Home', icon: LayoutDashboard, end: true }] },
  {
    label: 'Nutrition',
    items: [
      { to: '/meals', label: 'Meals', short: 'Meals', icon: UtensilsCrossed },
      { to: '/recipes', label: 'Recipes and plan', short: 'Recipes', icon: ChefHat },
    ],
  },
  {
    label: 'Health',
    items: [
      { to: '/blood-pressure', label: 'Blood pressure', short: 'BP', icon: Heart },
      { to: '/vitals', label: 'Vitals and meds', short: 'Vitals', icon: Activity },
    ],
  },
  {
    label: 'Plan and train',
    items: [
      { to: '/schedule', label: 'Schedule', short: 'Schedule', icon: CalendarClock },
      { to: '/gym', label: 'Gym', short: 'Gym', icon: Dumbbell },
    ],
  },
  {
    label: 'Review',
    items: [
      { to: '/history', label: 'History', short: 'History', icon: CalendarRange },
      { to: '/insights', label: 'Insights', short: 'Insights', icon: Sparkles },
    ],
  },
]

const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items)

/** The four that earn a permanent slot on a phone. Everything else lives in More. */
const MOBILE_PRIMARY = ['/', '/meals', '/gym', '/schedule']

type ThemeMode = 'system' | 'light' | 'dark'

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', mode)
}

export function useTheme() {
  const [mode, setMode] = useLocalStorage<ThemeMode>('vitalis.theme', 'system')
  useEffect(() => applyTheme(mode), [mode])
  return { mode, setMode }
}

function ThemeToggle() {
  const { mode, setMode } = useTheme()
  const options: Array<{ id: ThemeMode; icon: typeof Sun; label: string }> = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'system', icon: Monitor, label: 'System' },
  ]
  return (
    <div className="inline-flex rounded-xl border border-line bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => setMode(o.id)}
          aria-label={`${o.label} theme`}
          title={`${o.label} theme`}
          aria-pressed={mode === o.id}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors',
            mode === o.id ? 'bg-surface text-ink shadow-card' : 'text-ink-3 hover:text-ink',
          )}
        >
          <o.icon size={15} />
        </button>
      ))}
    </div>
  )
}

function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => setOpen(false))
  if (!user) return null

  const initials = (user.displayName ?? user.email ?? '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-2 text-[13px] font-semibold text-ink-2 transition-colors hover:border-line-strong"
        aria-label="Account menu"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initials
        )}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-60 animate-scale-in overflow-hidden rounded-2xl border border-line bg-surface shadow-float">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-[13px] font-semibold text-ink">{user.displayName ?? 'Signed in'}</p>
            <p className="truncate text-[12px] text-ink-3">{user.email}</p>
          </div>
          <div className="p-1.5">
            <NavLink
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-2"
            >
              <SettingsIcon size={15} className="text-ink-3" />
              Settings and goals
            </NavLink>
            <button
              onClick={() => signOut()}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-ink transition-colors hover:bg-surface-2"
            >
              <LogOut size={15} className="text-ink-3" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-colors',
    isActive ? 'bg-brand-soft text-brand' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  )

function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  const rest = ALL_NAV.filter((n) => !MOBILE_PRIMARY.includes(n.to))
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="absolute inset-x-0 bottom-0 animate-fade-up rounded-t-3xl border border-line bg-surface pb-6 shadow-float">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-[15px] font-semibold text-ink">More</p>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink-3 hover:bg-surface-2">
            <X size={18} />
          </button>
        </div>
        <nav className="grid grid-cols-2 gap-2 px-4">
          {rest.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-xl border p-3 text-[13px] font-medium transition-colors',
                  isActive ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-2',
                )
              }
            >
              <n.icon size={17} />
              {n.label}
            </NavLink>
          ))}
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-xl border p-3 text-[13px] font-medium transition-colors',
                isActive ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-2',
              )
            }
          >
            <SettingsIcon size={17} />
            Settings
          </NavLink>
        </nav>
        <div className="mt-4 flex justify-center">
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  // The range filter scopes charts and lists. Pages without either hide it.
  const showFilter = !['/settings', '/schedule', '/recipes'].includes(pathname)

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface lg:flex">
        <div className="px-5 py-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-4 px-3 pb-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label ?? gi}>
              {group.label ? (
                <p className="mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                  {group.label}
                </p>
              ) : null}
              <div className="space-y-0.5">
                {group.items.map((n) => (
                  <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
                    <n.icon size={17} />
                    {n.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="sticky bottom-0 space-y-3 border-t border-line bg-surface px-4 py-4">
          <NavLink to="/settings" className={linkClass}>
            <SettingsIcon size={17} />
            Settings
          </NavLink>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 max-w-full flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 border-b border-line bg-plane/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-3 sm:gap-3 sm:px-6">
            <div className="lg:hidden">
              <Mark size={28} />
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              {showFilter ? <DateRangeFilter /> : null}
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 px-4 pb-32 pt-6 sm:px-6 lg:pb-12">
          {children}
        </main>
      </div>

      <nav className="no-print pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex w-full max-w-lg items-stretch justify-between gap-0.5 px-1 pt-1.5">
          {ALL_NAV.filter((n) => MOBILE_PRIMARY.includes(n.to)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-1 basis-0 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1 text-[10px] font-medium transition-colors',
                  isActive ? 'text-brand' : 'text-ink-3',
                )
              }
            >
              <n.icon size={19} className="shrink-0" />
              <span className="w-full truncate text-center leading-tight">{n.short}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex min-w-0 flex-1 basis-0 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1 text-[10px] font-medium text-ink-3"
          >
            <MoreHorizontal size={19} className="shrink-0" />
            <span className="w-full truncate text-center leading-tight">More</span>
          </button>
        </div>
      </nav>

      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-[21px] font-semibold tracking-[-0.025em] text-ink sm:text-[26px]">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] text-ink-3 sm:text-[13.5px]">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  )
}
