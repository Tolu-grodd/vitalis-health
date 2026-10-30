import { useState } from 'react'
import { Activity, Heart, RotateCcw, ShieldCheck, TrendingUp, UtensilsCrossed } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { resetAppShell } from '@/components/PWA'
import { Button, Spinner } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

const FEATURES = [
  {
    icon: UtensilsCrossed,
    title: 'Meals, component by component',
    body: 'Log every part of a meal with its own weight and calories: rice, egg, meat, beans. Totals are worked out for you.',
  },
  {
    icon: Heart,
    title: 'Blood pressure, properly classified',
    body: 'Every reading is time-stamped and graded against the ACC/AHA categories, with trends you can hand to a doctor.',
  },
  {
    icon: Activity,
    title: 'Water, sleep and medication',
    body: 'One timeline for everything that moves the numbers, so patterns stop hiding between apps.',
  },
  {
    icon: TrendingUp,
    title: 'Insights that do the reading',
    body: 'Weekly trends, best and worst days, and how your calories track against your blood pressure.',
  },
]

export function Login() {
  const { signIn, loading, error } = useAuth()
  const [resetting, setResetting] = useState(false)

  return (
    <div className="grid min-h-full lg:grid-cols-[1fr_1.1fr]">
      {/* Sign-in column */}
      <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Logo />

          <h1 className="mt-10 text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
            Your health record,
            <br />
            kept properly.
          </h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">
            Calories, blood pressure and daily vitals. Every entry is stamped with the date and time it happened,
            charted the moment you save it.
          </p>

          <Button
            variant="primary"
            size="lg"
            className="mt-8 w-full"
            onClick={() => signIn()}
            disabled={loading}
          >
            {loading ? (
              <Spinner />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
                />
                <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          {error ? (
            <p className="mt-3 rounded-xl border border-critical/30 bg-critical/10 px-3 py-2 text-[12.5px] text-critical">
              {error}
            </p>
          ) : null}

          <button
            onClick={() => {
              setResetting(true)
              resetAppShell()
            }}
            disabled={resetting}
            className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3 underline underline-offset-2 transition-colors hover:text-ink disabled:opacity-60"
          >
            <RotateCcw size={13} />
            {resetting ? 'Reloading a fresh copy' : 'Sign-in not working? Reload a fresh copy'}
          </button>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-3">
            Clears this device's cached copy of the app and fetches the latest one. Your logged data is not affected.
          </p>

          <p className="mt-6 flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-3">
            <ShieldCheck size={15} className="mt-px shrink-0" />
            Your entries are stored against your Google account and are visible only to you. Nothing is shared.
          </p>
        </div>
      </div>

      {/* Feature column */}
      <div className="relative hidden overflow-hidden border-l border-line bg-surface lg:block">
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 22% 18%, var(--brand-soft) 0, transparent 42%), radial-gradient(circle at 78% 78%, var(--surface-2) 0, transparent 46%)',
          }}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-center px-16 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">What you get</p>
          <ul className="mt-8 space-y-7">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-brand shadow-card">
                  <f.icon size={18} />
                </span>
                <div>
                  <p className="text-[14.5px] font-semibold tracking-[-0.01em] text-ink">{f.title}</p>
                  <p className="mt-1 max-w-md text-[13.5px] leading-relaxed text-ink-2">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-12 max-w-md text-[12px] leading-relaxed text-ink-3">
            Vitalis records what you tell it and charts it back. It is not a medical device and does not diagnose,
            treat or give medical advice. Talk to a clinician about anything that concerns you.
          </p>
        </div>
      </div>
    </div>
  )
}
