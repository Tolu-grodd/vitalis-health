import type { Timestamp } from 'firebase/firestore'

/** Every record carries a local calendar day (`YYYY-MM-DD`), a clock time
 *  (`HH:mm`) and an absolute instant. The day string is what all filtering and
 *  grouping runs on, so a meal logged at 00:30 stays on the day you ate it. */
export interface Stamped {
  id: string
  date: string
  time: string
  at: Timestamp | { seconds: number; nanoseconds: number }
  createdAt?: unknown
  updatedAt?: unknown
}

export interface MealItem {
  /** Stable key for React lists; not persisted meaningfully. */
  key: string
  name: string
  /** Portion weight in grams. Optional, since you can log calories alone. */
  grams: number | null
  kcal: number
  protein: number
  carbs: number
  fat: number
  /** Per-100 g basis kept when the row came from the food library, so changing
   *  the weight later rescales instead of silently keeping stale numbers.
   *  Null for a fully manual row. */
  per100?: { kcal: number; protein: number; carbs: number; fat: number } | null

  /** Measure id the size was entered in: g, ml, cup, tbsp, tsp, portion,
   *  piece, slice. Grams stay canonical, so nothing downstream needs to know
   *  which unit was used. */
  unit?: string
  /** How many of `unit`. Grams are qty x unitGrams. */
  qty?: number | null
  /** Weight of one of `unit` at the time of logging, kept so a row still reads
   *  correctly even if the library later revises its serving size. */
  unitGrams?: number | null
  /** Display name of the unit, for example "1 plate" or "Cup". */
  unitLabel?: string | null

  /** Written by builds before the measure system. Read by the normaliser in
   *  lib/measures so old meals keep their portions. Not written any more. */
  portions?: number | null
  portionGrams?: number | null
  portionLabel?: string | null
}

export type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Other'

export interface Meal extends Stamped {
  /** Free label: "Breakfast", "Second lunch", anything. Unlimited meals/day. */
  name: string
  slot: MealSlot
  items: MealItem[]
  kcal: number
  protein: number
  carbs: number
  fat: number
  grams: number
  note?: string
}

export interface BPReading extends Stamped {
  systolic: number
  diastolic: number
  pulse: number | null
  arm: 'left' | 'right' | null
  position: 'sitting' | 'standing' | 'lying' | null
  note?: string
}

export interface WaterEntry extends Stamped {
  ml: number
}

export interface SleepEntry extends Stamped {
  hours: number
  quality: 1 | 2 | 3 | 4 | 5
  bedtime?: string
  wake?: string
  note?: string
}

export interface MedEntry extends Stamped {
  name: string
  dose: string
  taken: boolean
  note?: string
}

/** A user-saved food. `per` is the basis the macros are quoted against. */
export interface CustomFood {
  id: string
  name: string
  per100g: boolean
  kcal: number
  protein: number
  carbs: number
  fat: number
  category?: string
  /** Typical portion in grams, so your own foods behave like library ones. */
  serving?: number | null
  servingLabel?: string | null
  cupGrams?: number | null
  spoonGrams?: number | null
  pieceGrams?: number | null
  pieceLabel?: string | null
  createdAt?: unknown
}

/**
 * A food you have actually logged, with how often and how you last measured it.
 *
 * This is what makes the picker useful over time: the things you eat rise to
 * the top, and picking one restores the portion you used last rather than a
 * generic serving. Written on every meal save, keyed by a slug of the name.
 */
export interface FoodUsage {
  id: string
  name: string
  category: string
  count: number
  /** Local day key of the most recent use, for recency ranking. */
  lastUsed: string
  /** Per 100 g basis, so a repeat pick rescales correctly. */
  per100?: { kcal: number; protein: number; carbs: number; fat: number } | null
  /** The measure and amount used last time. */
  unit?: string | null
  qty?: number | null
  unitGrams?: number | null
  unitLabel?: string | null
  serving?: number | null
  servingLabel?: string | null
  updatedAt?: unknown
}

export interface MealTemplate {
  id: string
  name: string
  items: MealItem[]
  createdAt?: unknown
}

export interface Settings {
  displayName?: string

  /* nutrition */
  calorieGoal: number
  proteinGoal: number
  carbGoal: number
  fatGoal: number
  waterGoalMl: number
  /** The four one-tap amounts on the water card. */
  waterQuickAmounts: number[]
  sleepGoalHours: number

  /* blood pressure */
  bpTargetSystolic: number
  bpTargetDiastolic: number
  bpDefaultArm: 'left' | 'right'
  bpDefaultPosition: 'sitting' | 'standing' | 'lying'

  /* training */
  weightUnit: 'kg' | 'lb'
  restTimerSeconds: number
  /** How many empty sets a newly added exercise starts with. */
  defaultSets: number

  /* display */
  theme: 'system' | 'light' | 'dark'
  timeFormat: '12h' | '24h'
  weekStartsOn: 'mon' | 'sun'
  /** Which range preset the app opens on. */
  defaultRange: '7d' | '14d' | '30d' | '90d' | 'mtd'
}

export const DEFAULT_SETTINGS: Settings = {
  calorieGoal: 2200,
  proteinGoal: 130,
  carbGoal: 250,
  fatGoal: 70,
  waterGoalMl: 2500,
  waterQuickAmounts: [250, 330, 500, 750],
  sleepGoalHours: 8,
  bpTargetSystolic: 120,
  bpTargetDiastolic: 80,
  bpDefaultArm: 'left',
  bpDefaultPosition: 'sitting',
  weightUnit: 'kg',
  restTimerSeconds: 90,
  defaultSets: 3,
  theme: 'system',
  timeFormat: '12h',
  weekStartsOn: 'mon',
  defaultRange: '7d',
}

