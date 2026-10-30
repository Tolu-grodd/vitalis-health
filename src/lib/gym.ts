import type { ExerciseKind, GymProfile, PersonalRecord, Workout, WorkoutExercise, WorkoutSet } from './types'

/* ------------------------------------------------------------------ *
 * Set and workout maths
 * ------------------------------------------------------------------ */

export function newSetKey() {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function blankSet(): WorkoutSet {
  return { key: newSetKey(), weight: null, reps: null, seconds: null, distance: null, rpe: null, warmup: false, done: true }
}

/**
 * Epley one rep max. Only meaningful in the 1 to 12 rep range, so anything
 * above that is capped rather than extrapolated into fantasy numbers.
 */
export function estimate1RM(weight: number, reps: number): number {
  if (!weight || !reps) return 0
  if (reps === 1) return weight
  const capped = Math.min(reps, 12)
  return Math.round(weight * (1 + capped / 30))
}

/** Working volume in kg. Warm-up sets are excluded, as they are everywhere else. */
export function setVolume(set: WorkoutSet, kind: ExerciseKind): number {
  if (set.warmup || !set.done) return 0
  if (kind === 'weight') return (set.weight ?? 0) * (set.reps ?? 0)
  if (kind === 'bodyweight') return 0
  return 0
}

export interface WorkoutTotals {
  volume: number
  totalSets: number
  totalReps: number
  groups: string[]
  heaviestSet: number
}

export function workoutTotals(exercises: WorkoutExercise[]): WorkoutTotals {
  let volume = 0
  let totalSets = 0
  let totalReps = 0
  let heaviestSet = 0
  const groups = new Set<string>()

  for (const ex of exercises) {
    let counted = false
    for (const s of ex.sets) {
      if (!s.done || s.warmup) continue
      counted = true
      totalSets++
      totalReps += s.reps ?? 0
      volume += setVolume(s, ex.kind)
      if ((s.weight ?? 0) > heaviestSet) heaviestSet = s.weight ?? 0
    }
    if (counted && ex.group) groups.add(ex.group)
  }

  return { volume: Math.round(volume), totalSets, totalReps, groups: [...groups], heaviestSet }
}

export function exerciseVolume(ex: WorkoutExercise): number {
  return Math.round(ex.sets.reduce((a, s) => a + setVolume(s, ex.kind), 0))
}

export function bestSetOf(ex: WorkoutExercise): WorkoutSet | null {
  let best: WorkoutSet | null = null
  let bestScore = -1
  for (const s of ex.sets) {
    if (!s.done || s.warmup) continue
    const score =
      ex.kind === 'weight'
        ? estimate1RM(s.weight ?? 0, s.reps ?? 0)
        : ex.kind === 'timed'
          ? (s.seconds ?? 0)
          : ex.kind === 'cardio'
            ? (s.distance ?? 0)
            : (s.reps ?? 0)
    if (score > bestScore) {
      bestScore = score
      best = s
    }
  }
  return best
}

/* ------------------------------------------------------------------ *
 * Personal records
 * ------------------------------------------------------------------ */

export type PRKind = 'weight' | 'reps' | '1rm' | 'volume' | 'seconds' | 'distance'

export interface PRHit {
  exercise: string
  group: string
  kind: PRKind
  value: number
  previous: number
  reps?: number
}

export function prSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
}

const EMPTY_PR = {
  bestWeight: 0,
  bestWeightReps: 0,
  bestReps: 0,
  best1RM: 0,
  bestVolume: 0,
  bestSeconds: 0,
  bestDistance: 0,
}

/**
 * Compares a session against the stored all-time bests and returns both the
 * records that were beaten and the rows to write back. Ranged queries cannot
 * see past their own window, which is why bests are stored rather than derived.
 */
