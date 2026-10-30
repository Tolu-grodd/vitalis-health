import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Clock, Dumbbell, Pencil, Play, Plus, Trophy } from 'lucide-react'
import { PageHeader } from '@/components/AppShell'
import { CategoryBars, DailyBarTrend, ProgressionChart } from '@/components/charts'
import { BadgeShelf, ChallengeCard, LevelCard } from '@/components/GymGame'
import { StatTile } from '@/components/StatTile'
import { WorkoutEditor } from '@/components/WorkoutEditor'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmButton,
  EmptyState,
  Field,
  Input,
  Modal,
  NumberInput,
  Segmented,
  Select,
  SkeletonBlock,
  cn,
  useToast,
} from '@/components/ui'
import { useFlatCollection, useGymProfile, useMutations, useRangeCollection } from '@/hooks/useData'
import { useRange } from '@/hooks/useRange'
import { daysInRange, prettyDate, prettyTime, previousRange, weekRange } from '@/lib/dates'
import { kgToDisplay, weightUnit } from '@/lib/prefs'
import { MUSCLE_GROUPS } from '@/lib/exercises'
import { bestSetOf, estimate1RM, exerciseVolume, formatSeconds } from '@/lib/gym'
import { mean } from '@/lib/health'
import type { PersonalRecord, Routine, Workout } from '@/lib/types'

type Tab = 'overview' | 'records' | 'routines' | 'badges'

