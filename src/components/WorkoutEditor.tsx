import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, Dumbbell, Plus, Search, Timer, Trash2, Trophy } from 'lucide-react'
import {
  Badge,
  Button,
  Field,
  IconButton,
  Input,
  Modal,
  NumberInput,
  Segmented,
  Select,
  StatusPill,
  Textarea,
  cn,
  useOnClickOutside,
  useToast,
} from './ui'
import { dateKey, timeKey } from '@/lib/dates'
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, findExercise, searchExercises } from '@/lib/exercises'
import {
  type PRHit,
  blankSet,
  bestSetOf,
  describePR,
  detectPRs,
  estimate1RM,
  formatSeconds,
  newBadges,
  newSetKey,
  prSlug,
  workoutTotals,
  workoutXP,
} from '@/lib/gym'
import { useFetchRange, useFlatCollection, useGymProfile, useMutations, useSettings } from '@/hooks/useData'
import { displayToKg, kgToDisplay, weightUnit } from '@/lib/prefs'
import type { BadgeDef } from '@/lib/gym'
import type {
  CustomExercise,
  ExerciseDef,
  PersonalRecord,
  Routine,
  Workout,
  WorkoutExercise,
} from '@/lib/types'

/* ------------------------------------------------------------------ *
 * Exercise picker
 * ------------------------------------------------------------------ */

