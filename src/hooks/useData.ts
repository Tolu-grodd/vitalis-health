import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { DateRange } from '@/lib/dates'
import {
  DEFAULT_GYM_PROFILE,
  DEFAULT_SCHEDULE_CONFIG,
  DEFAULT_SETTINGS,
  type CustomFood,
  type FoodUsage,
  type GymProfile,
  type MealItem,
  type MealTemplate,
  type ScheduleConfig,
  type Settings,
} from '@/lib/types'

/** Collections whose documents carry a `date` and are queried by range. */
export type CollectionName = 'meals' | 'bp' | 'water' | 'sleep' | 'meds' | 'workouts'

/** Collections with no date dimension, read in full. */
export type FlatCollectionName =
  | 'schedule'
  | 'recipes'
  | 'mealplan'
  | 'exercises'
  | 'routines'
  | 'prs'
  | 'foodUsage'

function col(uid: string, name: string) {
  return collection(db, 'users', uid, name)
}

/**
 * Live window onto one collection for a date range. Filtering on the `date`
 * string keeps this to a single-field index, so no composite index is needed.
 */
export function useRangeCollection<T>(name: CollectionName, range: DateRange) {
  const { user } = useAuth()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Keep the previous render visible while a new range loads, so no skeleton flash.
  const seeded = useRef(false)

  useEffect(() => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    if (!seeded.current) setLoading(true)
    const q = query(
      col(user.uid, name),
      where('date', '>=', range.from),
      where('date', '<=', range.to),
      orderBy('date', 'desc'),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T))
        setLoading(false)
        seeded.current = true
        setError(null)
      },
      (e) => {
        setError(e.message)
        setLoading(false)
      },
    )
    return unsub
  }, [user, name, range.from, range.to])

  return { items, loading, error }
}

/**
 * Live view of a collection with no date dimension: the schedule template,
 * recipes, routines, saved records. Small by nature, so it is read whole.
 */
export function useFlatCollection<T>(name: FlatCollectionName, orderField?: string) {
  const { user } = useAuth()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    const base = col(user.uid, name)
    const q = orderField ? query(base, orderBy(orderField)) : query(base)
    return onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T))
        setLoading(false)
      },
      () => setLoading(false),
    )
  }, [user, name, orderField])

  return { items, loading }
}

export function useMutations(name: CollectionName | FlatCollectionName) {
  const { user } = useAuth()
  return useMemo(
    () => ({
      async create(data: Record<string, unknown>) {
        if (!user) throw new Error('Not signed in')
        return addDoc(col(user.uid, name), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      },
      /** Upsert at a known id, used where the id is derived from the content. */
      async put(id: string, data: Record<string, unknown>) {
        if (!user) throw new Error('Not signed in')
        return setDoc(doc(db, 'users', user.uid, name, id), { ...data, updatedAt: serverTimestamp() }, { merge: true })
      },
      async update(id: string, data: Record<string, unknown>) {
        if (!user) throw new Error('Not signed in')
        return updateDoc(doc(db, 'users', user.uid, name, id), { ...data, updatedAt: serverTimestamp() })
      },
      async remove(id: string) {
        if (!user) throw new Error('Not signed in')
        return deleteDoc(doc(db, 'users', user.uid, name, id))
      },
    }),
    [user, name],
  )
}

/* ---------------- settings ---------------- */

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS)
      setLoading(false)
      return
    }
    const ref = doc(db, 'users', user.uid, 'meta', 'settings')
    return onSnapshot(
      ref,
      (snap) => {
        setSettings(snap.exists() ? { ...DEFAULT_SETTINGS, ...(snap.data() as Settings) } : DEFAULT_SETTINGS)
        setLoading(false)
      },
      () => setLoading(false),
    )
  }, [user])

  async function save(patch: Partial<Settings>) {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid, 'meta', 'settings'), patch, { merge: true })
  }

  return { settings, save, loading }
}

/* ---------------- single meta documents ---------------- */

/** One document under `meta`, merged over a default. Used for the gym profile
 *  and the schedule configuration, both of which are one row, not a list. */