export function Gym() {
  const { range } = useRange()
  const prev = useMemo(() => previousRange(range), [range])
  const week = useMemo(() => weekRange(), [])
  const unit = weightUnit()

  const { items: workouts, loading } = useRangeCollection<Workout>('workouts', range)
  const { items: prevWorkouts } = useRangeCollection<Workout>('workouts', prev)
  const { items: weekWorkouts } = useRangeCollection<Workout>('workouts', week)
  const { items: records } = useFlatCollection<PersonalRecord>('prs')
  const { items: routines } = useFlatCollection<Routine>('routines')
  const { profile, saveProfile } = useGymProfile()
  const { remove } = useMutations('workouts')
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('overview')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Workout | null>(null)
  const [startFrom, setStartFrom] = useState<Routine | null>(null)
  const [openWorkout, setOpenWorkout] = useState<string | null>(null)
  const [routineDraft, setRoutineDraft] = useState<Routine | null>(null)
  const [progressionOf, setProgressionOf] = useState<string>('')

  const days = useMemo(() => daysInRange(range), [range])

  const volumeByDay = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of workouts) m.set(w.date, (m.get(w.date) ?? 0) + (w.volume ?? 0))
    return days.map((d) => ({ date: d, value: m.get(d) ?? 0 }))
  }, [workouts, days])

  const setsByGroup = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of workouts)
      for (const ex of w.exercises ?? []) {
        const working = ex.sets.filter((s) => s.done && !s.warmup).length
        if (!working) continue
        m.set(ex.group, (m.get(ex.group) ?? 0) + working)
      }
    return [...m.entries()].map(([name, value]) => ({ name, value }))
  }, [workouts])

  const totalVolume = workouts.reduce((a, b) => a + (b.volume ?? 0), 0)
  const prevVolume = prevWorkouts.reduce((a, b) => a + (b.volume ?? 0), 0)
  const totalSets = workouts.reduce((a, b) => a + (b.totalSets ?? 0), 0)
  const prsInRange = workouts.reduce((a, b) => a + (b.prCount ?? 0), 0)
  const avgDuration = mean(workouts.map((w) => w.durationMin ?? 0).filter((x) => x > 0))

  const exerciseNames = useMemo(() => {
    const s = new Set<string>()
    for (const w of workouts) for (const ex of w.exercises ?? []) s.add(ex.name)
    return [...s].sort()
  }, [workouts])

  const progressionExercise = progressionOf || exerciseNames[0] || ''

  const progression = useMemo(() => {
    if (!progressionExercise) return []
    const rows: Array<{ date: string; top: number; estimated: number }> = []
    for (const w of [...workouts].sort((a, b) => a.date.localeCompare(b.date))) {
      for (const ex of w.exercises ?? []) {
        if (ex.name !== progressionExercise || ex.kind !== 'weight') continue
        const best = bestSetOf(ex)
        if (!best?.weight || !best.reps) continue
        rows.push({ date: w.date, top: best.weight, estimated: estimate1RM(best.weight, best.reps) })
      }
    }
    return rows
  }, [workouts, progressionExercise])

  const sorted = useMemo(
    () => [...workouts].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    [workouts],
  )

  const untrained = MUSCLE_GROUPS.filter(
    (g) => g !== 'Cardio' && g !== 'Full body' && !setsByGroup.some((s) => s.name === g),
  )

  return (
    <>
      <PageHeader
        title="Gym"
        subtitle={`${workouts.length} session${workouts.length === 1 ? '' : 's'} in this range`}
        action={
          <>
            {routines.length ? (
              <Select
                className="w-auto"
                value=""
                onChange={(e) => {
                  const r = routines.find((x) => x.id === e.target.value)
                  if (!r) return
                  setEditing(null)
                  setStartFrom(r)
                  setEditorOpen(true)
                }}
              >
                <option value="">Start from routine</option>
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            ) : null}
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null)
                setStartFrom(null)
                setEditorOpen(true)
              }}
            >
              <Play size={16} />
              Start workout
            </Button>
          </>
        }
      />

      <div className="mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'records', label: 'Records' },
            { value: 'routines', label: 'Routines' },
            { value: 'badges', label: 'Badges' },
          ]}
        />
      </div>

      {tab === 'overview' ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,340px)_1fr]">
            <div className="space-y-4">
              <LevelCard profile={profile} weekWorkouts={weekWorkouts} />
              <ChallengeCard
                weekWorkouts={weekWorkouts}
                prsThisWeek={weekWorkouts.reduce((a, b) => a + (b.prCount ?? 0), 0)}
              />
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                <StatTile
                  label="Volume lifted"
                  value={Math.round(kgToDisplay(totalVolume)).toLocaleString()}
                  unit={unit}
                  delta={prevVolume ? kgToDisplay(totalVolume - prevVolume) : undefined}
                  deltaUnit={` ${unit}`}
                  hint="Working sets only"
                  spark={volumeByDay.map((d) => d.value)}
                />
                <StatTile label="Working sets" value={totalSets} hint={`${workouts.length} sessions`} />
                <StatTile
                  label="Personal bests"
                  value={prsInRange}
                  hint={`${records.length} exercises tracked all time`}
                />
                <StatTile
                  label="Average session"
                  value={avgDuration ? Math.round(avgDuration) : '-'}
                  unit="min"
                  hint={avgDuration ? 'Where a duration was entered' : 'Add minutes when you log'}
                />
              </div>

              <DailyBarTrend
                title="Training volume"
                subtitle={unit === 'kg' ? 'Kilograms moved per day, working sets only' : 'Pounds moved per day, working sets only'}
                data={volumeByDay.map((d) => ({ date: d.date, value: Math.round(kgToDisplay(d.value)) }))}
                label="Volume"
                unit={unit}
                height={220}
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <CategoryBars
              title="Sets per muscle group"
              subtitle={
                untrained.length
                  ? `Nothing logged for ${untrained.slice(0, 3).join(', ')}${untrained.length > 3 ? ' and others' : ''}`
                  : 'Every major group has been trained in this range'
              }
              data={setsByGroup}
              label="Sets"
              unit="sets"
            />

            <div>
              {exerciseNames.length ? (
                <div className="mb-2">
                  <Select value={progressionExercise} onChange={(e) => setProgressionOf(e.target.value)}>
                    {exerciseNames.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </Select>
                </div>
              ) : null}
              <ProgressionChart data={progression} exercise={progressionExercise} />
            </div>
          </div>

          <Card className="mt-4">
            <CardHeader title="Sessions" subtitle="Newest first, tap one to see every set" />
            {loading && !workouts.length ? (
              <div className="space-y-2 px-5 pb-5">
                <SkeletonBlock className="h-16" />
                <SkeletonBlock className="h-16" />
              </div>
            ) : !sorted.length ? (
              <EmptyState
                icon={<Dumbbell size={20} />}
                title="No sessions in this range"
                body="Log a workout and your volume, records and XP all update at once."
                action={
                  <Button
                    variant="primary"
                    onClick={() => {
                      setEditing(null)
                      setStartFrom(null)
                      setEditorOpen(true)
                    }}
                  >
                    <Play size={16} />
                    Start workout
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {sorted.map((w) => {
                  const isOpen = openWorkout === w.id
                  return (
                    <li key={w.id}>
                      <div className="flex items-start gap-3 px-5 py-3.5">
                        <button
                          onClick={() => setOpenWorkout(isOpen ? null : w.id)}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left"
                          aria-expanded={isOpen}
                        >
                          <ChevronDown
                            size={16}
                            className={cn('mt-0.5 shrink-0 text-ink-3 transition-transform', isOpen && 'rotate-180')}
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-[14px] font-semibold tracking-[-0.01em] text-ink">
                                {w.name}
                              </span>
                              {w.prCount ? (
                                <Badge className="bg-warning/15 text-ink">
                                  <Trophy size={10} className="mr-1 text-warning" />
                                  {w.prCount} PB
                                </Badge>
                              ) : null}
                              <span className="inline-flex items-center gap-1 text-[12px] text-ink-3">
                                <Clock size={12} />
                                {prettyDate(w.date)} · {prettyTime(w.time)}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-[12.5px] text-ink-3">
                              {(w.groups ?? []).join(', ') || 'No groups recorded'}
                            </p>
                          </div>
                        </button>
                        <div className="shrink-0 text-right">
                          <p className="tnum text-[15px] font-semibold text-ink">
                            {Math.round(kgToDisplay(w.volume ?? 0)).toLocaleString()}
                            <span className="ml-0.5 text-[11px] font-normal text-ink-3">{unit}</span>
                          </p>
                          <p className="tnum text-[11.5px] text-ink-3">
                            {w.totalSets} sets · {w.xp} XP
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEditing(w)
                            setStartFrom(null)
                            setEditorOpen(true)
                          }}
                          aria-label="Edit workout"
                          className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>

                      {isOpen ? (
                        <div className="animate-fade-in border-t border-line bg-surface-2/40 px-5 py-3">
                          <ul className="space-y-2.5">
                            {(w.exercises ?? []).map((ex) => (
                              <li key={ex.key}>
                                <div className="flex items-baseline justify-between gap-3">
                                  <span className="text-[13px] font-medium text-ink">{ex.name}</span>
                                  <span className="tnum text-[11.5px] text-ink-3">
                                    {Math.round(kgToDisplay(exerciseVolume(ex))).toLocaleString()} {unit}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {ex.sets.map((s, i) => (
                                    <span
                                      key={s.key}
                                      className={cn(
                                        'tnum rounded-md px-1.5 py-0.5 text-[11px]',
                                        s.warmup
                                          ? 'bg-surface-3 text-ink-3'
                                          : s.done
                                            ? 'bg-brand-soft text-brand'
                                            : 'bg-surface-3 text-ink-3 line-through',
                                      )}
                                    >
                                      {ex.kind === 'timed'
                                        ? formatSeconds(s.seconds ?? 0)
                                        : ex.kind === 'cardio'
                                          ? `${s.distance ?? 0} km`
                                          : ex.kind === 'bodyweight'
                                            ? `${s.reps ?? 0} reps`
                                            : `${kgToDisplay(s.weight ?? 0)} x ${s.reps ?? 0}`}
                                      {s.rpe ? ` @${s.rpe}` : ''}
                                      {i === 0 && s.warmup ? '' : ''}
                                    </span>
                                  ))}
                                </div>
                              </li>
                            ))}
                          </ul>
                          {w.note ? <p className="mt-3 text-[12.5px] italic text-ink-3">"{w.note}"</p> : null}
                          <div className="mt-3 flex justify-end">
                            <ConfirmButton
                              label="Delete session"
                              onConfirm={async () => {
                                await remove(w.id)
                                toast('Session deleted', 'neutral')
                              }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </>
      ) : null}

      {tab === 'records' ? (
        <Card>
          <CardHeader
            title="Personal records"
            subtitle="All time, kept outside the date filter so nothing is lost when you narrow the range"
            action={<Badge>{records.length} exercises</Badge>}
          />
          {!records.length ? (
            <EmptyState
              icon={<Trophy size={20} />}
              title="No records yet"
              body="Your first logged set of any exercise becomes its baseline, and everything after that is measured against it."
            />
          ) : (
            <div className="overflow-x-auto px-5 pb-5">
              <table className="w-full min-w-[620px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-ink-3">
                    <th className="py-2 pr-3 font-medium">Exercise</th>
                    <th className="py-2 px-3 font-medium">Group</th>
                    <th className="py-2 px-3 text-right font-medium">Heaviest</th>
                    <th className="py-2 px-3 text-right font-medium">Est. max</th>
                    <th className="py-2 px-3 text-right font-medium">Best reps</th>
                    <th className="py-2 px-3 text-right font-medium">Best volume</th>
                    <th className="py-2 pl-3 text-right font-medium">Set on</th>
                  </tr>
                </thead>
                <tbody>
                  {[...records]
                    .sort((a, b) => (b.best1RM || b.bestReps) - (a.best1RM || a.bestReps))
                    .map((r) => (
                      <tr key={r.id} className="border-b border-line/60 last:border-0">
                        <td className="py-2 pr-3 font-medium text-ink">{r.name}</td>
                        <td className="py-2 px-3 text-ink-3">{r.group}</td>
                        <td className="tnum py-2 px-3 text-right text-ink">
                          {r.bestWeight ? `${kgToDisplay(r.bestWeight)} ${unit}` : '-'}
                          {r.bestWeight && r.bestWeightReps ? (
                            <span className="text-ink-3"> x {r.bestWeightReps}</span>
                          ) : null}
                        </td>
                        <td className="tnum py-2 px-3 text-right text-ink">{r.best1RM ? `${kgToDisplay(r.best1RM)} ${unit}` : '-'}</td>
                        <td className="tnum py-2 px-3 text-right text-ink-2">{r.bestReps || '-'}</td>
                        <td className="tnum py-2 px-3 text-right text-ink-2">
                          {r.bestVolume ? `${Math.round(kgToDisplay(r.bestVolume)).toLocaleString()} ${unit}` : '-'}
                        </td>
                        <td className="py-2 pl-3 text-right text-ink-3">{prettyDate(r.date)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      {tab === 'routines' ? (
        <RoutinesTab
          routines={routines}
          onEdit={setRoutineDraft}
          onStart={(r) => {
            setEditing(null)
            setStartFrom(r)
            setEditorOpen(true)
          }}
        />
      ) : null}

      {tab === 'badges' ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LevelCard profile={profile} weekWorkouts={weekWorkouts} />
            <Card className="p-5">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Weekly goal</h3>
              <p className="mt-0.5 text-[13px] text-ink-3">
                How many sessions count as a full week. Streaks are measured against this.
              </p>
              <div className="mt-4 flex items-center gap-2">
                {[2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => saveProfile({ weeklyGoal: n })}
                    className={cn(
                      'h-11 flex-1 rounded-xl border text-[14px] font-semibold transition-colors',
                      (profile.weeklyGoal || 4) === n
                        ? 'border-brand bg-brand text-brand-ink'
                        : 'border-line text-ink-2 hover:bg-surface-2',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[12.5px] text-ink-3">
                Best run so far: <span className="font-semibold text-ink">{profile.bestWeekStreak}</span> weeks
              </p>
            </Card>
          </div>
          <BadgeShelf earned={profile.badges} />
        </div>
      ) : null}

      <WorkoutEditor
        open={editorOpen}
        editing={editing}
        startFrom={startFrom}
        onClose={() => {
          setEditorOpen(false)
          setEditing(null)
          setStartFrom(null)
        }}
      />

      <RoutineEditor draft={routineDraft} onClose={() => setRoutineDraft(null)} />
    </>
  )
}

/* ------------------------------------------------------------------ */

function RoutinesTab({
  routines,
  onEdit,
  onStart,
}: {
  routines: Routine[]
  onEdit: (r: Routine) => void
  onStart: (r: Routine) => void
}) {
  const { remove } = useMutations('routines')
  const toast = useToast()

  return (
    <Card>
      <CardHeader
        title="Routines"
        subtitle="Saved templates you can start a session from"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEdit({ id: '', name: '', note: '', exercises: [] })}
          >
            <Plus size={14} />
            New routine
          </Button>
        }
      />
      {!routines.length ? (
        <EmptyState
          icon={<Dumbbell size={20} />}
          title="No routines yet"
          body="Build one for each training day, then start a session from it with the sets already laid out."
          action={
            <Button variant="primary" onClick={() => onEdit({ id: '', name: '', note: '', exercises: [] })}>
              <Plus size={16} />
              Create a routine
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {routines.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ink">{r.name}</p>
                <p className="truncate text-[12.5px] text-ink-3">
                  {r.exercises.map((e) => `${e.name} ${e.targetSets}x${e.targetReps}`).join(' · ') || 'No exercises yet'}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onStart(r)}>
                <Play size={14} />
                Start
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onEdit(r)}>
                <Pencil size={14} />
                Edit
              </Button>
              <ConfirmButton
                onConfirm={async () => {
                  await remove(r.id)
                  toast('Routine deleted', 'neutral')
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function RoutineEditor({ draft, onClose }: { draft: Routine | null; onClose: () => void }) {
  const { create, update } = useMutations('routines')
  const toast = useToast()
  const [name, setName] = useState('')
  const [rows, setRows] = useState<Routine['exercises']>([])

  useEffect(() => {
    if (!draft) return
    setName(draft.name)
    setRows(draft.exercises)
  }, [draft])

  if (!draft) return null

  return (
    <Modal
      open={!!draft}
      onClose={onClose}
      wide
      title={draft.id ? 'Edit routine' : 'New routine'}
      subtitle="Lay out the exercises and target sets, then start sessions from it"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!name.trim() || !rows.length}
            onClick={async () => {
              const payload = { name: name.trim(), note: '', exercises: rows }
              if (draft.id) await update(draft.id, payload)
              else await create(payload)
              toast('Routine saved')
              onClose()
            }}
          >
            Save routine
          </Button>
        </>
      }
    >
      <Field label="Routine name">
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Push day" />
      </Field>

      <ul className="mt-4 space-y-2">
        {rows.map((row, i) => (
          <li key={i} className="grid items-end gap-2 rounded-xl border border-line bg-surface-2/50 p-2.5 sm:grid-cols-[1fr_110px_80px_80px_auto]">
            <Field label="Exercise">
              <Input
                value={row.name}
                onChange={(e) => setRows((l) => l.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
            </Field>
            <Field label="Group">
              <Select
                value={row.group}
                onChange={(e) => setRows((l) => l.map((x, j) => (j === i ? { ...x, group: e.target.value } : x)))}
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            </Field>
            <Field label="Sets">
              <NumberInput
                value={row.targetSets}
                min={1}
                onChange={(e) =>
                  setRows((l) => l.map((x, j) => (j === i ? { ...x, targetSets: Number(e.target.value) || 1 } : x)))
                }
              />
            </Field>
            <Field label="Reps">
              <NumberInput
                value={row.targetReps}
                min={1}
                onChange={(e) =>
                  setRows((l) => l.map((x, j) => (j === i ? { ...x, targetReps: Number(e.target.value) || 1 } : x)))
                }
              />
            </Field>
            <ConfirmButton label="Remove" onConfirm={() => setRows((l) => l.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        className="mt-2 w-full"
        onClick={() =>
          setRows((l) => [
            ...l,
            { name: '', group: 'Chest', equipment: 'Barbell', kind: 'weight', targetSets: 3, targetReps: 8 },
          ])
        }
      >
        <Plus size={16} />
        Add exercise
      </Button>
    </Modal>
  )
}
