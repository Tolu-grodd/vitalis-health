import { useMemo, useState } from 'react'
import { CalendarClock, Clock, Droplets, Flame, Heart, Moon, Pill, Plus, Sparkles, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/AppShell'
import { CalorieTrend, HeatStrip, MacroDonut, MacroTrend } from '@/components/charts'
import { MealEditor } from '@/components/MealEditor'
import { StatTile } from '@/components/StatTile'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Meter,
  ProgressRing,
  SectionTitle,
  SkeletonBlock,
  StatusPill,
  cn,
} from '@/components/ui'
import { LevelCard } from '@/components/GymGame'
import { useFlatCollection, useGymProfile, useRangeCollection, useSettings } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useRange } from '@/hooks/useRange'
import { dateKey, daysInRange, fullDate, prettyDate, prettyTime, previousRange, rangeLabel, weekRange } from '@/lib/dates'
import { bpAverages, classifyBP, macroEnergySplit, mean, sumMeals } from '@/lib/health'
import { buildInsights, currentStreak } from '@/lib/insights'
import { colorVar, durationLabel, prettyClock, toMinutes } from '@/lib/schedule'
import type { BPReading, Meal, MedEntry, ScheduleBlock, SleepEntry, WaterEntry, Workout } from '@/lib/types'

export function Dashboard() {
  const { user } = useAuth()
  const { range } = useRange()
  const { settings } = useSettings()
  const prev = useMemo(() => previousRange(range), [range])
  const today = dateKey()

  const meals = useRangeCollection<Meal>('meals', range)
  const bp = useRangeCollection<BPReading>('bp', range)
  const water = useRangeCollection<WaterEntry>('water', range)
  const sleep = useRangeCollection<SleepEntry>('sleep', range)
  const meds = useRangeCollection<MedEntry>('meds', range)
  const prevMeals = useRangeCollection<Meal>('meals', prev)
  const prevBP = useRangeCollection<BPReading>('bp', prev)

  const week = useMemo(() => weekRange(), [])
  const { items: weekWorkouts } = useRangeCollection<Workout>('workouts', week)
  const { profile } = useGymProfile()
  const { items: scheduleBlocks } = useFlatCollection<ScheduleBlock>('schedule')

  const [editorOpen, setEditorOpen] = useState(false)

  const days = useMemo(() => daysInRange(range), [range])

  const todayIndex = (new Date().getDay() + 6) % 7
  const todaysPlan = useMemo(
    () =>
      scheduleBlocks
        .filter((b) => b.day === todayIndex)
        .sort((a, b) => toMinutes(a.start) - toMinutes(b.start)),
    [scheduleBlocks, todayIndex],
  )
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()

  const kcalByDay = useMemo(() => {
    const m = new Map<string, number>()
    for (const x of meals.items) m.set(x.date, (m.get(x.date) ?? 0) + x.kcal)
    return days.map((d) => ({ date: d, kcal: m.get(d) ?? 0 }))
  }, [meals.items, days])

  const macroByDay = useMemo(() => {
    const m = new Map<string, { protein: number; carbs: number; fat: number }>()
    for (const x of meals.items) {
      const cur = m.get(x.date) ?? { protein: 0, carbs: 0, fat: 0 }
      m.set(x.date, {
        protein: cur.protein + x.protein,
        carbs: cur.carbs + x.carbs,
        fat: cur.fat + x.fat,
      })
    }
    return days.map((d) => ({ date: d, ...(m.get(d) ?? { protein: 0, carbs: 0, fat: 0 }) }))
  }, [meals.items, days])

  const todayMeals = meals.items.filter((m) => m.date === today)
  const todayTotals = sumMeals(todayMeals)
  const todayWater = water.items.filter((w) => w.date === today).reduce((a, b) => a + b.ml, 0)
  const todaySleep = sleep.items.find((s) => s.date === today)

  const loggedDays = kcalByDay.filter((d) => d.kcal > 0)
  const avgKcal = mean(loggedDays.map((d) => d.kcal))
  const prevKcalDays = useMemo(() => {
    const m = new Map<string, number>()
    for (const x of prevMeals.items) m.set(x.date, (m.get(x.date) ?? 0) + x.kcal)
    return [...m.values()].filter((v) => v > 0)
  }, [prevMeals.items])
  const prevAvgKcal = mean(prevKcalDays)

  const bpAvg = bpAverages(bp.items)
  const prevBpAvg = bpAverages(prevBP.items)
  const latestBP = [...bp.items].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0]
  const latestCat = latestBP ? classifyBP(latestBP.systolic, latestBP.diastolic) : null

  const activeDates = useMemo(
    () => new Set([...meals.items, ...bp.items, ...water.items, ...sleep.items, ...meds.items].map((x) => x.date)),
    [meals.items, bp.items, water.items, sleep.items, meds.items],
  )
  const streak = currentStreak(activeDates, days)

  const insights = useMemo(
    () =>
      buildInsights({
        days,
        meals: meals.items,
        bp: bp.items,
        water: water.items,
        sleep: sleep.items,
        meds: meds.items,
        settings,
        previous: { meals: prevMeals.items, bp: prevBP.items },
      }).slice(0, 3),
    [days, meals.items, bp.items, water.items, sleep.items, meds.items, settings, prevMeals.items, prevBP.items],
  )

  const timeline = useMemo(() => {
    type Row = { id: string; date: string; time: string; kind: string; title: string; detail: string; icon: typeof Flame }
    const rows: Row[] = [
      ...meals.items.map((m) => ({
        id: m.id,
        date: m.date,
        time: m.time,
        kind: 'Meal',
        title: m.name,
        detail: `${Math.round(m.kcal).toLocaleString()} kcal · ${m.items.length} component${m.items.length === 1 ? '' : 's'}`,
        icon: UtensilsCrossed,
      })),
      ...bp.items.map((r) => ({
        id: r.id,
        date: r.date,
        time: r.time,
        kind: 'Blood pressure',
        title: `${r.systolic}/${r.diastolic} mmHg`,
        detail: classifyBP(r.systolic, r.diastolic).label,
        icon: Heart,
      })),
      ...sleep.items.map((s) => ({
        id: s.id,
        date: s.date,
        time: s.time,
        kind: 'Sleep',
        title: `${s.hours} h`,
        detail: `Quality ${s.quality}/5`,
        icon: Moon,
      })),
      ...meds.items.map((m) => ({
        id: m.id,
        date: m.date,
        time: m.time,
        kind: 'Medication',
        title: `${m.name}${m.dose ? ` ${m.dose}` : ''}`,
        detail: m.taken ? 'Taken' : 'Not taken',
        icon: Pill,
      })),
    ]
    return rows.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 8)
  }, [meals.items, bp.items, sleep.items, meds.items])

  const firstName = (settings.displayName || user?.displayName || '').split(' ')[0]
  const loading = meals.loading && !meals.items.length

  return (
    <>
      <PageHeader
        title={firstName ? `Good to see you, ${firstName}` : 'Dashboard'}
        subtitle={rangeLabel(range)}
        action={
          <Button variant="primary" onClick={() => setEditorOpen(true)}>
            <Plus size={16} />
            Log a meal
          </Button>
        }
      />

      {/* Today */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,380px)_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Today</h2>
              {/* The real date, spelled out, so there is never any doubt. */}
              <p className="mt-0.5 text-[12.5px] text-ink-3">{fullDate(today)}</p>
            </div>
            {streak > 1 ? (
              <StatusPill tone="brand" icon={<Flame size={12} />}>
                {streak}-day streak
              </StatusPill>
            ) : null}
          </div>

          <div className="mt-5 flex justify-center">
            <ProgressRing
              value={todayTotals.kcal}
              goal={settings.calorieGoal}
              label={
                todayTotals.kcal > settings.calorieGoal
                  ? `${Math.round(todayTotals.kcal - settings.calorieGoal).toLocaleString()} over`
                  : `${Math.round(settings.calorieGoal - todayTotals.kcal).toLocaleString()} left`
              }
              tone={todayTotals.kcal > settings.calorieGoal ? 'warning' : 'brand'}
            />
          </div>

          <div className="mt-6 space-y-3.5">
            <Meter label="Protein" value={todayTotals.protein} goal={settings.proteinGoal} unit="g" color="var(--series-1)" />
            <Meter label="Carbs" value={todayTotals.carbs} goal={settings.carbGoal} unit="g" color="var(--series-2)" />
            <Meter label="Fat" value={todayTotals.fat} goal={settings.fatGoal} unit="g" color="var(--series-3)" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4">
            <div className="rounded-xl bg-surface-2 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
                <Droplets size={12} /> Water
              </p>
              <p className="tnum mt-0.5 text-[15px] font-semibold text-ink">
                {(todayWater / 1000).toFixed(1)}
                <span className="ml-0.5 text-[11px] font-normal text-ink-3">
                  / {(settings.waterGoalMl / 1000).toFixed(1)} L
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-surface-2 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
                <Moon size={12} /> Sleep
              </p>
              <p className="tnum mt-0.5 text-[15px] font-semibold text-ink">
                {todaySleep ? todaySleep.hours : '-'}
                <span className="ml-0.5 text-[11px] font-normal text-ink-3">/ {settings.sleepGoalHours} h</span>
              </p>
            </div>
          </div>

          <div className="mt-4">
            <SectionTitle>Today's meals</SectionTitle>
            {todayMeals.length ? (
              <ul className="space-y-1.5">
                {[...todayMeals]
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="min-w-0 truncate text-ink-2">
                        <span className="text-ink-3">{prettyTime(m.time)}</span> · {m.name}
                      </span>
                      <span className="tnum shrink-0 font-medium text-ink">{Math.round(m.kcal).toLocaleString()}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-[13px] text-ink-3">Nothing logged yet today.</p>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <StatTile
              label="Average daily calories"
              value={loggedDays.length ? Math.round(avgKcal).toLocaleString() : '-'}
              unit="kcal"
              delta={loggedDays.length && prevKcalDays.length ? avgKcal - prevAvgKcal : undefined}
              deltaUnit=" kcal"
              hint={`${loggedDays.length} of ${days.length} days logged`}
              spark={kcalByDay.map((d) => d.kcal)}
            />
            <StatTile
              label="Latest blood pressure"
              value={latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : '-'}
              unit="mmHg"
              status={latestCat ? <StatusPill tone={latestCat.tone}>{latestCat.label}</StatusPill> : null}
              hint={latestBP ? prettyDate(latestBP.date) : 'No readings yet'}
            />
            <StatTile
              label="Average blood pressure"
              value={bpAvg.systolic ? `${bpAvg.systolic}/${bpAvg.diastolic}` : '-'}
              unit="mmHg"
              delta={bpAvg.systolic && prevBpAvg.systolic ? bpAvg.systolic - prevBpAvg.systolic : undefined}
              deltaUnit=" sys"
              deltaInvert
              hint={`${bp.items.length} reading${bp.items.length === 1 ? '' : 's'}`}
            />
            <StatTile
              label="Days with an entry"
              value={activeDates.size}
              unit={`of ${days.length}`}
              hint={streak > 0 ? `${streak}-day streak` : 'Log something to start a streak'}
            />
          </div>

          <Card>
            <CardHeader title="Energy split" subtitle="Share of calories from each macronutrient in this range" />
            <div className="px-5 pb-5">
              <MacroDonut split={macroEnergySplit(sumMeals(meals.items))} />
            </div>
          </Card>
        </div>
      </div>

      {/* Training and today's plan */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,340px)_1fr]">
        <LevelCard profile={profile} weekWorkouts={weekWorkouts} compact />

        <Card>
          <CardHeader
            title="Today's plan"
            subtitle={
              todaysPlan.length
                ? `${todaysPlan.length} block${todaysPlan.length === 1 ? '' : 's'} scheduled`
                : 'Nothing blocked out for today'
            }
            action={
              <Link to="/schedule">
                <Button size="sm" variant="ghost">
                  <CalendarClock size={14} />
                  Open schedule
                </Button>
              </Link>
            }
          />
          {todaysPlan.length ? (
            <ul className="divide-y divide-line">
              {todaysPlan.map((b) => {
                const past = toMinutes(b.end) <= nowMinutes
                const active = toMinutes(b.start) <= nowMinutes && nowMinutes < toMinutes(b.end)
                return (
                  <li key={b.id} className={cn('flex items-center gap-3 px-5 py-2.5', past && 'opacity-55')}>
                    <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: colorVar(b.color) }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-ink">{b.title}</p>
                      <p className="truncate text-[12px] text-ink-3">
                        {b.category} · {durationLabel(b.start, b.end)}
                      </p>
                    </div>
                    {active ? <StatusPill tone="brand">Now</StatusPill> : null}
                    <span className="tnum shrink-0 text-[12px] text-ink-3">
                      {prettyClock(b.start)} to {prettyClock(b.end)}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState
              icon={<CalendarClock size={20} />}
              title="Your day is unplanned"
              body="Block out your week once in Schedule and it repeats every week from then on."
              action={
                <Link to="/schedule">
                  <Button variant="primary">
                    <CalendarClock size={16} />
                    Build your timetable
                  </Button>
                </Link>
              }
            />
          )}
        </Card>
      </div>

      {/* Charts */}
      {loading ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <SkeletonBlock className="h-72" />
          <SkeletonBlock className="h-72" />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <CalorieTrend data={kcalByDay} goal={settings.calorieGoal} />
          <MacroTrend data={macroByDay} />
        </div>
      )}

      {/* Insights + activity */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="What stands out"
            subtitle="Based on this range"
            action={
              <Link to="/insights">
                <Button size="sm" variant="ghost">
                  <Sparkles size={14} />
                  All insights
                </Button>
              </Link>
            }
          />
          <div className="space-y-2.5 px-5 pb-5">
            {insights.length ? (
              insights.map((i) => (
                <div key={i.id} className="rounded-xl border border-line bg-surface-2/50 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13.5px] font-semibold text-ink">{i.title}</p>
                    {i.figure ? (
                      <span className="shrink-0 text-right">
                        <span className="text-[17px] font-semibold leading-none tracking-[-0.02em] text-ink">
                          {i.figure}
                        </span>
                        {i.figureUnit ? (
                          <span className="ml-1 text-[11px] text-ink-3">{i.figureUnit}</span>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{i.body}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Not enough logged yet" body="Insights appear once there are a few days of entries to read." />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent activity" subtitle="Everything you have logged, newest first" />
          {timeline.length ? (
            <ul className="divide-y divide-line">
              {timeline.map((row) => (
                <li key={`${row.kind}-${row.id}`} className="flex items-start gap-3 px-4 py-3 sm:items-center sm:px-5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-3 sm:mt-0">
                    <row.icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">{row.title}</p>
                    <p className="truncate text-[12px] text-ink-3">
                      <Badge className="mr-1.5">{row.kind}</Badge>
                      {row.detail}
                    </p>
                    {/* On a phone the timestamp goes under the title. As a
                        shrink-0 column beside it, it pushed the row off screen. */}
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-ink-3 sm:hidden">
                      <Clock size={11} />
                      {prettyDate(row.date)} · {prettyTime(row.time)}
                    </p>
                  </div>
                  <span className="hidden shrink-0 items-center gap-1 text-[12px] text-ink-3 sm:inline-flex">
                    <Clock size={12} />
                    {prettyDate(row.date)} · {prettyTime(row.time)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<UtensilsCrossed size={20} />}
              title="Nothing logged in this range"
              action={
                <Button variant="primary" onClick={() => setEditorOpen(true)}>
                  <Plus size={16} />
                  Log a meal
                </Button>
              }
            />
          )}
        </Card>
      </div>

      {/* Coverage */}
      <Card className="mt-4">
        <CardHeader
          title="Calorie intensity by day"
          subtitle="Darker means a heavier day. Hover for the figure."
        />
        <div className={cn('px-5 pb-5')}>
          <HeatStrip data={kcalByDay.map((d) => ({ date: d.date, value: d.kcal }))} />
          <div className="mt-3 flex items-center gap-2 text-[11.5px] text-ink-3">
            <span>Lighter</span>
            <span className="flex gap-0.5">
              {['var(--seq-100)', 'var(--seq-250)', 'var(--seq-400)', 'var(--seq-550)', 'var(--seq-700)'].map((c) => (
                <span key={c} className="h-3 w-6 rounded-sm" style={{ background: c }} />
              ))}
            </span>
            <span>Heavier</span>
            <span className="ml-3">
              Max {Math.round(Math.max(...kcalByDay.map((d) => d.kcal), 0)).toLocaleString()} kcal · average{' '}
              {loggedDays.length ? Math.round(avgKcal).toLocaleString() : 0} kcal
            </span>
          </div>
        </div>
      </Card>

      <MealEditor open={editorOpen} onClose={() => setEditorOpen(false)} />
    </>
  )
}