function useMetaDoc<T extends object>(name: string, fallback: T) {
  const { user } = useAuth()
  const [value, setValue] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setValue(fallback)
      setLoading(false)
      return
    }
    return onSnapshot(
      doc(db, 'users', user.uid, 'meta', name),
      (snap) => {
        setValue(snap.exists() ? { ...fallback, ...(snap.data() as T) } : fallback)
        setLoading(false)
      },
      () => setLoading(false),
    )
    // `fallback` is a module-level constant at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, name])

  const save = useMemo(
    () => async (patch: Partial<T>) => {
      if (!user) return
      await setDoc(doc(db, 'users', user.uid, 'meta', name), patch, { merge: true })
    },
    [user, name],
  )

  return { value, save, loading }
}

export function useGymProfile() {
  const { value, save, loading } = useMetaDoc<GymProfile>('gym', DEFAULT_GYM_PROFILE)
  return { profile: value, saveProfile: save, loading }
}

export function useScheduleConfig() {
  const { value, save, loading } = useMetaDoc<ScheduleConfig>('schedule', DEFAULT_SCHEDULE_CONFIG)
  return { config: value, saveConfig: save, loading }
}

/* ---------------- food usage ---------------- */

/**
 * The foods you have actually logged, ranked so the picker can put them first.
 *
 * Kept separate from saved foods on purpose: saved foods are ones you chose to
 * keep, usage is everything you have ever eaten. Ranking on usage is what stops
 * the picker showing the same alphabetical wall every time.
 */
export function useFoodUsage() {
  const { items } = useFlatCollection<FoodUsage>('foodUsage')
  return items
}

export function useRecordFoodUse() {
  const { user } = useAuth()
  return useMemo(
    () => async (items: MealItem[]) => {
      if (!user) return
      const seen = new Set<string>()
      const today = new Date().toISOString().slice(0, 10)

      // One batch, so logging a ten component meal is a single round trip.
      const batch = writeBatch(db)
      let queued = 0

      for (const i of items) {
        const name = i.name.trim()
        if (!name) continue
        const id = foodSlug(name)
        if (!id || seen.has(id)) continue
        seen.add(id)

        batch.set(
          doc(db, 'users', user.uid, 'foodUsage', id),
          {
            name,
            count: increment(1),
            lastUsed: today,
            per100: i.per100 ?? null,
            unit: i.unit ?? 'g',
            qty: i.qty ?? null,
            unitGrams: i.unitGrams ?? null,
            unitLabel: i.unitLabel ?? null,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
        queued++
      }

      if (queued) await batch.commit()
    },
    [user],
  )
}

export function foodSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
}

/* ---------------- custom foods & meal templates ---------------- */

export function useCustomFoods() {
  const { user } = useAuth()
  const [foods, setFoods] = useState<CustomFood[]>([])

  useEffect(() => {
    if (!user) {
      setFoods([])
      return
    }
    return onSnapshot(query(col(user.uid, 'foods'), orderBy('name')), (snap) =>
      setFoods(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CustomFood)),
    )
  }, [user])

  async function saveFood(food: Omit<CustomFood, 'id'>) {
    if (!user) return
    await addDoc(col(user.uid, 'foods'), { ...food, createdAt: serverTimestamp() })
  }

  async function removeFood(id: string) {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'foods', id))
  }

  return { foods, saveFood, removeFood }
}

export function useMealTemplates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<MealTemplate[]>([])

  useEffect(() => {
    if (!user) {
      setTemplates([])
      return
    }
    return onSnapshot(query(col(user.uid, 'templates'), orderBy('name')), (snap) =>
      setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MealTemplate)),
    )
  }, [user])

  async function saveTemplate(t: Omit<MealTemplate, 'id'>) {
    if (!user) return
    await addDoc(col(user.uid, 'templates'), { ...t, createdAt: serverTimestamp() })
  }

  async function removeTemplate(id: string) {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'templates', id))
  }

  return { templates, saveTemplate, removeTemplate }
}

/** One-shot fetch outside the live range, used by the export builder. */
export function useFetchRange() {
  const { user } = useAuth()
  return useMemo(
    () => async <T,>(name: CollectionName, from: string, to: string): Promise<T[]> => {
      if (!user) return []
      const snap = await getDocs(
        query(col(user.uid, name), where('date', '>=', from), where('date', '<=', to), orderBy('date', 'desc'), fbLimit(5000)),
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T)
    },
    [user],
  )
}
