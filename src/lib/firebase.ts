import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Must stay firebaseapp.com. Firebase auto-registers only
  // <project>.firebaseapp.com/__/auth/handler as an authorised redirect URI on
  // the underlying Google OAuth client. Pointing this at the Hosting origin
  // instead produces Error 400 redirect_uri_mismatch, even though that origin
  // is listed under Firebase's own authorised domains. Those are two separate
  // lists: authorised domains say who may start a sign-in, the OAuth client
  // says where Google is willing to send the user back.
  //
  // Switching to the Hosting origin is worth doing for Safari and Firefox,
  // where the cross-origin handler is hampered by third-party storage
  // blocking, but it requires adding the redirect URI to the OAuth client in
  // the Google Cloud console first.
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(config)

/**
 * localStorage is deliberately first, ahead of IndexedDB.
 *
 * Auth's IndexedDB store guards every open with an `isHiding` flag set on
 * pagehide, and throws "Database is closing/hidden" if anything touches it
 * while the page is backgrounded. Both sign-in flows background the page: a
 * popup hides the opener, and a redirect navigates away mid-write. On Android
 * Chrome that is unavoidable, so the store is simply the wrong choice here.
 *
 * Note that ordering this list is the whole fix. The array is a availability
 * check at startup, not a runtime fallback, so listing IndexedDB first meant
 * Auth still selected it and still threw later.
 *
 * localStorage is synchronous and has no such guard. It persists across
 * restarts and works in an installed window, which is all this app needs.
 */
export const auth = initializeAuth(app, {
  persistence: [browserLocalPersistence, indexedDBLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
})

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

/** Offline-first: entries logged without signal sync when the connection returns. */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
