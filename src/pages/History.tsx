import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Droplets, Heart, Moon, Pill, UtensilsCrossed } from 'lucide-react'
import { PageHeader } from '@/components/AppShell'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  SectionTitle,
  StatusPill,
  cn,
} from '@/components/ui'
import { useRangeCollection, useSettings } from '@/hooks/useData'
import {
  addDays,
  dateKey,
  weekdayLabels,
  endOfMonth,
  format,
  monthGrid,
  parseISO,
  prettyDate,
  prettyTime,
  startOfMonth,
  type DateRange,
} from '@/lib/dates'
import { classifyBP, describeSize, round1, sumMeals } from '@/lib/health'
import type { BPReading, Meal, MedEntry, SleepEntry, WaterEntry } from '@/lib/types'

/** Sequential blue: one hue, light to dark. Step 0 is "logged but light". */
const SEQ = ['var(--seq-100)', 'var(--seq-250)', 'var(--seq-400)', 'var(--seq-550)', 'var(--seq-700)']

export function History() {
  const { settings } = useSettings()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState<string>(dateKey())

  // The calendar needs the whole visible month, which is independent of the
  // global range filter, so it builds its own window.
  const monthRange = useMemo<DateRange>(() => {
    const first = startOfMonth(month)
    const last = endOfMonth(month)
    return {
      id: 'custom',
      from: dateKey(addDays(first, -7)),
      to: dateKey(addDays(last, 7)),
      label: format(month, 'MMMM yyyy'),
    }
  }, [month])

  const meals = useRangeCollection<Meal>('meals', monthRange)
  const bp = useRangeCollection<BPReading>('bp', monthRange)
  const water = useRangeCollection<WaterEntry>('water', monthRange)
  const sleep = useRangeCollection<SleepEntry>('sleep', monthRange)
  const meds = useRangeCollection<MedEntry>('meds', monthRange)

  const kcalByDay = useMemo(() => {
    const m = new Map<string, number>()
    for (const x of meals.items) m.set(x.date, (m.get(x.date) ?? 0) + x.kcal)
    return m
  }, [meals.items])

  const bpByDay = useMemo(() => {
    const m = new Map<string, BPReading[]>()
    for (const r of bp.items) {
      const l = m.get(r.date) ?? []
      l.push(r)
      m.set(r.date, l)
    }
    return m
  }, [bp.items])

  const cells = useMemo(() => monthGrid(month), [month])
  const maxKcal = Math.max(...[...kcalByDay.values()], 1)
  const today = dateKey()

  const dayMeals = meals.items
    .filter((m) => m.date === selected)
    .sort((a, b) => a.time.localeCompare(b.time))
  const dayBP = bp.items.filter((r) => r.date === selected).sort((a, b) => a.time.localeCompare(b.time))
  const dayWater = water.items.filter((w) => w.date === selected)
  const daySleep = sleep.items.filter((s) => s.date === selected)
  const dayMeds = meds.items.filter((m) => m.date === selected).sort((a, b) => a.time.localeCompare(b.time))
  const dayTotals = sumMeals(dayMeals)
  const waterTotal = dayWater.reduce((a, b) => a + b.ml, 0)
  const anythingOnDay = dayMeals.length + dayBP.length + dayWater.length + daySleep.length + dayMeds.length > 0

  const monthKcalDays = [...kcalByDay.entries()].filter(([d]) => d.startsWith(format(month, 'yyyy-MM')))
  const monthAvg = monthKcalDays.length
    ? Math.round(monthKcalDays.reduce((a, b) => a + b[1], 0) / monthKcalDays.length)
    : 0

  return (
    <>
      <PageHeader title="History" subtitle="Every day you have logged, from the beginning" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <Card>
          <CardHeader
            title={format(month, 'MMMM yyyy')}
            subtitle={
              monthKcalDays.length
                ? `${monthKcalDays.length} day${monthKcalDays.length === 1 ? '' : 's'} logged · ${monthAvg.toLocaleString()} kcal daily average`
                : 'Nothing logged this month yet'
            }
            action={
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => setMonth(addDays(startOfMonth(month), -1))}>
                  <ChevronLeft size={16} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMonth(startOfMonth(new Date()))}>
                  Today
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMonth(addDays(endOfMonth(month), 1))}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            }
          />

          <div className="px-5 pb-5">
            <div className="mb-1.5 grid grid-cols-7 gap-1.5">
              {weekdayLabels().map((d) => (
                <div key={d} className="py-1 text-center text-[11px] font-medium text-ink-3">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((c) => {
                const kcal = kcalByDay.get(c.key) ?? 0
                const readings = bpByDay.get(c.key)
                const worst = readings?.length
                  ? readings
                      .map((r) => classifyBP(r.systolic, r.diastolic))
                      .sort((a, b) => BP_RANK[b.id] - BP_RANK[a.id])[0]
                  : null
                const step = kcal === 0 ? -1 : Math.min(Math.floor((kcal / maxKcal) * SEQ.length), SEQ.length - 1)
                const isSelected = selected === c.key
                const dark = step >= 2
                return (
                  <button
                    key={c.key}
                    onClick={() => setSelected(c.key)}
                    className={cn(
                      'relative aspect-square rounded-xl border p-1.5 text-left transition-all',
                      isSelected ? 'border-brand ring-2 ring-brand/25' : 'border-line hover:border-line-strong',
                      !c.inMonth && 'opacity-35',
                    )}
                    style={{ background: step < 0 ? 'var(--surface-2)' : SEQ[step] }}
                  >
                    <span
                      className={cn(
                        'tnum text-[11.5px] font-medium',
                        dark ? 'text-white' : 'text-ink',
                        c.key === today && 'underline underline-offset-2',
                      )}
                    >
                      {format(parseISO(c.key), 'd')}
                    </span>
                    {kcal > 0 ? (
                      <span
                        className={cn(
                          'tnum absolute inset-x-1.5 bottom-1.5 truncate text-[9.5px] leading-tight',
                          dark ? 'text-white/85' : 'text-ink-2',
                        )}
                      >
                        {Math.round(kcal).toLocaleString()}
                      </span>
                    ) : null}
                    {worst ? (
                      <span
                        className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2"
                        style={{
                          background: TONE_COLOR[worst.tone],
                          // A 2px surface ring keeps the dot legible on any cell shade.
                          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                          ['--tw-ring-color' as string]: step < 0 ? 'var(--surface-2)' : SEQ[step],
                        }}
                        title={worst.label}
                      />
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-ink-3">
              <span className="inline-flex items-center gap-1.5">
                Lighter
                <span className="flex gap-0.5">
                  {SEQ.map((c) => (
                    <span key={c} className="h-3 w-5 rounded-sm" style={{ background: c }} />
                  ))}
                </span>
                Heavier
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: 'var(--good)' }} />
                Dot = worst blood pressure grade that day
              </span>
            </div>
          </div>
        </Card>

        {/* Day detail */}
        <Card className="self-start">
          <CardHeader
            title={prettyDate(selected)}
            subtitle={
              anythingOnDay
                ? `${Math.round(dayTotals.kcal).toLocaleString()} kcal of ${settings.calorieGoal.toLocaleString()} · ${dayMeals.length} meal${dayMeals.length === 1 ? '' : 's'}`
                : 'Nothing logged on this day'
            }
          />

          {!anythingOnDay ? (
            <EmptyState title="Nothing logged" body="Pick another day, or add an entry from the Meals page." />
          ) : (
            <div className="space-y-5 px-5 pb-5">
              {dayMeals.length ? (
                <div>
                  <SectionTitle hint={`P ${round1(dayTotals.protein)} · C ${round1(dayTotals.carbs)} · F ${round1(dayTotals.fat)} g`}>
                    Meals
                  </SectionTitle>
                  <ul className="space-y-2">
                    {dayMeals.map((m) => (
                      <li key={m.id} className="rounded-xl border border-line bg-surface-2/50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] font-semibold text-ink">{m.name}</p>
                            <p className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-ink-3">
                              <Clock size={11} />
                              {prettyTime(m.time)}
                              <Badge className="ml-1">{m.slot}</Badge>
                            </p>
                          </div>
                          <span className="tnum shrink-0 text-[14px] font-semibold text-ink">
                            {Math.round(m.kcal).toLocaleString()}
                            <span className="ml-0.5 text-[10px] font-normal text-ink-3">kcal</span>
                          </span>
                        </div>
                        <ul className="mt-2 space-y-0.5 border-t border-line pt-2">
                          {m.items.map((i, idx) => (
                            <li key={i.key ?? idx} className="flex items-center justify-between gap-2 text-[12px]">
                              <span className="min-w-0 truncate text-ink-2">
                                {i.name}
                                {describeSize(i) ? <span className="text-ink-3"> · {describeSize(i)}</span> : null}
                              </span>
                              <span className="tnum shrink-0 text-ink">{Math.round(i.kcal)}</span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {dayBP.length ? (
                <div>
                  <SectionTitle>Blood pressure</SectionTitle>
                  <ul className="space-y-1.5">
                    {dayBP.map((r) => {
                      const cat = classifyBP(r.systolic, r.diastolic)
                      return (
                        <li key={r.id} className="flex items-center gap-2.5">
                          <Heart size={14} className="shrink-0 text-ink-3" />
                          <span className="tnum text-[13.5px] font-semibold text-ink">
                            {r.systolic}/{r.diastolic}
                          </span>
                          <StatusPill tone={cat.tone}>{cat.label}</StatusPill>
                          <span className="ml-auto text-[12px] text-ink-3">{prettyTime(r.time)}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}

              {waterTotal || daySleep.length ? (
                <div>
                  <SectionTitle>Vitals</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    {waterTotal ? (
                      <div className="rounded-xl bg-surface-2 px-3 py-2.5">
                        <p className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
                          <Droplets size={12} /> Water
                        </p>
                        <p className="tnum mt-0.5 text-[15px] font-semibold text-ink">
                          {(waterTotal / 1000).toFixed(1)} <span className="text-[11px] font-normal text-ink-3">L</span>
                        </p>
                      </div>
                    ) : null}
                    {daySleep.length ? (
                      <div className="rounded-xl bg-surface-2 px-3 py-2.5">
                        <p className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
                          <Moon size={12} /> Sleep
                        </p>
                        <p className="tnum mt-0.5 text-[15px] font-semibold text-ink">
                          {daySleep[0].hours} <span className="text-[11px] font-normal text-ink-3">h</span>
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {dayMeds.length ? (
                <div>
                  <SectionTitle>Medication</SectionTitle>
                  <ul className="space-y-1.5">
                    {dayMeds.map((m) => (
                      <li key={m.id} className="flex items-center gap-2.5 text-[13px]">
                        <Pill size={14} className="shrink-0 text-ink-3" />
                        <span className={cn('min-w-0 truncate', m.taken ? 'text-ink' : 'text-ink-3 line-through')}>
                          {m.name} {m.dose}
                        </span>
                        <span className="ml-auto shrink-0 text-[12px] text-ink-3">{prettyTime(m.time)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </div>

      {!meals.items.length && !bp.items.length ? (
        <Card className="mt-4">
          <EmptyState
            icon={<UtensilsCrossed size={20} />}
            title="No entries this month"
            body="Move between months with the arrows above. Days you log fill in automatically."
          />
        </Card>
      ) : null}
    </>
  )
}

const BP_RANK: Record<string, number> = { normal: 0, low: 1, elevated: 2, stage1: 3, stage2: 4, crisis: 5 }

const TONE_COLOR: Record<string, string> = {
  good: 'var(--good)',
  warning: 'var(--warning)',
  serious: 'var(--serious)',
  critical: 'var(--critical)',
  neutral: 'var(--ink-3)',
}