export function detectPRs(
  exercises: WorkoutExercise[],
  existing: Map<string, PersonalRecord>,
  date: string,
): { hits: PRHit[]; updates: Array<Omit<PersonalRecord, 'id'> & { id: string }> } {
  const hits: PRHit[] = []
  const updates: Array<Omit<PersonalRecord, 'id'> & { id: string }> = []

  for (const ex of exercises) {
    const working = ex.sets.filter((s) => s.done && !s.warmup)
    if (!working.length) continue

    const id = prSlug(ex.name)
    const prev = existing.get(id)
    const base = prev ?? { ...EMPTY_PR, name: ex.name, group: ex.group, date }

    const next = { ...EMPTY_PR, ...base, name: ex.name, group: ex.group, date: base.date ?? date }
    let beaten = false

    const volume = exerciseVolume(ex)
    if (volume > (base.bestVolume ?? 0)) {
      hits.push({ exercise: ex.name, group: ex.group, kind: 'volume', value: volume, previous: base.bestVolume ?? 0 })
      next.bestVolume = volume
      beaten = true
    }

    for (const s of working) {
      if (ex.kind === 'weight') {
        const w = s.weight ?? 0
        const r = s.reps ?? 0
        if (w > (next.bestWeight ?? 0)) {
          hits.push({ exercise: ex.name, group: ex.group, kind: 'weight', value: w, previous: next.bestWeight ?? 0, reps: r })
          next.bestWeight = w
          next.bestWeightReps = r
          beaten = true
        }
        const orm = estimate1RM(w, r)
        if (orm > (next.best1RM ?? 0)) {
          hits.push({ exercise: ex.name, group: ex.group, kind: '1rm', value: orm, previous: next.best1RM ?? 0 })
          next.best1RM = orm
          beaten = true
        }
      } else if (ex.kind === 'bodyweight') {
        const r = s.reps ?? 0
        if (r > (next.bestReps ?? 0)) {
          hits.push({ exercise: ex.name, group: ex.group, kind: 'reps', value: r, previous: next.bestReps ?? 0 })
          next.bestReps = r
          beaten = true
        }
      } else if (ex.kind === 'timed') {
        const t = s.seconds ?? 0
        if (t > (next.bestSeconds ?? 0)) {
          hits.push({ exercise: ex.name, group: ex.group, kind: 'seconds', value: t, previous: next.bestSeconds ?? 0 })
          next.bestSeconds = t
          beaten = true
        }
      } else {
        const d = s.distance ?? 0
        if (d > (next.bestDistance ?? 0)) {
          hits.push({ exercise: ex.name, group: ex.group, kind: 'distance', value: d, previous: next.bestDistance ?? 0 })
          next.bestDistance = d
          beaten = true
        }
      }
    }

    if (beaten) updates.push({ id, ...next, date })
  }

  return { hits, updates }
}

export function describePR(hit: PRHit): string {
  switch (hit.kind) {
    case 'weight':
      return `${hit.exercise}: ${hit.value} kg${hit.reps ? ` for ${hit.reps}` : ''}`
    case '1rm':
      return `${hit.exercise}: ${hit.value} kg estimated max`
    case 'reps':
      return `${hit.exercise}: ${hit.value} reps`
    case 'volume':
      return `${hit.exercise}: ${hit.value.toLocaleString()} kg of volume`
    case 'seconds':
      return `${hit.exercise}: ${formatSeconds(hit.value)} held`
    case 'distance':
      return `${hit.exercise}: ${hit.value} km`
  }
}

export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60)
  const s = Math.round(total % 60)
  if (!m) return `${s}s`
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

/* ------------------------------------------------------------------ *
 * The game layer
 * ------------------------------------------------------------------ */

/** XP is weighted so that showing up matters more than any single heavy set. */
export function workoutXP(totals: WorkoutTotals, prCount: number, durationMin: number | null): number {
  const base = 40
  const sets = totals.totalSets * 8
  const volume = Math.round(totals.volume / 120)
  const coverage = totals.groups.length * 6
  const prs = prCount * 60
  const grind = durationMin && durationMin >= 45 ? 20 : 0
  return base + sets + volume + coverage + prs + grind
}

