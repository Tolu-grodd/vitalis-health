import type { ExerciseDef } from './types'

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Forearms',
  'Traps',
  'Cardio',
  'Full body',
] as const

export const EQUIPMENT = [
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Smith machine',
  'Kettlebell',
  'Bodyweight',
  'Band',
  'Other',
] as const

/**
 * Built-in exercise library. `kind` decides which fields a set collects:
 * weight and reps, reps only, a held time, or distance and time.
 */
export const EXERCISE_LIBRARY: ExerciseDef[] = [
  // ---------------- Chest ----------------
  { name: 'Barbell bench press', group: 'Chest', secondary: ['Triceps', 'Shoulders'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Incline barbell bench press', group: 'Chest', secondary: ['Shoulders'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Decline barbell bench press', group: 'Chest', equipment: 'Barbell', kind: 'weight' },
  { name: 'Dumbbell bench press', group: 'Chest', secondary: ['Triceps'], equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Incline dumbbell press', group: 'Chest', secondary: ['Shoulders'], equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Dumbbell fly', group: 'Chest', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Incline dumbbell fly', group: 'Chest', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Cable crossover', group: 'Chest', equipment: 'Cable', kind: 'weight' },
  { name: 'Low to high cable fly', group: 'Chest', equipment: 'Cable', kind: 'weight' },
  { name: 'Pec deck', group: 'Chest', equipment: 'Machine', kind: 'weight' },
  { name: 'Chest press machine', group: 'Chest', equipment: 'Machine', kind: 'weight' },
  { name: 'Smith machine bench press', group: 'Chest', equipment: 'Smith machine', kind: 'weight' },
  { name: 'Press-up', group: 'Chest', secondary: ['Triceps', 'Core'], equipment: 'Bodyweight', kind: 'bodyweight' },
  { name: 'Incline press-up', group: 'Chest', equipment: 'Bodyweight', kind: 'bodyweight' },
  { name: 'Chest dip', group: 'Chest', secondary: ['Triceps'], equipment: 'Bodyweight', kind: 'bodyweight' },

  // ---------------- Back ----------------
  { name: 'Deadlift', group: 'Back', secondary: ['Hamstrings', 'Glutes'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Sumo deadlift', group: 'Back', secondary: ['Glutes', 'Quads'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Romanian deadlift', group: 'Hamstrings', secondary: ['Back', 'Glutes'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Barbell row', group: 'Back', secondary: ['Biceps'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Pendlay row', group: 'Back', equipment: 'Barbell', kind: 'weight' },
  { name: 'T-bar row', group: 'Back', equipment: 'Barbell', kind: 'weight' },
  { name: 'Dumbbell row', group: 'Back', secondary: ['Biceps'], equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Chest supported row', group: 'Back', equipment: 'Machine', kind: 'weight' },
  { name: 'Seated cable row', group: 'Back', secondary: ['Biceps'], equipment: 'Cable', kind: 'weight' },
  { name: 'Lat pulldown', group: 'Back', secondary: ['Biceps'], equipment: 'Cable', kind: 'weight' },
  { name: 'Close grip pulldown', group: 'Back', equipment: 'Cable', kind: 'weight' },
  { name: 'Straight arm pulldown', group: 'Back', equipment: 'Cable', kind: 'weight' },
  { name: 'Pull-up', group: 'Back', secondary: ['Biceps'], equipment: 'Bodyweight', kind: 'bodyweight' },
  { name: 'Chin-up', group: 'Back', secondary: ['Biceps'], equipment: 'Bodyweight', kind: 'bodyweight' },
  { name: 'Assisted pull-up', group: 'Back', equipment: 'Machine', kind: 'weight' },
  { name: 'Inverted row', group: 'Back', equipment: 'Bodyweight', kind: 'bodyweight' },
  { name: 'Back extension', group: 'Back', secondary: ['Glutes'], equipment: 'Bodyweight', kind: 'bodyweight' },

  // ---------------- Shoulders ----------------
  { name: 'Overhead press', group: 'Shoulders', secondary: ['Triceps'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Seated dumbbell press', group: 'Shoulders', secondary: ['Triceps'], equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Arnold press', group: 'Shoulders', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Push press', group: 'Shoulders', secondary: ['Quads'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Lateral raise', group: 'Shoulders', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Cable lateral raise', group: 'Shoulders', equipment: 'Cable', kind: 'weight' },
  { name: 'Front raise', group: 'Shoulders', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Rear delt fly', group: 'Shoulders', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Reverse pec deck', group: 'Shoulders', equipment: 'Machine', kind: 'weight' },
  { name: 'Face pull', group: 'Shoulders', secondary: ['Traps'], equipment: 'Cable', kind: 'weight' },
  { name: 'Upright row', group: 'Shoulders', secondary: ['Traps'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Shoulder press machine', group: 'Shoulders', equipment: 'Machine', kind: 'weight' },

  // ---------------- Biceps ----------------
  { name: 'Barbell curl', group: 'Biceps', equipment: 'Barbell', kind: 'weight' },
  { name: 'EZ bar curl', group: 'Biceps', equipment: 'Barbell', kind: 'weight' },
  { name: 'Dumbbell curl', group: 'Biceps', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Hammer curl', group: 'Biceps', secondary: ['Forearms'], equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Incline dumbbell curl', group: 'Biceps', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Preacher curl', group: 'Biceps', equipment: 'Barbell', kind: 'weight' },
  { name: 'Concentration curl', group: 'Biceps', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Cable curl', group: 'Biceps', equipment: 'Cable', kind: 'weight' },
  { name: 'Spider curl', group: 'Biceps', equipment: 'Dumbbell', kind: 'weight' },

  // ---------------- Triceps ----------------
  { name: 'Close grip bench press', group: 'Triceps', secondary: ['Chest'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Triceps pushdown', group: 'Triceps', equipment: 'Cable', kind: 'weight' },
  { name: 'Rope pushdown', group: 'Triceps', equipment: 'Cable', kind: 'weight' },
  { name: 'Overhead cable extension', group: 'Triceps', equipment: 'Cable', kind: 'weight' },
  { name: 'Skull crusher', group: 'Triceps', equipment: 'Barbell', kind: 'weight' },
  { name: 'Dumbbell overhead extension', group: 'Triceps', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Triceps dip', group: 'Triceps', equipment: 'Bodyweight', kind: 'bodyweight' },
  { name: 'Bench dip', group: 'Triceps', equipment: 'Bodyweight', kind: 'bodyweight' },
  { name: 'Diamond press-up', group: 'Triceps', equipment: 'Bodyweight', kind: 'bodyweight' },

  // ---------------- Quads ----------------
  { name: 'Back squat', group: 'Quads', secondary: ['Glutes', 'Core'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Front squat', group: 'Quads', secondary: ['Core'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Hack squat', group: 'Quads', equipment: 'Machine', kind: 'weight' },
  { name: 'Leg press', group: 'Quads', secondary: ['Glutes'], equipment: 'Machine', kind: 'weight' },
  { name: 'Bulgarian split squat', group: 'Quads', secondary: ['Glutes'], equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Walking lunge', group: 'Quads', secondary: ['Glutes'], equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Goblet squat', group: 'Quads', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Leg extension', group: 'Quads', equipment: 'Machine', kind: 'weight' },
  { name: 'Step-up', group: 'Quads', secondary: ['Glutes'], equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Smith machine squat', group: 'Quads', equipment: 'Smith machine', kind: 'weight' },
  { name: 'Bodyweight squat', group: 'Quads', equipment: 'Bodyweight', kind: 'bodyweight' },

  // ---------------- Hamstrings ----------------
  { name: 'Lying leg curl', group: 'Hamstrings', equipment: 'Machine', kind: 'weight' },
  { name: 'Seated leg curl', group: 'Hamstrings', equipment: 'Machine', kind: 'weight' },
  { name: 'Stiff leg deadlift', group: 'Hamstrings', secondary: ['Glutes'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Good morning', group: 'Hamstrings', secondary: ['Back'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Nordic curl', group: 'Hamstrings', equipment: 'Bodyweight', kind: 'bodyweight' },

  // ---------------- Glutes ----------------
  { name: 'Hip thrust', group: 'Glutes', secondary: ['Hamstrings'], equipment: 'Barbell', kind: 'weight' },
  { name: 'Glute bridge', group: 'Glutes', equipment: 'Bodyweight', kind: 'bodyweight' },
  { name: 'Cable kickback', group: 'Glutes', equipment: 'Cable', kind: 'weight' },
  { name: 'Hip abduction machine', group: 'Glutes', equipment: 'Machine', kind: 'weight' },
  { name: 'Sumo squat', group: 'Glutes', secondary: ['Quads'], equipment: 'Dumbbell', kind: 'weight' },

  // ---------------- Calves ----------------
  { name: 'Standing calf raise', group: 'Calves', equipment: 'Machine', kind: 'weight' },
  { name: 'Seated calf raise', group: 'Calves', equipment: 'Machine', kind: 'weight' },
  { name: 'Dumbbell calf raise', group: 'Calves', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Leg press calf raise', group: 'Calves', equipment: 'Machine', kind: 'weight' },

  // ---------------- Core ----------------
  { name: 'Plank', group: 'Core', equipment: 'Bodyweight', kind: 'timed' },
  { name: 'Side plank', group: 'Core', equipment: 'Bodyweight', kind: 'timed' },
  { name: 'Hanging leg raise', group: 'Core', equipment: 'Bodyweight', kind: 'bodyweight' },
  { name: 'Cable crunch', group: 'Core', equipment: 'Cable', kind: 'weight' },
  { name: 'Crunch', group: 'Core', equipment: 'Bodyweight', kind: 'bodyweight' },
  { name: 'Sit-up', group: 'Core', equipment: 'Bodyweight', kind: 'bodyweight' },
  { name: 'Russian twist', group: 'Core', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Ab wheel rollout', group: 'Core', equipment: 'Other', kind: 'bodyweight' },
  { name: 'Mountain climber', group: 'Core', equipment: 'Bodyweight', kind: 'timed' },
  { name: 'Dead bug', group: 'Core', equipment: 'Bodyweight', kind: 'bodyweight' },
  { name: 'Hollow hold', group: 'Core', equipment: 'Bodyweight', kind: 'timed' },

  // ---------------- Forearms and traps ----------------
  { name: 'Wrist curl', group: 'Forearms', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Reverse wrist curl', group: 'Forearms', equipment: 'Dumbbell', kind: 'weight' },
  { name: 'Farmer carry', group: 'Forearms', secondary: ['Traps', 'Core'], equipment: 'Dumbbell', kind: 'timed' },
  { name: 'Dead hang', group: 'Forearms', equipment: 'Bodyweight', kind: 'timed' },
  { name: 'Barbell shrug', group: 'Traps', equipment: 'Barbell', kind: 'weight' },
  { name: 'Dumbbell shrug', group: 'Traps', equipment: 'Dumbbell', kind: 'weight' },

  // ---------------- Full body and cardio ----------------
  { name: 'Clean and press', group: 'Full body', equipment: 'Barbell', kind: 'weight' },
  { name: 'Power clean', group: 'Full body', equipment: 'Barbell', kind: 'weight' },
  { name: 'Kettlebell swing', group: 'Full body', secondary: ['Glutes'], equipment: 'Kettlebell', kind: 'weight' },
  { name: 'Thruster', group: 'Full body', equipment: 'Barbell', kind: 'weight' },
  { name: 'Burpee', group: 'Full body', equipment: 'Bodyweight', kind: 'bodyweight' },
  { name: 'Battle ropes', group: 'Full body', equipment: 'Other', kind: 'timed' },
  { name: 'Treadmill run', group: 'Cardio', equipment: 'Machine', kind: 'cardio' },
  { name: 'Outdoor run', group: 'Cardio', equipment: 'Bodyweight', kind: 'cardio' },
  { name: 'Cycling', group: 'Cardio', equipment: 'Machine', kind: 'cardio' },
  { name: 'Rowing machine', group: 'Cardio', equipment: 'Machine', kind: 'cardio' },
  { name: 'Elliptical', group: 'Cardio', equipment: 'Machine', kind: 'cardio' },
  { name: 'Stair climber', group: 'Cardio', equipment: 'Machine', kind: 'cardio' },
  { name: 'Skipping', group: 'Cardio', equipment: 'Other', kind: 'timed' },
  { name: 'Incline walk', group: 'Cardio', equipment: 'Machine', kind: 'cardio' },
]

/** Ranked search across the built-in library plus the user's own exercises. */
export function searchExercises(query: string, extra: ExerciseDef[] = [], group?: string, limit = 60): ExerciseDef[] {
  const q = query.trim().toLowerCase()
  let pool = [...extra, ...EXERCISE_LIBRARY]
  if (group && group !== 'All') pool = pool.filter((e) => e.group === group)
  if (!q) return pool.slice(0, limit)
  const scored: Array<{ e: ExerciseDef; score: number }> = []
  for (const e of pool) {
    const n = e.name.toLowerCase()
    const idx = n.indexOf(q)
    if (idx === -1) {
      if (e.equipment.toLowerCase().includes(q) || e.group.toLowerCase().includes(q)) scored.push({ e, score: 3 })
      continue
    }
    scored.push({ e, score: idx === 0 ? 0 : n.includes(' ' + q) ? 1 : 2 })
  }
  scored.sort((a, b) => a.score - b.score || a.e.name.length - b.e.name.length)
  return scored.slice(0, limit).map((s) => s.e)
}

export function findExercise(name: string, extra: ExerciseDef[] = []): ExerciseDef | undefined {
  const n = name.trim().toLowerCase()
  return [...extra, ...EXERCISE_LIBRARY].find((e) => e.name.toLowerCase() === n)
}
