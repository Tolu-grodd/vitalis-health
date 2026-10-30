import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { buildRange, type DateRange, type RangeId } from '@/lib/dates'
import { displayPrefs } from '@/lib/prefs'

interface RangeValue {
  range: DateRange
  setPreset: (id: RangeId) => void
  setCustom: (from: string, to: string) => void
}

const Ctx = createContext<RangeValue | null>(null)

/** One range for the whole app. Every chart and list re-renders against the
 *  same slice, so filters never live inside an individual card. */
export function RangeProvider({ children }: { children: ReactNode }) {
  // Seeded from the mirrored preference so the app opens on the chosen preset
  // rather than snapping to it once Firestore replies.
  const [range, setRange] = useState<DateRange>(() => buildRange(displayPrefs().defaultRange))

  const value = useMemo<RangeValue>(
    () => ({
      range,
      setPreset: (id) => setRange(buildRange(id)),
      setCustom: (from, to) => setRange(buildRange('custom', from <= to ? from : to, to >= from ? to : from)),
    }),
    [range],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRange() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useRange must be used inside RangeProvider')
  return v
}