/** Cumulative XP needed to reach a level. Level 1 starts at zero. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.round(150 * Math.pow(level - 1, 1.6))
}

export interface LevelState {
  level: number
  title: string
  into: number
  span: number
  toNext: number
  progress: number
}

const TITLES = [
  'Newcomer',
  'Beginner',
  'Regular',
  'Committed',
  'Consistent',
  'Strong',
  'Seasoned',
  'Advanced',
  'Formidable',
  'Elite',
  'Veteran',
  'Relentless',
]

export function levelFromXP(xp: number): LevelState {
  let level = 1
  while (xp >= xpForLevel(level + 1) && level < 99) level++
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  const span = Math.max(ceil - floor, 1)
  const into = xp - floor
  return {
    level,
    title: TITLES[Math.min(Math.floor((level - 1) / 3), TITLES.length - 1)],
    into,
    span,
    toNext: Math.max(ceil - xp, 0),
    progress: Math.min(into / span, 1),
  }
}

export interface BadgeDef {
  id: string
  name: string
  description: string
  tier: 'bronze' | 'silver' | 'gold'
}

export interface BadgeContext {
  profile: GymProfile
  prCount: number
  heaviestSet: number
  sessionsThisWeek: number
  groupsThisWeek: number
  daysThisWeek: number
  sessionHour: number
  durationMin: number | null
  volumeThisWeek: number
}

interface BadgeRule extends BadgeDef {
  test: (c: BadgeContext) => boolean
}

const RULES: BadgeRule[] = [
  { id: 'first-session', name: 'First rep', description: 'Log your first workout', tier: 'bronze', test: (c) => c.profile.sessions >= 1 },
  { id: 'sessions-10', name: 'Turning up', description: 'Log 10 workouts', tier: 'bronze', test: (c) => c.profile.sessions >= 10 },
  { id: 'sessions-25', name: 'Habit formed', description: 'Log 25 workouts', tier: 'silver', test: (c) => c.profile.sessions >= 25 },
  { id: 'sessions-50', name: 'Half century', description: 'Log 50 workouts', tier: 'silver', test: (c) => c.profile.sessions >= 50 },
  { id: 'sessions-100', name: 'Century of sessions', description: 'Log 100 workouts', tier: 'gold', test: (c) => c.profile.sessions >= 100 },
  { id: 'volume-10k', name: 'Ten tonnes', description: 'Lift 10,000 kg in total', tier: 'bronze', test: (c) => c.profile.totalVolume >= 10_000 },
  { id: 'volume-100k', name: 'Hundred tonnes', description: 'Lift 100,000 kg in total', tier: 'silver', test: (c) => c.profile.totalVolume >= 100_000 },
  { id: 'volume-500k', name: 'Half a million', description: 'Lift 500,000 kg in total', tier: 'gold', test: (c) => c.profile.totalVolume >= 500_000 },
  { id: 'sets-500', name: 'Five hundred sets', description: 'Complete 500 working sets', tier: 'silver', test: (c) => c.profile.totalSets >= 500 },
  { id: 'pr-1', name: 'Personal best', description: 'Set your first personal best', tier: 'bronze', test: (c) => c.prCount >= 1 },
  { id: 'pr-10', name: 'Record breaker', description: 'Hold 10 personal bests', tier: 'silver', test: (c) => c.prCount >= 10 },
  { id: 'pr-25', name: 'Ever upward', description: 'Hold 25 personal bests', tier: 'gold', test: (c) => c.prCount >= 25 },
  { id: 'century-club', name: 'Century club', description: 'Complete a set at 100 kg or more', tier: 'silver', test: (c) => c.heaviestSet >= 100 },
  { id: 'weight-140', name: 'Heavy metal', description: 'Complete a set at 140 kg or more', tier: 'gold', test: (c) => c.heaviestSet >= 140 },
  { id: 'streak-2', name: 'Back to back', description: 'Hit your weekly goal two weeks running', tier: 'bronze', test: (c) => c.profile.weekStreak >= 2 },
  { id: 'streak-4', name: 'A solid month', description: 'Hit your weekly goal four weeks running', tier: 'silver', test: (c) => c.profile.weekStreak >= 4 },
  { id: 'streak-12', name: 'A whole season', description: 'Hit your weekly goal twelve weeks running', tier: 'gold', test: (c) => c.profile.weekStreak >= 12 },
  { id: 'full-body-week', name: 'Nothing skipped', description: 'Train six muscle groups in one week', tier: 'silver', test: (c) => c.groupsThisWeek >= 6 },
  { id: 'five-day-week', name: 'Five in seven', description: 'Train on five different days in one week', tier: 'gold', test: (c) => c.daysThisWeek >= 5 },
  { id: 'early-bird', name: 'Before the world wakes', description: 'Start a session before 7am', tier: 'bronze', test: (c) => c.sessionHour > 0 && c.sessionHour < 7 },
  { id: 'night-owl', name: 'Last one out', description: 'Start a session after 9pm', tier: 'bronze', test: (c) => c.sessionHour >= 21 },
  { id: 'long-haul', name: 'Long haul', description: 'Train for 90 minutes or more', tier: 'silver', test: (c) => (c.durationMin ?? 0) >= 90 },
  { id: 'big-week', name: 'Big week', description: 'Move 25,000 kg in a single week', tier: 'gold', test: (c) => c.volumeThisWeek >= 25_000 },
]

export const ALL_BADGES: BadgeDef[] = RULES.map(({ test: _test, ...rest }) => rest)

export function badgeById(id: string): BadgeDef | undefined {
  return ALL_BADGES.find((b) => b.id === id)
}

/** Returns only the badges newly earned, so the app can celebrate them once. */
export function newBadges(ctx: BadgeContext): BadgeDef[] {
  const held = new Set(ctx.profile.badges)
  return RULES.filter((r) => !held.has(r.id) && r.test(ctx)).map(({ test: _test, ...rest }) => rest)
}

