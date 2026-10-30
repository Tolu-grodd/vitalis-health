import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

interface AuthValue {
  user: User | null
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthValue>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
})

/**
 * Set just before a redirect leaves the page, so that if we come back without
 * a session we can say so instead of silently showing the sign-in page again.
 */
const REDIRECT_FLAG = 'vitalis.redirectPending'

function readableError(e: unknown): string {
  const code = (e as { code?: string }).code ?? ''
  const message = (e as Error).message ?? String(e)
  if (message.includes('Database is closing/hidden')) {
    return 'Sign-in was interrupted because the page went to the background. Trying again with a full page redirect.'
  }
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised for sign-in. Add it under Firebase Auth, Settings, Authorised domains.'
    case 'auth/network-request-failed':
      return 'Could not reach the sign-in service. Check your connection and try again.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.'
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled on this project yet.'
    default:
      return message
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(
    () =>
      onAuthStateChanged(
        auth,
        (u) => {
          setUser(u)
          setLoading(false)
        },
        (e) => {
          setError(readableError(e))
          setLoading(false)
        },
      ),
    [],
  )

  // Completes a redirect sign-in and surfaces anything that went wrong on the
  // way back, which onAuthStateChanged alone would swallow. A redirect that
  // returns with no session at all is the third-party storage failure, and it
  // reports nothing on its own, so the flag is how we notice.
  useEffect(() => {
    let cancelled = false
    getRedirectResult(auth)
      .then((result) => {
        if (cancelled) return
        const pending = sessionStorage.getItem(REDIRECT_FLAG)
        sessionStorage.removeItem(REDIRECT_FLAG)
        if (pending && !result && !auth.currentUser) {
          setError(
            'Sign-in came back without a session, which usually means this browser blocked the storage the redirect needs. Tap Continue with Google again and it will use a popup instead.',
          )
        }
      })
      .catch((e) => {
        if (cancelled) return
        sessionStorage.removeItem(REDIRECT_FLAG)
        setError(readableError(e))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      error,
      /**
       * Popup first, on every device including phones.
       *
       * A popup hands the credential straight back to this page through
       * postMessage, so it never depends on storage written under the auth
       * domain. A redirect does, and browsers that partition third-party
       * storage silently drop it, which lands you back on the sign-in page
       * with no error at all. Redirect is kept only for the case where the
       * popup cannot open.
       */
      async signIn() {
        setError(null)

        try {
          await signInWithPopup(auth, googleProvider)
          sessionStorage.removeItem(REDIRECT_FLAG)
          return
        } catch (e) {
          const code = (e as { code?: string }).code ?? ''
          const message = (e as Error).message ?? ''

          if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return

          const popupUnusable =
            code === 'auth/popup-blocked' ||
            code === 'auth/operation-not-supported-in-this-environment' ||
            code === 'auth/web-storage-unsupported' ||
            message.includes('Database is closing/hidden')

          if (popupUnusable) {
            try {
              sessionStorage.setItem(REDIRECT_FLAG, '1')
              await signInWithRedirect(auth, googleProvider)
              return
            } catch (redirectError) {
              sessionStorage.removeItem(REDIRECT_FLAG)
              setError(readableError(redirectError))
              return
            }
          }

          setError(readableError(e))
        }
      },
      async signOut() {
        await fbSignOut(auth)
      },
    }),
    [user, loading, error],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(Ctx)
}
