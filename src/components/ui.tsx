import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, Info, TriangleAlert, X } from 'lucide-react'

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------ *
 * Surfaces
 * ------------------------------------------------------------------ */

export function Card({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-surface shadow-card',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5 pb-3', className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-[13px] leading-snug text-ink-3">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">{children}</h2>
      {hint ? <span className="text-xs text-ink-3">{hint}</span> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Buttons
 * ------------------------------------------------------------------ */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-brand-ink hover:bg-brand-hover shadow-card',
  secondary: 'bg-surface text-ink border border-line hover:bg-surface-2',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'bg-critical text-white hover:brightness-95',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  loading,
  ...rest
}: {
  variant?: Variant
  size?: Size
  loading?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  )
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-3',
        'transition-colors hover:bg-surface-2 hover:text-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4 animate-spin', className)} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Form fields
 * ------------------------------------------------------------------ */

const FIELD_BASE =
  'w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-3 ' +
  'transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:opacity-50'

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      {label ? <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span> : null}
      {children}
      {error ? (
        <span className="mt-1 block text-[12px] text-critical">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[12px] text-ink-3">{hint}</span>
      ) : null}
    </label>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD_BASE, 'h-10', className)} {...rest} />
}

export function NumberInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      inputMode="decimal"
      className={cn(FIELD_BASE, 'tnum h-10 text-right [appearance:textfield]', className)}
      {...rest}
    />
  )
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(FIELD_BASE, 'min-h-20 py-2.5 leading-relaxed', className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(FIELD_BASE, 'h-10 cursor-pointer appearance-none pr-8', className)} {...rest}>
      {children}
    </select>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: Array<{ value: T; label: ReactNode }>
  className?: string
}) {
  return (
    <div className={cn('inline-flex rounded-xl border border-line bg-surface-2 p-0.5', className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-[10px] px-3 py-1.5 text-[13px] font-medium transition-colors',
            value === o.value ? 'bg-surface text-ink shadow-card' : 'text-ink-3 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-brand' : 'bg-surface-3',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-transform',
          checked ? 'translate-x-5.5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * Status & badges
 * ------------------------------------------------------------------ */

export type Tone = 'good' | 'warning' | 'serious' | 'critical' | 'neutral' | 'brand'

const TONE_STYLE: Record<Tone, { dot: string; text: string; bg: string }> = {
  good: { dot: 'bg-good', text: 'text-good-text', bg: 'bg-good/10' },
  warning: { dot: 'bg-warning', text: 'text-ink', bg: 'bg-warning/15' },
  serious: { dot: 'bg-serious', text: 'text-ink', bg: 'bg-serious/15' },
  critical: { dot: 'bg-critical', text: 'text-critical', bg: 'bg-critical/12' },
  neutral: { dot: 'bg-ink-3', text: 'text-ink-2', bg: 'bg-surface-2' },
  brand: { dot: 'bg-brand', text: 'text-brand', bg: 'bg-brand-soft' },
}

/** Status is never carried by colour alone. Every pill ships its label. */
export function StatusPill({ tone, children, icon }: { tone: Tone; children: ReactNode; icon?: ReactNode }) {
  const s = TONE_STYLE[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium',
        s.bg,
        s.text,
      )}
    >
      {icon ?? <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden />}
      {children}
    </span>
  )
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-ink-2',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Delta({ value, unit = '', invert = false }: { value: number; unit?: string; invert?: boolean }) {
  if (!Number.isFinite(value) || Math.round(value) === 0) {
    return <span className="text-[12px] text-ink-3">no change</span>
  }
  const up = value > 0
  const isGood = invert ? !up : up
  return (
    <span className={cn('inline-flex items-center gap-1 text-[12px] font-medium', isGood ? 'text-good-text' : 'text-critical')}>
      <span aria-hidden>{up ? '▲' : '▼'}</span>
      <span className="tnum">
        {up ? '+' : ''}
        {Math.round(value)}
        {unit}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * Modal
 * ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative flex max-h-[92vh] w-full animate-scale-in flex-col overflow-hidden rounded-t-3xl',
          'border border-line bg-surface shadow-float sm:rounded-2xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-ink">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-[13px] text-ink-3">{subtitle}</p> : null}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X size={17} />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer ? (
          <div className="pb-safe flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2/60 px-4 pt-3.5 sm:px-5 sm:pb-3.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmButton({
  onConfirm,
  label = 'Delete',
  className,
}: {
  onConfirm: () => void
  label?: string
  className?: string
}) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <Button
      size="sm"
      variant={armed ? 'danger' : 'ghost'}
      className={className}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
    >
      {armed ? 'Tap to confirm' : label}
    </Button>
  )
}

