import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Download, RefreshCw, Smartphone, X } from 'lucide-react'
import { Button, Card, StatusPill, cn } from './ui'

/** The event Chromium fires when the site meets the installability criteria. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** True when the app is running in its own window rather than a browser tab. */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    // iOS Safari predates the display-mode query.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/**
 * Captures the install event so the app can offer installation on its own terms
 * rather than relying on the browser's address bar affordance, which is easy to
 * miss and is what leads people to bookmark a shortcut instead.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandalone())

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!deferred) return 'unavailable'
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferred(null)
    return outcome
  }

  return { canInstall: !!deferred, installed, install }
}

/**
 * Drops the service worker and its cached shell, then reloads from the network.
 *
 * Clearing cookies does not do this, which is why a stale build can survive
 * what looks like a thorough clear. Logged data is untouched: it lives in
 * Firestore's own store, not in the caches removed here.
 */
export async function resetAppShell(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch {
    /* best effort, the reload below still helps */
  } finally {
    window.location.reload()
  }
}

/* ------------------------------------------------------------------ *
 * Update notice
 * ------------------------------------------------------------------ */

export function ServiceWorkerNotice() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Look for a new build every hour while the app stays open.
      if (registration) setInterval(() => registration.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4 lg:bottom-6">
      <div className="flex animate-fade-up items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-float">
        <RefreshCw size={16} className="shrink-0 text-brand" />
        <span className="text-[13px] text-ink">A new version of Vitalis is ready.</span>
        <Button size="sm" variant="primary" onClick={() => updateServiceWorker(true)}>
          Reload
        </Button>
        <button
          onClick={() => setNeedRefresh(false)}
          aria-label="Dismiss"
          className="rounded-lg p-1 text-ink-3 hover:bg-surface-2"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Install card, shown in Settings
 * ------------------------------------------------------------------ */

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function InstallCard({ className }: { className?: string }) {
  const { canInstall, installed, install } = useInstallPrompt()
  const [message, setMessage] = useState<string | null>(null)

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Install Vitalis</h3>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Runs in its own window with its own icon, no browser bar, and works offline.
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Smartphone size={18} />
        </span>
      </div>

      <div className="mt-4">
        {installed ? (
          <StatusPill tone="good">Installed and running as an app</StatusPill>
        ) : canInstall ? (
          <Button
            variant="primary"
            onClick={async () => {
              const outcome = await install()
              if (outcome === 'dismissed') setMessage('Install cancelled. You can start it again any time.')
            }}
          >
            <Download size={16} />
            Install as an app
          </Button>
        ) : isIOS() ? (
          <p className="text-[13px] leading-relaxed text-ink-2">
            On iPhone and iPad, open this page in Safari, tap the Share button, then choose Add to Home Screen. iOS does
            not allow apps to trigger this themselves.
          </p>
        ) : (
          <p className="text-[13px] leading-relaxed text-ink-2">
            Your browser has not offered an install yet. In Chrome, open the menu and look for Install Vitalis, or the
            install icon at the right of the address bar. If it is missing, the app may already be installed.
          </p>
        )}
        {message ? <p className="mt-2 text-[12.5px] text-ink-3">{message}</p> : null}
      </div>

      <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-[12.5px] text-ink-3">
        <li>Opens from your app drawer or home screen with the Vitalis icon.</li>
        <li>Long press the icon for shortcuts straight to a meal, workout or reading.</li>
        <li>Entries made without signal sync as soon as you are back online.</li>
      </ul>
    </Card>
  )
}
