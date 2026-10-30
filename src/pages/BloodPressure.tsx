import { useEffect, useMemo, useState } from 'react'
import { Clock, Heart, Info, Pencil, Plus } from 'lucide-react'
import { PageHeader } from '@/components/AppShell'
import { BPTrend, PulseTrend } from '@/components/charts'
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
  Modal,
  NumberInput,
  Segmented,
  SkeletonBlock,
  StatusPill,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useMutations, useRangeCollection, useSettings } from '@/hooks/useData'
import { useRange } from '@/hooks/useRange'
import { dateKey, daysInRange, prettyDate, prettyTime, previousRange, timeKey } from '@/lib/dates'
import { BP_CATEGORY_LIST, bpAverages, classifyBP, meanArterialPressure, pulsePressure } from '@/lib/health'
import type { BPReading } from '@/lib/types'

/* ------------------------------------------------------------------ */

function BPEditor({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing?: BPReading | null
}) {
  const { create, update } = useMutations('bp')
  const { settings } = useSettings()
  const toast = useToast()
  const [date, setDate] = useState(dateKey())
  const [time, setTime] = useState(timeKey())
  const [systolic, setSystolic] = useState<number | ''>('')
  const [diastolic, setDiastolic] = useState<number | ''>('')
  const [pulse, setPulse] = useState<number | ''>('')
  const [arm, setArm] = useState<'left' | 'right'>(settings.bpDefaultArm)
  const [position, setPosition] = useState<'sitting' | 'standing' | 'lying'>(settings.bpDefaultPosition)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setDate(editing.date)
      setTime(editing.time)
      setSystolic(editing.systolic)
      setDiastolic(editing.diastolic)
      setPulse(editing.pulse ?? '')
      setArm(editing.arm ?? 'left')
      setPosition(editing.position ?? 'sitting')
      setNote(editing.note ?? '')
    } else {
      setDate(dateKey())
      setTime(timeKey())
      setSystolic('')
      setDiastolic('')
      setPulse('')
      setArm(settings.bpDefaultArm)
      setPosition(settings.bpDefaultPosition)
      setNote('')
    }
  }, [open, editing, settings.bpDefaultArm, settings.bpDefaultPosition])

  const preview =
    typeof systolic === 'number' && typeof diastolic === 'number' && systolic > 0 && diastolic > 0
      ? classifyBP(systolic, diastolic)
      : null

  async function save() {
    if (typeof systolic !== 'number' || typeof diastolic !== 'number' || !systolic || !diastolic) {
      toast('Enter both systolic and diastolic.', 'critical')
      return
    }
    if (systolic <= diastolic) {
      toast('Systolic should be the higher of the two numbers.', 'critical')
      return
    }
    setSaving(true)
    try {
      const payload = {
        date,
        time,
        at: new Date(`${date}T${time || '00:00'}`),
        systolic: Math.round(systolic),
        diastolic: Math.round(diastolic),
        pulse: typeof pulse === 'number' && pulse > 0 ? Math.round(pulse) : null,
        arm,
        position,
        note: note.trim(),
        category: classifyBP(systolic, diastolic).id,
      }
      if (editing) await update(editing.id, payload)
      else await create(payload)
      toast(editing ? 'Reading updated' : 'Reading logged')
      onClose()
    } catch (e) {
      toast((e as Error).message, 'critical')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit reading' : 'Log a blood pressure reading'}
      subtitle="Sit still for five minutes first, feet flat, arm at heart height."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} loading={saving} disabled={saving}>
            {editing ? 'Save changes' : 'Log reading'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <Field label="Systolic" hint="mmHg">
          <NumberInput
            value={systolic}
            min={50}
            max={260}
            autoFocus
            onChange={(e) => setSystolic(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Field>
        <Field label="Diastolic" hint="mmHg">
          <NumberInput
            value={diastolic}
            min={30}
            max={200}
            onChange={(e) => setDiastolic(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Field>
        <Field label="Pulse" hint="bpm, optional">
          <NumberInput
            value={pulse}
            min={20}
            max={240}
            onChange={(e) => setPulse(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Field>
      </div>

      {preview ? (
        <div className="mt-3 rounded-xl border border-line bg-surface-2 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={preview.tone}>{preview.label}</StatusPill>
            <span className="tnum text-[12.5px] text-ink-3">
              MAP {meanArterialPressure(systolic as number, diastolic as number)} · pulse pressure{' '}
              {pulsePressure(systolic as number, diastolic as number)} mmHg
            </span>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{preview.advice}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Time taken">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Arm</span>
          <Segmented
            value={arm}
            onChange={setArm}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </div>
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Position</span>
          <Segmented
            value={position}
            onChange={setPosition}
            options={[
              { value: 'sitting', label: 'Sitting' },
              { value: 'standing', label: 'Standing' },
              { value: 'lying', label: 'Lying' },
            ]}
          />
        </div>
      </div>

      <Field label="Note (optional)" className="mt-4">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Before medication, after a walk..." />
      </Field>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */

export function BloodPressure() {
  const { range } = useRange()
  const prev = useMemo(() => previousRange(range), [range])
  const { items, loading } = useRangeCollection<BPReading>('bp', range)
  const { items: prevItems } = useRangeCollection<BPReading>('bp', prev)
  const { settings } = useSettings()
  const { remove } = useMutations('bp')
  const toast = useToast()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BPReading | null>(null)

  const sorted = useMemo(
    () => [...items].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    [items],
  )

  const daily = useMemo(() => {
    const days = daysInRange(range)
    const map = new Map<string, BPReading[]>()
    for (const r of items) {
      const l = map.get(r.date) ?? []
      l.push(r)
      map.set(r.date, l)
    }
    return days
      .filter((d) => map.has(d))
      .map((d) => {
        const avg = bpAverages(map.get(d)!)
        return { date: d, systolic: avg.systolic, diastolic: avg.diastolic, pulse: avg.pulse }
      })
  }, [items, range])

  const pulseSeries = daily.filter((d) => d.pulse != null).map((d) => ({ date: d.date, pulse: d.pulse as number }))

  const avg = bpAverages(items)
  const prevAvg = bpAverages(prevItems)
  const latest = sorted[0]
  const latestCat = latest ? classifyBP(latest.systolic, latest.diastolic) : null

  const distribution = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of items) {
      const id = classifyBP(r.systolic, r.diastolic).id
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    return BP_CATEGORY_LIST.map((c) => ({ ...c, count: counts.get(c.id) ?? 0 })).filter((c) => c.count > 0)
  }, [items])

  return (
    <>
      <PageHeader
        title="Blood pressure"
        subtitle={`${items.length} reading${items.length === 1 ? '' : 's'} in this range`}
        action={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            <Plus size={16} />
            Log reading
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Average"
          value={avg.systolic ? `${avg.systolic}/${avg.diastolic}` : '-'}
          unit="mmHg"
          delta={avg.systolic && prevAvg.systolic ? avg.systolic - prevAvg.systolic : undefined}
          deltaUnit=" sys"
          deltaInvert
          hint="No readings yet"
        />
        <StatTile
          label="Latest reading"
          value={latest ? `${latest.systolic}/${latest.diastolic}` : '-'}
          unit="mmHg"
          status={latestCat ? <StatusPill tone={latestCat.tone}>{latestCat.label}</StatusPill> : null}
          hint={latest ? `${prettyDate(latest.date)} · ${prettyTime(latest.time)}` : 'No readings yet'}
        />
        <StatTile
          label="Average pulse"
          value={avg.pulse ?? '-'}
          unit="bpm"
          hint={avg.pulse ? 'Across readings with a pulse' : 'Add a pulse to your readings'}
          spark={pulseSeries.map((p) => p.pulse)}
          sparkColor="var(--series-3)"
        />
        <StatTile
          label="Mean arterial pressure"
          value={avg.systolic ? meanArterialPressure(avg.systolic, avg.diastolic) : '-'}
          unit="mmHg"
          hint="Typical healthy range 70 to 100"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <BPTrend
          data={daily}
          targetSystolic={settings.bpTargetSystolic}
          targetDiastolic={settings.bpTargetDiastolic}
        />
        <PulseTrend data={pulseSeries} />
      </div>

      {distribution.length ? (
        <Card className="mt-4">
          <CardHeader
            title="How your readings graded"
            subtitle="ACC/AHA adult categories. A reading is graded by whichever number is worse."
          />
          <div className="space-y-2.5 px-5 pb-5">
            {distribution.map((c) => {
              const share = Math.round((c.count / items.length) * 100)
              return (
                <div key={c.id}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <StatusPill tone={c.tone}>{c.label}</StatusPill>
                    <span className="tnum text-[12.5px] text-ink-3">
                      <span className="font-semibold text-ink">{c.count}</span> · {share}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${share}%`,
                        background:
                          c.tone === 'good'
                            ? 'var(--good)'
                            : c.tone === 'warning'
                              ? 'var(--warning)'
                              : c.tone === 'serious'
                                ? 'var(--serious)'
                                : 'var(--critical)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardHeader title="All readings" subtitle="Newest first. Every entry keeps its own date and time." />
        {loading && !items.length ? (
          <div className="space-y-2 px-5 pb-5">
            <SkeletonBlock className="h-14" />
            <SkeletonBlock className="h-14" />
          </div>
        ) : !sorted.length ? (
          <EmptyState
            icon={<Heart size={20} />}
            title="No readings in this range"
            body="Log a reading and it is graded, time-stamped and charted straight away."
            action={
              <Button
                variant="primary"
                onClick={() => {
                  setEditing(null)
                  setOpen(true)
                }}
              >
                <Plus size={16} />
                Log a reading
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {sorted.map((r) => {
              const cat = classifyBP(r.systolic, r.diastolic)
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="tnum min-w-[104px]">
                    <span className="text-[17px] font-semibold tracking-[-0.015em] text-ink">
                      {r.systolic}/{r.diastolic}
                    </span>
                    <span className="ml-1 text-[11px] text-ink-3">mmHg</span>
                  </div>
                  <StatusPill tone={cat.tone}>{cat.label}</StatusPill>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-3">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {prettyDate(r.date)} · {prettyTime(r.time)}
                    </span>
                    {r.pulse ? <Badge className="tnum">{r.pulse} bpm</Badge> : null}
                    {r.arm ? <Badge className="capitalize">{r.arm} arm</Badge> : null}
                    {r.position ? <Badge className="capitalize">{r.position}</Badge> : null}
                    {r.note ? <span className="truncate italic">"{r.note}"</span> : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton
                      label="Edit reading"
                      onClick={() => {
                        setEditing(r)
                        setOpen(true)
                      }}
                    >
                      <Pencil size={15} />
                    </IconButton>
                    <ConfirmButton
                      onConfirm={async () => {
                        await remove(r.id)
                        toast('Reading deleted', 'neutral')
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <p className={cn('mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-ink-3')}>
        <Info size={14} className="mt-px shrink-0" />
        Categories follow the ACC/AHA adult guideline and are informational only. A single high reading is not a
        diagnosis. Take your log to a clinician rather than acting on it alone.
      </p>

      <BPEditor
        open={open}
        editing={editing}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
      />
    </>
  )
}
