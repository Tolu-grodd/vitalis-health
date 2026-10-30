import type { DayIndex, Settings } from './types'

/**
 * A few settings affect pure formatting helpers that are called from everywhere
 * and have no access to React context. Rather than thread them through every
 * call site, they are mirrored here and into localStorage, so the very first
 * paint is already correct rather than flipping once Firestore responds.
 *
 * Changing one of these remounts the routed subtree (see App), which is what
 * makes already-rendered screens pick the new value up.
 */
export interface DisplayPrefs {
  timeFormat: '12h' | '24h'
  weekStartsOn: 'mon' | 'sun'
  weightUnit: 'kg' | 'lb'
  defaultRange: Settings['defaultRange']
}

const KEY = 'vitalis.display'

const FALLBACK: DisplayPrefs = {
  timeFormat: '12h',
  weekStartsOn: 'mon',
  weightUnit: 'kg',
  defaultRange: '7d',
}

let current: DisplayPrefs = load()

function load(): DisplayPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...FALLBACK, ...(JSON.parse(raw) as DisplayPrefs) } : FALLBACK
  } catch {
    return FALLBACK
  }
}

export function displayPrefs(): DisplayPrefs {
  return current
}

/** Returns true when something actually changed, so callers can force a remount. */
export function syncDisplayPrefs(s: Settings): boolean {
  const next: DisplayPrefs = {
    timeFormat: s.timeFormat,
    weekStartsOn: s.weekStartsOn,
    weightUnit: s.weightUnit,
    defaultRange: s.defaultRange,
  }
  const changed = JSON.stringify(next) !== JSON.stringify(current)
  current = next
  if (changed) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* private mode, non-fatal */
    }
  }
  return changed
}

/* ------------------------------------------------------------------ *
 * Week layout
 * ------------------------------------------------------------------ */

/** Day columns in display order. Storage always uses 0 = Monday. */
export function dayOrder(): DayIndex[] {
  return current.weekStartsOn === 'sun'
    ? ([6, 0, 1, 2, 3, 4, 5] as DayIndex[])
    : ([0, 1, 2, 3, 4, 5, 6] as DayIndex[])
}

/** How many days back from a given JS date to reach the start of its week. */
export function daysFromWeekStart(jsDay: number): number {
  return current.weekStartsOn === 'sun' ? jsDay : (jsDay + 6) % 7
}

/* ------------------------------------------------------------------ *
 * Weight units
 * ------------------------------------------------------------------ */

const LB_PER_KG = 2.2046226218

/** Weights are always stored in kilograms. These convert for display only. */
export function kgToDisplay(kg: number): number {
  return current.weightUnit === 'lb' ? Math.round(kg * LB_PER_KG * 10) / 10 : kg
}

export function displayToKg(value: number): number {
  return current.weightUnit === 'lb' ? Math.round((value / LB_PER_KG) * 100) / 100 : value
}

export function weightUnit(): 'kg' | 'lb' {
  return current.weightUnit
}

export function formatWeight(kg: number, decimals = 0): string {
  const v = kgToDisplay(kg)
  return `${v.toFixed(decimals)} ${current.weightUnit}`
}