/* ------------------------------------------------------------------ *
 * Weekly challenges
 * ------------------------------------------------------------------ */

export interface Challenge {
  id: string
  label: string
  target: number
  unit: string
  value: (s: WeekStats) => number
}

export interface WeekStats {
  sessions: number
  sets: number
  volume: number
  groups: number
  prs: number
  days: number
}

const CHALLENGE_POOL: Challenge[] = [
  { id: 'sessions-4', label: 'Train four times', target: 4, unit: 'sessions', value: (s) => s.sessions },
  { id: 'sets-60', label: 'Complete 60 working sets', target: 60, unit: 'sets', value: (s) => s.sets },
  { id: 'volume-20k', label: 'Move 20,000 kg', target: 20000, unit: 'kg', value: (s) => s.volume },
  { id: 'groups-6', label: 'Cover six muscle groups', target: 6, unit: 'groups', value: (s) => s.groups },
  { id: 'pr-1', label: 'Set a personal best', target: 1, unit: 'PB', value: (s) => s.prs },
  { id: 'days-4', label: 'Train on four different days', target: 4, unit: 'days', value: (s) => s.days },
]

/** Three challenges a week, rotating deterministically so they feel scheduled. */
export function weeklyChallenges(weekIndex: number): Challenge[] {
  const out: Challenge[] = []
  for (let i = 0; i < 3; i++) out.push(CHALLENGE_POOL[(weekIndex * 3 + i) % CHALLENGE_POOL.length])
  return out
}

export function weekStatsFrom(workouts: Workout[], prsThisWeek: number): WeekStats {
  const groups = new Set<string>()
  const days = new Set<string>()
  let sets = 0
  let volume = 0
  for (const w of workouts) {
    sets += w.totalSets ?? 0
    volume += w.volume ?? 0
    days.add(w.date)
    for (const g of w.groups ?? []) groups.add(g)
  }
  return { sessions: workouts.length, sets, volume, groups: groups.size, prs: prsThisWeek, days: days.size }
}