/* ------------------------------------------------------------------ *
 * Empty & loading states
 * ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium text-ink">{title}</p>
      {body ? <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-ink-3">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} />
}

/* ------------------------------------------------------------------ *
 * Toasts
 * ------------------------------------------------------------------ */

interface Toast {
  id: number
  message: string
  tone: 'good' | 'critical' | 'neutral'
}

const ToastCtx = createContext<(message: string, tone?: Toast['tone']) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const next = useRef(1)

  const push = useCallback((message: string, tone: Toast['tone'] = 'good') => {
    const id = next.current++
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])

  return (
    <ToastCtx.Provider value={push}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 px-4">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto flex animate-fade-up items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13px] font-medium text-ink shadow-float"
            >
              {t.tone === 'good' ? (
                <Check size={15} className="text-good" />
              ) : t.tone === 'critical' ? (
                <TriangleAlert size={15} className="text-critical" />
              ) : (
                <Info size={15} className="text-ink-3" />
              )}
              {t.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastCtx)
}

/* ------------------------------------------------------------------ *
 * Progress ring: the calorie goal dial
 * ------------------------------------------------------------------ */

export function ProgressRing({
  value,
  goal,
  size = 168,
  stroke = 12,
  label,
  unit = 'kcal',
  tone = 'brand',
}: {
  value: number
  goal: number
  size?: number
  stroke?: number
  label?: string
  unit?: string
  tone?: 'brand' | 'good' | 'warning' | 'critical'
}) {
  const id = useId()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0
  const over = goal > 0 && value > goal
  const dash = c * ratio
  const colorVar =
    tone === 'good' ? 'var(--good)' : tone === 'warning' ? 'var(--warning)' : tone === 'critical' ? 'var(--critical)' : 'var(--brand)'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colorVar} stopOpacity="0.75" />
            <stop offset="100%" stopColor={colorVar} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 700ms cubic-bezier(0.22,1,0.36,1)' }}
        />
        {over ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r - stroke - 3}
            fill="none"
            stroke="var(--critical)"
            strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * (r - stroke - 3) * Math.min((value - goal) / goal, 1)} ${2 * Math.PI * (r - stroke - 3)}`}
            strokeLinecap="round"
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-semibold leading-none tracking-[-0.02em] text-ink">
          {Math.round(value).toLocaleString()}
        </span>
        <span className="mt-1 text-[12px] text-ink-3">
          of {Math.round(goal).toLocaleString()} {unit}
        </span>
        {label ? <span className="mt-1.5 text-[12px] font-medium text-ink-2">{label}</span> : null}
      </div>
    </div>
  )
}

/** Horizontal goal meter used for macros, water and sleep. */
export function Meter({
  label,
  value,
  goal,
  unit,
  color,
}: {
  label: string
  value: number
  goal: number
  unit: string
  color: string
}) {
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-ink-2">{label}</span>
        <span className="tnum text-[13px] text-ink-3">
          <span className="font-semibold text-ink">{Math.round(value)}</span> / {Math.round(goal)} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${ratio * 100}%`, background: color }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Misc
 * ------------------------------------------------------------------ */

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* quota or private mode, non-fatal */
    }
  }, [key, value])
  return [value, setValue] as const
}

export function useMediaQuery(q: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setMatches(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return matches
}

export function useOnClickOutside<T extends HTMLElement>(ref: React.RefObject<T | null>, handler: () => void) {
  useEffect(() => {
    const on = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      handler()
    }
    document.addEventListener('mousedown', on)
    document.addEventListener('touchstart', on)
    return () => {
      document.removeEventListener('mousedown', on)
      document.removeEventListener('touchstart', on)
    }
  }, [ref, handler])
}

export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return useMemo(() => now, [now])
}