/* ------------------------------------------------------------------ *
 * Schedule: a repeating template week. Blocks carry no date, only a
 * weekday, so the same timetable applies to every week.
 * ------------------------------------------------------------------ */

/** 0 = Monday through 6 = Sunday. */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export interface ScheduleBlock {
  id: string
  day: DayIndex
  /** Inclusive start and exclusive end, both 'HH:mm' on a 24 hour clock. */
  start: string
  end: string
  title: string
  category: string
  /** Index into the schedule colour slots, 0 to 7. */
  color: number
  note?: string
}

export type Granularity = 10 | 15 | 30 | 60

export interface ScheduleConfig {
  granularity: Granularity
  dayStart: string
  dayEnd: string
  categories: Array<{ name: string; color: number }>
}

export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  granularity: 30,
  dayStart: '06:00',
  dayEnd: '23:00',
  categories: [
    { name: 'Work', color: 0 },
    { name: 'Gym', color: 2 },
    { name: 'Meals', color: 3 },
    { name: 'Study', color: 6 },
    { name: 'Rest', color: 4 },
    { name: 'Errands', color: 1 },
  ],
}

/* ------------------------------------------------------------------ *
 * Gym
 * ------------------------------------------------------------------ */

export type ExerciseKind = 'weight' | 'bodyweight' | 'timed' | 'cardio'

export interface ExerciseDef {
  name: string
  /** Primary body part this exercise is counted against. */
  group: string
  secondary?: string[]
  equipment: string
  kind: ExerciseKind
  custom?: boolean
}

export interface CustomExercise extends ExerciseDef {
  id: string
  createdAt?: unknown
}

export interface WorkoutSet {
  key: string
  weight: number | null
  reps: number | null
  /** Held time in seconds, for planks and similar. */
  seconds: number | null
  /** Distance in km, for cardio. */
  distance: number | null
  /** Rate of perceived exertion, 1 to 10. */
  rpe: number | null
  warmup: boolean
  done: boolean
}

export interface WorkoutExercise {
  key: string
  name: string
  group: string
  equipment: string
  kind: ExerciseKind
  sets: WorkoutSet[]
  note?: string
}

export interface Workout extends Stamped {
  name: string
  exercises: WorkoutExercise[]
  durationMin: number | null
  note?: string
  /** Denormalised so lists and charts do not have to walk every set. */
  volume: number
  totalSets: number
  totalReps: number
  groups: string[]
  xp: number
  prCount: number
}

/** One row per exercise, holding all-time bests. Updated when a workout saves,
 *  because a date-ranged query cannot see beyond its own window. */
export interface PersonalRecord {
  id: string
  name: string
  group: string
  bestWeight: number
  bestWeightReps: number
  bestReps: number
  best1RM: number
  bestVolume: number
  bestSeconds: number
  bestDistance: number
  date: string
  updatedAt?: unknown
}

export interface Routine {
  id: string
  name: string
  note?: string
  exercises: Array<{
    name: string
    group: string
    equipment: string
    kind: ExerciseKind
    targetSets: number
    targetReps: number
  }>
  createdAt?: unknown
}

/** The game layer. Kept in one document so a session save is a single write. */
export interface GymProfile {
  xp: number
  sessions: number
  totalVolume: number
  totalSets: number
  badges: string[]
  lastSessionDate: string | null
  bestWeekStreak: number
  weekStreak: number
  weeklyGoal: number
}

export const DEFAULT_GYM_PROFILE: GymProfile = {
  xp: 0,
  sessions: 0,
  totalVolume: 0,
  totalSets: 0,
  badges: [],
  lastSessionDate: null,
  bestWeekStreak: 0,
  weekStreak: 0,
  weeklyGoal: 4,
}

/* ------------------------------------------------------------------ *
 * Recipes and the weekly meal plan
 * ------------------------------------------------------------------ */

export interface Recipe {
  id: string
  name: string
  servings: number
  items: MealItem[]
  note?: string
  /** Totals for the whole recipe, not per serving. */
  kcal: number
  protein: number
  carbs: number
  fat: number
  grams: number
  createdAt?: unknown
}

export interface PlanEntry {
  id: string
  day: DayIndex
  slot: MealSlot
  recipeId: string | null
  name: string
  servings: number
  kcal: number
}

/** Food library entry. Macros are always per 100 g. */
export interface LibraryFood {
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  category: string
  /** Typical single serving in grams, used to prefill the weight field. */
  serving?: number
  servingLabel?: string
  /** Grams in one 240 ml cup of this food. Overrides the category default. */
  cupGrams?: number
  /** Grams in one tablespoon. Overrides the sixteenth-of-a-cup default. */
  spoonGrams?: number
  /** Grams in one countable piece, for eggs, wraps, cubes and similar. */
  pieceGrams?: number
  pieceLabel?: string
  /** Grams in one slice, for bread and cake. */
  sliceGrams?: number
  /** Forces millilitres on, for a liquid outside the drinks categories. */
  isLiquid?: boolean
  /** Extra search terms: local names, spellings and synonyms. */
  aliases?: string[]
}
