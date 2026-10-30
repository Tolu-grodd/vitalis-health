import type { BPReading, Meal, MealItem, LibraryFood } from './types'

/* ------------------------------------------------------------------ *
 * Blood pressure classification (ACC/AHA 2017 adult categories)
 * ------------------------------------------------------------------ */

export type BPCategoryId = 'low' | 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis'

export interface BPCategory {
  id: BPCategoryId
  label: string
  /** Status token: reserved colours, never reused as a chart series. */
  tone: 'good' | 'warning' | 'serious' | 'critical' | 'neutral'
  advice: string
}

const CATEGORIES: Record<BPCategoryId, BPCategory> = {
  low: {
    id: 'low',
    label: 'Low',
    tone: 'warning',
    advice: 'Below the typical range. Worth mentioning to your doctor if it comes with dizziness or fainting.',
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    tone: 'good',
    advice: 'Within the healthy range. Keep doing what you are doing.',
  },
  elevated: {
    id: 'elevated',
    label: 'Elevated',
    tone: 'warning',
    advice: 'Not high blood pressure yet, but likely to develop into it without changes.',
  },
  stage1: {
    id: 'stage1',
    label: 'Hypertension stage 1',
    tone: 'serious',
    advice: 'Lifestyle changes are usually the first step; a doctor may consider medication.',
  },
  stage2: {
    id: 'stage2',
    label: 'Hypertension stage 2',
    tone: 'critical',
    advice: 'Usually treated with medication alongside lifestyle changes. Speak to a doctor.',
  },
  crisis: {
    id: 'crisis',
    label: 'Hypertensive crisis',
    tone: 'critical',
    advice: 'Re-measure after 5 minutes. If it stays this high, seek medical attention immediately.',
  },
}

/**
 * Order matters: crisis wins outright, then the higher of the two numbers sets
 * the stage, so a reading is classified by whichever value is worse.
 */
export function classifyBP(systolic: number, diastolic: number): BPCategory {
  if (systolic > 180 || diastolic > 120) return CATEGORIES.crisis
  if (systolic >= 140 || diastolic >= 90) return CATEGORIES.stage2
  if (systolic >= 130 || diastolic >= 80) return CATEGORIES.stage1
  if (systolic >= 120) return CATEGORIES.elevated
  if (systolic < 90 || diastolic < 60) return CATEGORIES.low
  return CATEGORIES.normal
}

export const BP_CATEGORY_LIST = Object.values(CATEGORIES)

/** Mean arterial pressure, a single number clinicians often prefer. */
export function meanArterialPressure(systolic: number, diastolic: number): number {
  return Math.round(diastolic + (systolic - diastolic) / 3)
}

export function pulsePressure(systolic: number, diastolic: number): number {
  return systolic - diastolic
}

/* ------------------------------------------------------------------ *
 * Meal maths
 * ------------------------------------------------------------------ */

export interface Totals {
  kcal: number
  protein: number
  carbs: number
  fat: number
  grams: number
}

export const ZERO_TOTALS: Totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, grams: 0 }

export function sumItems(items: MealItem[]): Totals {
  return items.reduce<Totals>(
    (acc, i) => ({
      kcal: acc.kcal + (i.kcal || 0),
      protein: acc.protein + (i.protein || 0),
      carbs: acc.carbs + (i.carbs || 0),
      fat: acc.fat + (i.fat || 0),
      grams: acc.grams + (i.grams || 0),
    }),
    { ...ZERO_TOTALS },
  )
}

export function sumMeals(meals: Meal[]): Totals {
  return meals.reduce<Totals>(
    (acc, m) => ({
      kcal: acc.kcal + (m.kcal || 0),
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
      grams: acc.grams + (m.grams || 0),
    }),
    { ...ZERO_TOTALS },
  )
}

/** Scale a per-100g library food to an actual weighed portion. */
export function scaleFood(food: LibraryFood, grams: number): Omit<MealItem, 'key'> {
  const f = grams / 100
  return {
    name: food.name,
    grams: round1(grams),
    kcal: Math.round(food.kcal * f),
    protein: round1(food.protein * f),
    carbs: round1(food.carbs * f),
    fat: round1(food.fat * f),
  }
}

/** Recompute a row's numbers from its per-100 g basis at a given weight. */
export function scaleFromPer100(
  per100: { kcal: number; protein: number; carbs: number; fat: number },
  grams: number,
): { kcal: number; protein: number; carbs: number; fat: number } {
  const f = grams / 100
  return {
    kcal: Math.round(per100.kcal * f),
    protein: round1(per100.protein * f),
    carbs: round1(per100.carbs * f),
    fat: round1(per100.fat * f),
  }
}

/** Size formatting lives with the measure system. Re-exported so the many
 *  existing call sites that import it from here keep working. */
export { describeSize, unitShort, normalizeItem } from './measures'

/**
 * A readable name built from what the meal actually contains, used when no
 * name was typed. Beats falling back to the slot, which just labels every
 * evening meal "Dinner" and tells you nothing in a list.
 */
export function defaultMealName(items: MealItem[]): string {
  const names = items
    .map((i) => i.name.trim())
    .filter(Boolean)
    .filter((n, i, arr) => arr.indexOf(n) === i)
  if (!names.length) return ''
  if (names.length <= 3) return names.join(', ')
  return `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`
}

/** Calories implied by the macros, used to sanity-check a manual entry. */
export function kcalFromMacros(protein: number, carbs: number, fat: number): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9)
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function pct(part: number, whole: number): number {
  if (!whole) return 0
  return Math.round((part / whole) * 100)
}

/** Share of energy from each macro, normalised to 100 %. */
export function macroEnergySplit(t: Totals): { protein: number; carbs: number; fat: number } {
  const p = t.protein * 4
  const c = t.carbs * 4
  const f = t.fat * 9
  const total = p + c + f
  if (!total) return { protein: 0, carbs: 0, fat: 0 }
  return {
    protein: Math.round((p / total) * 100),
    carbs: Math.round((c / total) * 100),
    fat: Math.round((f / total) * 100),
  }
}

/* ------------------------------------------------------------------ *
 * Small stats helpers
 * ------------------------------------------------------------------ */

export function mean(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** Pearson r. Returns null when there aren't enough paired points to mean anything. */
export function correlation(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length)
  if (n < 5) return null
  const mx = mean(xs.slice(0, n))
  const my = mean(ys.slice(0, n))
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx
    const b = ys[i] - my
    num += a * b
    dx += a * a
    dy += b * b
  }
  if (!dx || !dy) return null
  return num / Math.sqrt(dx * dy)
}

export function bpAverages(readings: BPReading[]): { systolic: number; diastolic: number; pulse: number | null } {
  if (!readings.length) return { systolic: 0, diastolic: 0, pulse: null }
  const pulses = readings.map((r) => r.pulse).filter((p): p is number => typeof p === 'number' && p > 0)
  return {
    systolic: Math.round(mean(readings.map((r) => r.systolic))),
    diastolic: Math.round(mean(readings.map((r) => r.diastolic))),
    pulse: pulses.length ? Math.round(mean(pulses)) : null,
  }
}

export function formatKcal(n: number): string {
  return Math.round(n).toLocaleString()
}
