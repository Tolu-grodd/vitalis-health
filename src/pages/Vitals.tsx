import { useEffect, useMemo, useState } from 'react'
import { Clock, Droplets, Moon, Pill, Plus, Settings2, Star } from 'lucide-react'
import { PageHeader } from '@/components/AppShell'
import { DailyBarTrend } from '@/components/charts'
import { StatTile } from '@/components/StatTile'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmButton,
  EmptyState,
  Field,
  IconButton,
  Input,
  Meter,
  Modal,
  NumberInput,
  Segmented,
  Toggle,
  cn,
  useToast,
} from '@/components/ui'
import { useMutations, useRangeCollection, useSettings } from '@/hooks/useData'
import { useRange } from '@/hooks/useRange'
import { dateKey, daysInRange, prettyDate, prettyTime, timeKey } from '@/lib/dates'
import { mean } from '@/lib/health'
import type { MedEntry, SleepEntry, WaterEntry } from '@/lib/types'

/** Fallback if the setting is ever missing or empty. */
const QUICK_WATER_FALLBACK = [250, 330, 500, 750]

export function Vitals() {
  const { range } = useRange()
  const { settings, save: saveSettings } = useSettings()
  const toast = useToast()
  const today = dateKey()
  const [waterPrefsOpen, setWaterPrefsOpen] = useState(false)

  const water = useRangeCollection<WaterEntry>('water', range)
  const sleep = useRangeCollection<SleepEntry>('sleep', range)
  const meds = useRangeCollection<MedEntry>('meds', range)

  const waterM = useMutations('water')
  const sleepM = useMutations('sleep')
  const medsM = useMutations('meds')

  const [tab, setTab] = useState<'water' | 'sleep' | 'meds'>('water')
  const [sleepOpen, setSleepOpen] = useState(false)
  const [medOpen, setMedOpen] = useState(false)
  const [customWaterOpen, setCustomWaterOpen] = useState(false)

  const days = useMemo(() => daysInRange(range), [range])

  /* ---------- water ---------- */
  const waterByDay = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of water.items) m.set(w.date, (m.get(w.date) ?? 0) + (w.ml || 0))
    return days.map((d) => ({ date: d, value: m.get(d) ?? 0 }))
  }, [water.items, days])
  const waterToday = waterByDay.find((d) => d.date === today)?.value ?? 0
  const waterAvg = mean(waterByDay.filter((d) => d.value > 0).map((d) => d.value))

  async function addWater(ml: number) {
    await waterM.create({ date: today, time: timeKey(), at: new Date(), ml })
    toast(`${ml} ml logged`)
  }

  /* ---------- sleep ---------- */
  const sleepByDay = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of sleep.items) m.set(s.date, (m.get(s.date) ?? 0) + (s.hours || 0))
    return days.map((d) => ({ date: d, value: m.get(d) ?? 0 }))
  }, [sleep.items, days])
  const sleepAvg = mean(sleepByDay.filter((d) => d.value > 0).map((d) => d.value))

  /* ---------- meds ---------- */
  const medsByDay = useMemo(() => {
    const m = new Map<string, MedEntry[]>()
    for (const x of meds.items) {
      const l = m.get(x.date) ?? []
      l.push(x)
      m.set(x.date, l)
    }
    for (const l of m.values()) l.sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    return days
      .slice()
      .reverse()
      .filter((d) => m.has(d))
      .map((d) => ({ date: d, entries: m.get(d)! }))
  }, [meds.items, days])

  const recentMedNames = useMemo(() => {
    const seen = new Map<string, string>()
    for (const m of meds.items) if (!seen.has(m.name)) seen.set(m.name, m.dose)
    return [...seen.entries()].slice(0, 6)
  }, [meds.items])

  const adherence = meds.items.length
    ? Math.round((meds.items.filter((m) => m.taken).length / meds.items.length) * 100)
    : null

  return (
    <>
      <PageHeader title="Vitals & medication" subtitle="Water, sleep and doses, on the same time-stamped timeline" />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Water today"
          value={(waterToday / 1000).toFixed(1)}
          unit={`L of ${(settings.waterGoalMl / 1000).toFixed(1)} L`}
          hint={waterAvg ? `${Math.round(waterAvg)} ml daily average` : 'Nothing logged yet'}
          spark={waterByDay.map((d) => d.value)}
        />
        <StatTile
          label="Average sleep"
          value={sleepAvg ? sleepAvg.toFixed(1) : '-'}
          unit={`h of ${settings.sleepGoalHours} h`}
          hint={`${sleepByDay.filter((d) => d.value > 0).length} night${sleepByDay.filter((d) => d.value > 0).length === 1 ? '' : 's'} logged`}
          spark={sleepByDay.map((d) => d.value)}
          sparkColor="var(--series-7)"
        />
        <StatTile
          label="Medication taken"
          value={adherence != null ? `${adherence}%` : '-'}
          hint={meds.items.length ? `${meds.items.filter((m) => m.taken).length} of ${meds.items.length} doses marked taken` : 'No doses logged'}
        />
      </div>

      <div className="mt-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'water', label: 'Water' },
            { value: 'sleep', label: 'Sleep' },
            { value: 'meds', label: 'Medication' },
          ]}
        />
      </div>

      {/* ---------------- WATER ---------------- */}
      {tab === 'water' ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[380px_1fr]">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Today</h3>
                <p className="mt-0.5 text-[13px] text-ink-3">{prettyDate(today)}</p>
              </div>
              <IconButton label="Edit water goal and quick amounts" onClick={() => setWaterPrefsOpen(true)}>
                <Settings2 size={16} />
              </IconButton>
            </div>
            <div className="mt-5">
              <Meter
                label="Water"
                value={waterToday}
                goal={settings.waterGoalMl}
                unit="ml"
                color="var(--series-1)"
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {(settings.waterQuickAmounts?.length ? settings.waterQuickAmounts : QUICK_WATER_FALLBACK).map((ml) => (
                <Button key={ml} variant="secondary" onClick={() => addWater(ml)}>
                  <Droplets size={15} className="text-brand" />+{ml} ml
                </Button>
              ))}
            </div>
            <Button variant="ghost" className="mt-2 w-full" onClick={() => setCustomWaterOpen(true)}>
              <Plus size={15} />
              Custom amount
            </Button>

            {water.items.filter((w) => w.date === today).length ? (
              <ul className="mt-5 space-y-1.5 border-t border-line pt-4">
                {water.items
                  .filter((w) => w.date === today)
                  .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
                  .map((w) => (
                    <li key={w.id} className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="inline-flex items-center gap-2 text-ink-2">
                        <Clock size={12} className="text-ink-3" />
                        {prettyTime(w.time)}
                      </span>
                      <span className="tnum font-medium text-ink">{w.ml} ml</span>
                      <ConfirmButton label="Remove" onConfirm={() => waterM.remove(w.id)} />
                    </li>
                  ))}
              </ul>
            ) : null}
          </Card>

          <DailyBarTrend
            title="Water intake"
            subtitle="Millilitres per day"
            data={waterByDay}
            label="Water"
            unit="ml"
            goal={settings.waterGoalMl}
            height={260}
          />
        </div>
      ) : null}

      {/* ---------------- SLEEP ---------------- */}
      {tab === 'sleep' ? (
        <div className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setSleepOpen(true)}>
              <Plus size={16} />
              Log sleep
            </Button>
          </div>
          <DailyBarTrend
            title="Sleep"
            subtitle="Hours per night"
            data={sleepByDay}
            label="Sleep"
            unit="h"
            color="var(--series-7)"
            goal={settings.sleepGoalHours}
            height={240}
          />
          <Card>
            <CardHeader title="Sleep log" subtitle="Newest first" />
            {!sleep.items.length ? (
              <EmptyState icon={<Moon size={20} />} title="No sleep logged in this range" />
            ) : (
              <ul className="divide-y divide-line">
                {[...sleep.items]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                      <span className="tnum min-w-[70px] text-[17px] font-semibold text-ink">
                        {s.hours}
                        <span className="ml-0.5 text-[11px] font-normal text-ink-3">h</span>
                      </span>
                      <span className="inline-flex items-center gap-0.5" aria-label={`Quality ${s.quality} of 5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={13}
                            className={cn(n <= s.quality ? 'fill-warning text-warning' : 'text-line-strong')}
                          />
                        ))}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 text-[12.5px] text-ink-3">
                        <span>{prettyDate(s.date)}</span>
                        {s.bedtime && s.wake ? (
                          <Badge>
                            {prettyTime(s.bedtime)} → {prettyTime(s.wake)}
                          </Badge>
                        ) : null}
                        {s.note ? <span className="truncate italic">"{s.note}"</span> : null}
                      </div>
                      <ConfirmButton onConfirm={() => sleepM.remove(s.id)} />
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}

      {/* ---------------- MEDS ---------------- */}
      {tab === 'meds' ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {recentMedNames.map(([name, dose]) => (
                <Button
                  key={name}
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    await medsM.create({
                      date: today,
                      time: timeKey(),
                      at: new Date(),
                      name,
                      dose,
                      taken: true,
                      note: '',
                    })
                    toast(`${name} logged as taken`)
                  }}
                >
                  <Pill size={14} className="text-brand" />
                  {name}
                </Button>
              ))}
            </div>
            <Button variant="primary" onClick={() => setMedOpen(true)}>
              <Plus size={16} />
              Log a dose
            </Button>
          </div>

          {!medsByDay.length ? (
            <Card>
              <EmptyState
                icon={<Pill size={20} />}
                title="No doses logged in this range"
                body="Log a dose once and it becomes a one-tap button for next time."
                action={
                  <Button variant="primary" onClick={() => setMedOpen(true)}>
                    <Plus size={16} />
                    Log a dose
                  </Button>
                }
              />
            </Card>
          ) : (
            medsByDay.map(({ date, entries }) => (
              <Card key={date}>
                <CardHeader
                  title={prettyDate(date)}
                  subtitle={`${entries.filter((e) => e.taken).length} of ${entries.length} marked taken`}
                />
                <ul className="divide-y divide-line">
                  {entries.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                      <Toggle
                        checked={m.taken}
                        label={`${m.name} taken`}
                        onChange={(v) => medsM.update(m.id, { taken: v })}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-[13.5px] font-medium', m.taken ? 'text-ink' : 'text-ink-3')}>
                          {m.name}
                          {m.dose ? <span className="ml-2 font-normal text-ink-3">{m.dose}</span> : null}
                        </p>
                        {m.note ? <p className="truncate text-[12px] italic text-ink-3">"{m.note}"</p> : null}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-3">
                        <Clock size={12} />
                        {prettyTime(m.time)}
                      </span>
                      <ConfirmButton onConfirm={() => medsM.remove(m.id)} />
                    </li>
                  ))}
                </ul>
              </Card>
            ))
          )}
        </div>
      ) : null}

      <WaterPrefsModal
        open={waterPrefsOpen}
        onClose={() => setWaterPrefsOpen(false)}
        goal={settings.waterGoalMl}
        amounts={settings.waterQuickAmounts?.length ? settings.waterQuickAmounts : QUICK_WATER_FALLBACK}
        onSave={async (goal, amounts) => {
          await saveSettings({ waterGoalMl: goal, waterQuickAmounts: amounts })
          toast('Water settings saved')
          setWaterPrefsOpen(false)
        }}
      />

      <CustomWaterModal open={customWaterOpen} onClose={() => setCustomWaterOpen(false)} onAdd={addWater} />
      <SleepModal open={sleepOpen} onClose={() => setSleepOpen(false)} />
      <MedModal open={medOpen} onClose={() => setMedOpen(false)} />
    </>
  )
}

/* ------------------------------------------------------------------ */

function WaterPrefsModal({
  open,
  onClose,
  goal,
  amounts,
  onSave,
}: {
  open: boolean
  onClose: () => void
  goal: number
  amounts: number[]
  onSave: (goal: number, amounts: number[]) => Promise<void>
}) {
  const [g, setG] = useState(goal)
  const [list, setList] = useState<number[]>(amounts)

  useEffect(() => {
    if (!open) return
    setG(goal)
    setList([0, 1, 2, 3].map((i) => amounts[i] ?? 250))
  }, [open, goal, amounts])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Water settings"
      subtitle="Your daily goal and the four one-tap amounts"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(g, list.map((n) => Math.max(Math.round(n), 1)))}>
            Save
          </Button>
        </>
      }
    >
      <Field label="Daily goal" hint="millilitres">
        <NumberInput value={g} min={0} step={100} onChange={(e) => setG(Number(e.target.value) || 0)} />
      </Field>
      <div className="mt-4">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Quick add buttons</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {list.map((n, i) => (
            <NumberInput
              key={i}
              value={n}
              min={1}
              aria-label={`Quick amount ${i + 1}`}
              onChange={(e) => setList((l) => l.map((x, j) => (j === i ? Number(e.target.value) || 0 : x)))}
            />
          ))}
        </div>
        <p className="mt-1.5 text-[12px] text-ink-3">
          Common sizes: a glass is about 250 ml, a can 330 ml, a small bottle 500 ml.
        </p>
      </div>
    </Modal>
  )
}

function CustomWaterModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (ml: number) => Promise<void>
}) {
  const [ml, setMl] = useState<number | ''>('')
  useEffect(() => {
    if (open) setMl('')
  }, [open])
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add water"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!ml}
            onClick={async () => {
              if (typeof ml === 'number' && ml > 0) {
                await onAdd(Math.round(ml))
                onClose()
              }
            }}
          >
            Add
          </Button>
        </>
      }
    >
      <Field label="Amount" hint="millilitres">
        <NumberInput autoFocus value={ml} min={1} onChange={(e) => setMl(e.target.value === '' ? '' : Number(e.target.value))} />
      </Field>
    </Modal>
  )
}

function SleepModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { create } = useMutations('sleep')
  const toast = useToast()
  const [date, setDate] = useState(dateKey())
  const [hours, setHours] = useState<number | ''>('')
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [bedtime, setBedtime] = useState('')
  const [wake, setWake] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) return
    setDate(dateKey())
    setHours('')
    setQuality(3)
    setBedtime('')
    setWake('')
    setNote('')
  }, [open])

  // Bedtime → wake fills the hours field, crossing midnight correctly.
  useEffect(() => {
    if (!bedtime || !wake) return
    const [bh, bm] = bedtime.split(':').map(Number)
    const [wh, wm] = wake.split(':').map(Number)
    let mins = wh * 60 + wm - (bh * 60 + bm)
    if (mins <= 0) mins += 24 * 60
    setHours(Math.round((mins / 60) * 10) / 10)
  }, [bedtime, wake])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log sleep"
      subtitle="Recorded against the night's date"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!hours}
            onClick={async () => {
              if (typeof hours !== 'number' || hours <= 0) return
              await create({
                date,
                time: wake || timeKey(),
                at: new Date(`${date}T${wake || '07:00'}`),
                hours,
                quality,
                bedtime,
                wake,
                note: note.trim(),
              })
              toast('Sleep logged')
              onClose()
            }}
          >
            Log sleep
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Hours slept">
          <NumberInput
            value={hours}
            min={0}
            max={24}
            step="0.1"
            onChange={(e) => setHours(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Field>
        <Field label="Bedtime (optional)">
          <Input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
        </Field>
        <Field label="Woke (optional)">
          <Input type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Quality</span>
        <div className="flex gap-1">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button
              key={n}
              onClick={() => setQuality(n)}
              aria-label={`Quality ${n} of 5`}
              className="rounded-lg p-1.5 transition-colors hover:bg-surface-2"
            >
              <Star size={20} className={cn(n <= quality ? 'fill-warning text-warning' : 'text-line-strong')} />
            </button>
          ))}
        </div>
      </div>
      <Field label="Note (optional)" className="mt-4">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Woke twice, late caffeine..." />
      </Field>
    </Modal>
  )
}

function MedModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { create } = useMutations('meds')
  const toast = useToast()
  const [date, setDate] = useState(dateKey())
  const [time, setTime] = useState(timeKey())
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [taken, setTaken] = useState(true)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) return
    setDate(dateKey())
    setTime(timeKey())
    setName('')
    setDose('')
    setTaken(true)
    setNote('')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log a dose"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!name.trim()}
            onClick={async () => {
              await create({
                date,
                time,
                at: new Date(`${date}T${time || '00:00'}`),
                name: name.trim(),
                dose: dose.trim(),
                taken,
                note: note.trim(),
              })
              toast('Dose logged')
              onClose()
            }}
          >
            Log dose
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Medication or supplement">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Amlodipine" />
        </Field>
        <Field label="Dose">
          <Input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="5 mg" />
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Time">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Toggle checked={taken} onChange={setTaken} label="Marked as taken" />
        <span className="text-[13px] text-ink-2">{taken ? 'Marked as taken' : 'Logged but not taken'}</span>
      </div>
      <Field label="Note (optional)" className="mt-4">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="With food, felt dizzy after..." />
      </Field>
    </Modal>
  )
}