function ExercisePicker({
  onPick,
  customExercises,
}: {
  onPick: (e: ExerciseDef) => void
  customExercises: CustomExercise[]
}) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('All')
  const results = useMemo(
    () => searchExercises(query, customExercises, group, 200),
    [query, group, customExercises],
  )

  return (
    <div>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises, muscles or equipment"
          className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
        />
      </div>

      <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {['All', ...MUSCLE_GROUPS].map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={cn(
              'shrink-0 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors',
              group === g ? 'bg-brand text-brand-ink' : 'bg-surface-2 text-ink-2 hover:text-ink',
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <ul className="mt-3 max-h-[46vh] space-y-1 overflow-y-auto pr-1">
        {results.map((e) => (
          <li key={`${e.group}-${e.name}`}>
            <button
              onClick={() => onPick(e)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
            >
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-medium text-ink">{e.name}</span>
                <span className="block truncate text-[11.5px] text-ink-3">
                  {e.group} · {e.equipment}
                  {e.custom ? ' · yours' : ''}
                </span>
              </span>
              <Plus size={16} className="shrink-0 text-ink-3" />
            </button>
          </li>
        ))}
        {!results.length ? (
          <li className="px-3 py-6 text-center text-[13px] text-ink-3">
            Nothing matches. Add it as a custom exercise below.
          </li>
        ) : null}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Rest timer
 * ------------------------------------------------------------------ */

function RestTimer({ defaultSeconds }: { defaultSeconds: number }) {
  const [seconds, setSeconds] = useState(0)
  const [target, setTarget] = useState(defaultSeconds)
  const [running, setRunning] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  useOnClickOutside(ref, () => setOpen(false))

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [running])

  const done = seconds >= target
  return (
    <div ref={ref} className="relative">
      <Button size="sm" variant={running ? (done ? 'primary' : 'secondary') : 'ghost'} onClick={() => setOpen((o) => !o)}>
        <Timer size={14} />
        {running ? formatSeconds(seconds) : 'Rest timer'}
      </Button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-56 animate-scale-in rounded-2xl border border-line bg-surface p-3 shadow-float">
          <div className="flex items-baseline justify-between">
            <span className="tnum text-[24px] font-semibold text-ink">{formatSeconds(seconds)}</span>
            <span className="tnum text-[12px] text-ink-3">of {formatSeconds(target)}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${Math.min((seconds / target) * 100, 100)}%`, background: done ? 'var(--good)' : 'var(--brand)' }}
            />
          </div>
          <div className="mt-2.5 flex gap-1.5">
            {[...new Set([defaultSeconds, 60, 90, 120, 180])].slice(0, 4).sort((a, b) => a - b).map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                className={cn(
                  'flex-1 rounded-lg py-1.5 text-[12px] font-medium transition-colors',
                  target === t ? 'bg-brand text-brand-ink' : 'bg-surface-2 text-ink-2',
                )}
              >
                {t}s
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setSeconds(0)
                setRunning(true)
              }}
            >
              Restart
            </Button>
            <Button size="sm" variant="ghost" className="flex-1" onClick={() => setRunning((r) => !r)}>
              {running ? 'Pause' : 'Start'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * The editor
 * ------------------------------------------------------------------ */

function blankExercise(def: ExerciseDef, setCount: number): WorkoutExercise {
  return {
    key: newSetKey(),
    name: def.name,
    group: def.group,
    equipment: def.equipment,
    kind: def.kind,
    sets: Array.from({ length: Math.max(setCount, 1) }, () => blankSet()),
    note: '',
  }
}

export function WorkoutEditor({
  open,
  onClose,
  editing,
  startFrom,
}: {
  open: boolean
  onClose: () => void
  editing?: Workout | null
  startFrom?: Routine | null
}) {
  const toast = useToast()
  const { create, update } = useMutations('workouts')
  const prs = useMutations('prs')
  const { items: prRows } = useFlatCollection<PersonalRecord>('prs')
  const { items: customExercises } = useFlatCollection<CustomExercise>('exercises')
  const { profile, saveProfile } = useGymProfile()
  const { settings } = useSettings()
  const fetchRange = useFetchRange()
  const unit = weightUnit()

  const [date, setDate] = useState(dateKey())
  const [time, setTime] = useState(timeKey())
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [duration, setDuration] = useState<number | ''>('')
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [celebration, setCelebration] = useState<{ prs: PRHit[]; badges: BadgeDef[]; xp: number } | null>(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setDate(editing.date)
      setTime(editing.time)
      setName(editing.name)
      setNote(editing.note ?? '')
      setDuration(editing.durationMin ?? '')
      setExercises(editing.exercises.map((e) => ({ ...e, key: e.key || newSetKey() })))
    } else if (startFrom) {
      setDate(dateKey())
      setTime(timeKey())
      setName(startFrom.name)
      setNote('')
      setDuration('')
      setExercises(
        startFrom.exercises.map((e) => ({
          key: newSetKey(),
          name: e.name,
          group: e.group,
          equipment: e.equipment,
          kind: e.kind,
          sets: Array.from({ length: Math.max(e.targetSets, 1) }, () => ({ ...blankSet(), reps: e.targetReps || null })),
          note: '',
        })),
      )
    } else {
      setDate(dateKey())
      setTime(timeKey())
      setName('')
      setNote('')
      setDuration('')
      setExercises([])
    }
    setCelebration(null)
  }, [open, editing, startFrom])

  const prMap = useMemo(() => new Map(prRows.map((p) => [p.id, p])), [prRows])
  const totals = useMemo(() => workoutTotals(exercises), [exercises])

  function patchExercise(key: string, changes: Partial<WorkoutExercise>) {
    setExercises((list) => list.map((e) => (e.key === key ? { ...e, ...changes } : e)))
  }

  function patchSet(exKey: string, setKey: string, changes: Partial<WorkoutExercise['sets'][number]>) {
    setExercises((list) =>
      list.map((e) =>
        e.key === exKey ? { ...e, sets: e.sets.map((s) => (s.key === setKey ? { ...s, ...changes } : s)) } : e,
      ),
    )
  }

  function addSet(exKey: string) {
    setExercises((list) =>
      list.map((e) => {
        if (e.key !== exKey) return e
        const last = e.sets[e.sets.length - 1]
        return { ...e, sets: [...e.sets, last ? { ...last, key: newSetKey(), warmup: false } : blankSet()] }
      }),
    )
  }

  async function handleSave() {
    const working = exercises.filter((e) => e.sets.some((s) => s.done && !s.warmup))
    if (!working.length) {
      toast('Add at least one completed set.', 'critical')
      return
    }
    setSaving(true)
    try {
      const t = workoutTotals(exercises)
      const { hits, updates } = detectPRs(exercises, prMap, date)
      const xp = workoutXP(t, hits.length, typeof duration === 'number' ? duration : null)

      const payload = {
        date,
        time,
        at: new Date(`${date}T${time || '00:00'}`),
        name: name.trim() || 'Workout',
        note: note.trim(),
        durationMin: typeof duration === 'number' ? duration : null,
        exercises,
        volume: t.volume,
        totalSets: t.totalSets,
        totalReps: t.totalReps,
        groups: t.groups,
        xp,
        prCount: hits.length,
      }

      if (editing) await update(editing.id, payload)
      else await create(payload)

      for (const u of updates) {
        const { id, ...rest } = u
        await prs.put(id, rest)
      }

      // Badges need this week's context, which the editor does not otherwise hold.
      const monday = new Date(`${date}T00:00`)
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
      const sunday = new Date(monday)
      sunday.setDate(sunday.getDate() + 6)
      const week = await fetchRange<Workout>('workouts', dateKey(monday), dateKey(sunday))
      const weekPlusThis = editing ? week : [...week, payload as unknown as Workout]

      const weekGroups = new Set<string>()
      const weekDays = new Set<string>()
      let weekVolume = 0
      for (const w of weekPlusThis) {
        weekVolume += w.volume ?? 0
        weekDays.add(w.date)
        for (const g of w.groups ?? []) weekGroups.add(g)
      }

      const hitGoal = weekPlusThis.length >= (profile.weeklyGoal || 4)
      const nextProfile = {
        ...profile,
        xp: profile.xp + (editing ? 0 : xp),
        sessions: profile.sessions + (editing ? 0 : 1),
        totalVolume: profile.totalVolume + (editing ? 0 : t.volume),
        totalSets: profile.totalSets + (editing ? 0 : t.totalSets),
        lastSessionDate: date,
        weekStreak: hitGoal ? Math.max(profile.weekStreak, 1) : profile.weekStreak,
      }
      nextProfile.bestWeekStreak = Math.max(profile.bestWeekStreak, nextProfile.weekStreak)

      const earned = newBadges({
        profile: nextProfile,
        prCount: prMap.size + updates.filter((u) => !prMap.has(u.id)).length,
        heaviestSet: Math.max(t.heaviestSet, 0),
        sessionsThisWeek: weekPlusThis.length,
        groupsThisWeek: weekGroups.size,
        daysThisWeek: weekDays.size,
        sessionHour: Number((time || '00:00').split(':')[0]),
        durationMin: typeof duration === 'number' ? duration : null,
        volumeThisWeek: weekVolume,
      })

      if (earned.length) nextProfile.badges = [...nextProfile.badges, ...earned.map((b) => b.id)]
      await saveProfile(nextProfile)

      if (hits.length || earned.length) {
        setCelebration({ prs: hits, badges: earned, xp })
      } else {
        toast(editing ? 'Workout updated' : `Workout logged, ${xp} XP earned`)
        onClose()
      }
    } catch (e) {
      toast((e as Error).message, 'critical')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Modal
        open={open && !celebration}
        onClose={onClose}
        wide
        title={editing ? 'Edit workout' : 'Log a workout'}
        subtitle="Every completed working set counts towards volume, records and XP."
        footer={
          <>
            <div className="mr-auto hidden items-center gap-3 sm:flex">
              <span className="tnum text-[13px] text-ink-3">
                <span className="text-[17px] font-semibold text-ink">{totals.totalSets}</span> sets
              </span>
              <span className="tnum text-[12px] text-ink-3">
                {Math.round(kgToDisplay(totals.volume)).toLocaleString()} {unit} volume
              </span>
            </div>
            <RestTimer defaultSeconds={settings.restTimerSeconds} />
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving}>
              {editing ? 'Save changes' : 'Finish workout'}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_130px_110px_110px]">
          <Field label="Session name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Push day, Legs, Full body" />
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Started">
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="Minutes">
            <NumberInput
              value={duration}
              min={0}
              max={400}
              placeholder="60"
              onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">
              Exercises ({exercises.length})
            </h4>
            <span className="text-[12px] text-ink-3">
              {totals.groups.length ? totals.groups.join(', ') : 'No muscle groups yet'}
            </span>
          </div>

          <ul className="space-y-3">
            {exercises.map((ex) => {
              const pr = prMap.get(prSlug(ex.name))
              const best = bestSetOf(ex)
              return (
                <li key={ex.key} className="rounded-2xl border border-line bg-surface-2/50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-ink">{ex.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink-3">
                        <Badge>{ex.group}</Badge>
                        <Badge>{ex.equipment}</Badge>
                        {pr ? (
                          <span className="tnum">
                            Best{' '}
                            {ex.kind === 'weight'
                              ? `${kgToDisplay(pr.bestWeight)} ${unit}`
                              : ex.kind === 'bodyweight'
                                ? `${pr.bestReps} reps`
                                : ex.kind === 'timed'
                                  ? formatSeconds(pr.bestSeconds)
                                  : `${pr.bestDistance} km`}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <IconButton
                        label="Duplicate exercise"
                        onClick={() =>
                          setExercises((l) => {
                            const i = l.findIndex((x) => x.key === ex.key)
                            const copy = { ...ex, key: newSetKey(), sets: ex.sets.map((s) => ({ ...s, key: newSetKey() })) }
                            return [...l.slice(0, i + 1), copy, ...l.slice(i + 1)]
                          })
                        }
                      >
                        <Copy size={15} />
                      </IconButton>
                      <IconButton
                        label="Remove exercise"
                        className="hover:text-critical"
                        onClick={() => setExercises((l) => l.filter((x) => x.key !== ex.key))}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  </div>

                  {/* Set table */}
                  <div className="mt-2.5 overflow-x-auto">
                    <table className="w-full min-w-[420px] border-collapse text-[12.5px]">
                      <thead>
                        <tr className="text-left text-ink-3">
                          <th className="w-9 py-1 font-medium">#</th>
                          {ex.kind === 'weight' ? (
                            <>
                              <th className="py-1 font-medium">{unit}</th>
                              <th className="py-1 font-medium">Reps</th>
                            </>
                          ) : ex.kind === 'bodyweight' ? (
                            <>
                              <th className="py-1 font-medium">Added {unit}</th>
                              <th className="py-1 font-medium">Reps</th>
                            </>
                          ) : ex.kind === 'timed' ? (
                            <th className="py-1 font-medium" colSpan={2}>
                              Seconds
                            </th>
                          ) : (
                            <>
                              <th className="py-1 font-medium">km</th>
                              <th className="py-1 font-medium">Minutes</th>
                            </>
                          )}
                          <th className="w-16 py-1 font-medium">RPE</th>
                          <th className="w-20 py-1 text-center font-medium">Done</th>
                          <th className="w-8 py-1" />
                        </tr>
                      </thead>
                      <tbody>
                        {ex.sets.map((s, i) => (
                          <tr key={s.key} className={cn('border-t border-line/60', s.warmup && 'opacity-70')}>
                            <td className="py-1.5">
                              <button
                                onClick={() => patchSet(ex.key, s.key, { warmup: !s.warmup })}
                                title={s.warmup ? 'Warm-up set, not counted' : 'Working set'}
                                className={cn(
                                  'h-6 w-6 rounded-md text-[11px] font-semibold transition-colors',
                                  s.warmup ? 'bg-surface-3 text-ink-3' : 'bg-brand-soft text-brand',
                                )}
                              >
                                {s.warmup ? 'W' : i + 1}
                              </button>
                            </td>
                            {ex.kind === 'timed' ? (
                              <td className="py-1.5 pr-2" colSpan={2}>
                                <NumberInput
                                  className="h-8"
                                  value={s.seconds ?? ''}
                                  min={0}
                                  onChange={(e) =>
                                    patchSet(ex.key, s.key, {
                                      seconds: e.target.value === '' ? null : Number(e.target.value),
                                    })
                                  }
                                />
                              </td>
                            ) : ex.kind === 'cardio' ? (
                              <>
                                <td className="py-1.5 pr-2">
                                  <NumberInput
                                    className="h-8"
                                    step="0.1"
                                    value={s.distance ?? ''}
                                    min={0}
                                    onChange={(e) =>
                                      patchSet(ex.key, s.key, {
                                        distance: e.target.value === '' ? null : Number(e.target.value),
                                      })
                                    }
                                  />
                                </td>
                                <td className="py-1.5 pr-2">
                                  <NumberInput
                                    className="h-8"
                                    value={s.seconds != null ? Math.round(s.seconds / 60) : ''}
                                    min={0}
                                    onChange={(e) =>
                                      patchSet(ex.key, s.key, {
                                        seconds: e.target.value === '' ? null : Number(e.target.value) * 60,
                                      })
                                    }
                                  />
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-1.5 pr-2">
                                  <NumberInput
                                    className="h-8"
                                    step="0.5"
                                    value={s.weight != null ? kgToDisplay(s.weight) : ''}
                                    min={0}
                                    onChange={(e) =>
                                      patchSet(ex.key, s.key, {
                                        weight: e.target.value === '' ? null : displayToKg(Number(e.target.value)),
                                      })
                                    }
                                  />
                                </td>
                                <td className="py-1.5 pr-2">
                                  <NumberInput
                                    className="h-8"
                                    value={s.reps ?? ''}
                                    min={0}
                                    onChange={(e) =>
                                      patchSet(ex.key, s.key, {
                                        reps: e.target.value === '' ? null : Number(e.target.value),
                                      })
                                    }
                                  />
                                </td>
                              </>
                            )}
                            <td className="py-1.5 pr-2">
                              <NumberInput
                                className="h-8"
                                value={s.rpe ?? ''}
                                min={1}
                                max={10}
                                onChange={(e) =>
                                  patchSet(ex.key, s.key, { rpe: e.target.value === '' ? null : Number(e.target.value) })
                                }
                              />
                            </td>
                            <td className="py-1.5 text-center">
                              <button
                                onClick={() => patchSet(ex.key, s.key, { done: !s.done })}
                                aria-pressed={s.done}
                                aria-label="Set completed"
                                className={cn(
                                  'inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                                  s.done ? 'bg-good text-white' : 'bg-surface-3 text-ink-3',
                                )}
                              >
                                <Check size={14} strokeWidth={3} />
                              </button>
                            </td>
                            <td className="py-1.5">
                              <IconButton
                                label="Remove set"
                                className="h-7 w-7 hover:text-critical"
                                onClick={() =>
                                  patchExercise(ex.key, { sets: ex.sets.filter((x) => x.key !== s.key) })
                                }
                              >
                                <Trash2 size={13} />
                              </IconButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <Button size="sm" variant="ghost" onClick={() => addSet(ex.key)}>
                      <Plus size={14} />
                      Add set
                    </Button>
                    {best && ex.kind === 'weight' && best.weight && best.reps ? (
                      <span className="tnum text-[11.5px] text-ink-3">
                        Top set {kgToDisplay(best.weight)} {unit} for {best.reps}, about{' '}
                        {kgToDisplay(estimate1RM(best.weight, best.reps))} {unit} max
                      </span>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => setPickerOpen(true)}>
              <Plus size={16} />
              Add exercise
            </Button>
            <Button variant="ghost" onClick={() => setCustomOpen(true)}>
              <Dumbbell size={16} />
              Create a custom exercise
            </Button>
          </div>
        </div>

        <Field label="Session note (optional)" className="mt-4">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Felt strong, left shoulder tight" />
        </Field>
      </Modal>

      {/* Exercise picker */}
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add an exercise" wide>
        <ExercisePicker
          customExercises={customExercises}
          onPick={(def) => {
            setExercises((l) => [...l, blankExercise(def, settings.defaultSets)])
            setPickerOpen(false)
          }}
        />
      </Modal>

      <CustomExerciseModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onCreated={(def) => {
          setExercises((l) => [...l, blankExercise(def, settings.defaultSets)])
          setCustomOpen(false)
        }}
      />

      {/* Celebration */}
      <Modal
        open={!!celebration}
        onClose={() => {
          setCelebration(null)
          onClose()
        }}
        title="Session logged"
        subtitle={celebration ? `${celebration.xp} XP earned` : undefined}
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setCelebration(null)
              onClose()
            }}
          >
            Done
          </Button>
        }
      >
        {celebration?.prs.length ? (
          <div>
            <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
              <Trophy size={15} className="text-warning" />
              {celebration.prs.length} new personal best{celebration.prs.length === 1 ? '' : 's'}
            </p>
            <ul className="space-y-1.5">
              {celebration.prs.map((h, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/60 px-3 py-2"
                >
                  <span className="min-w-0 truncate text-[13px] text-ink">{describePR(h)}</span>
                  {h.previous > 0 ? (
                    <span className="tnum shrink-0 text-[11.5px] text-ink-3">was {Math.round(h.previous)}</span>
                  ) : (
                    <StatusPill tone="good">First</StatusPill>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {celebration?.badges.length ? (
          <div className={cn(celebration.prs.length > 0 && 'mt-5')}>
            <p className="mb-2 text-[13px] font-semibold text-ink">
              {celebration.badges.length} badge{celebration.badges.length === 1 ? '' : 's'} unlocked
            </p>
            <ul className="space-y-1.5">
              {celebration.badges.map((b) => (
                <li key={b.id} className="rounded-xl border border-line bg-surface-2/60 px-3 py-2">
                  <p className="text-[13px] font-medium text-ink">{b.name}</p>
                  <p className="text-[12px] text-ink-3">{b.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Modal>
    </>
  )
}

/* ------------------------------------------------------------------ */

function CustomExerciseModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (def: ExerciseDef) => void
}) {
  const { create } = useMutations('exercises')
  const toast = useToast()
  const [name, setName] = useState('')
  const [group, setGroup] = useState<string>('Chest')
  const [equipment, setEquipment] = useState('Barbell')
  const [kind, setKind] = useState<ExerciseDef['kind']>('weight')

  useEffect(() => {
    if (!open) return
    setName('')
    setGroup('Chest')
    setEquipment('Barbell')
    setKind('weight')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a custom exercise"
      subtitle="It joins the library and stays available for future sessions."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!name.trim()}
            onClick={async () => {
              const trimmed = name.trim()
              if (findExercise(trimmed)) {
                toast('That exercise already exists in the library.', 'critical')
                return
              }
              const def: ExerciseDef = { name: trimmed, group, equipment, kind, custom: true }
              await create(def as unknown as Record<string, unknown>)
              onCreated(def)
              toast('Custom exercise saved')
            }}
          >
            Create and add
          </Button>
        </>
      }
    >
      <Field label="Name">
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Landmine press" />
      </Field>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Body part">
          <Select value={group} onChange={(e) => setGroup(e.target.value)}>
            {MUSCLE_GROUPS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </Select>
        </Field>
        <Field label="Equipment">
          <Select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
            {['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Smith machine', 'Kettlebell', 'Bodyweight', 'Band', 'Other'].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </Select>
        </Field>
      </div>
      <div className="mt-3">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">How it is measured</span>
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'weight', label: 'Weight and reps' },
            { value: 'bodyweight', label: 'Reps only' },
            { value: 'timed', label: 'Time held' },
            { value: 'cardio', label: 'Distance' },
          ]}
        />
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
        The library already carries {EXERCISE_LIBRARY.length} exercises, so search before creating a duplicate.
      </p>
    </Modal>
  )
}
