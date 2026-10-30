import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarClock, Check, Copy, Palette, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/AppShell'
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
  Segmented,
  Select,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useFlatCollection, useMutations, useScheduleConfig } from '@/hooks/useData'
import {
  GRANULARITY_OPTIONS,
  SCHEDULE_COLORS,
  categoryTotals,
  colorVar,
  durationLabel,
  gridSlots,
  hoursLabel,
  placeDay,
  prettyClock,
  toClock,
  toMinutes,
} from '@/lib/schedule'
import { dayOrder } from '@/lib/prefs'
import { DAY_NAMES, DAY_SHORT, type DayIndex, type Granularity, type ScheduleBlock } from '@/lib/types'

/** Row height in pixels for each granularity, chosen so a 10 minute grid is
 *  still readable without the week becoming a mile long. */
const ROW_HEIGHT: Record<Granularity, number> = { 10: 13, 15: 17, 30: 28, 60: 46 }

interface Draft {
  id?: string
  day: DayIndex
  start: string
  end: string
  title: string
  category: string
  color: number
  note: string
}

export function Schedule() {
  const { config, saveConfig } = useScheduleConfig()
  const { items: blocks, loading } = useFlatCollection<ScheduleBlock>('schedule')
  const { create, update, remove } = useMutations('schedule')
  const toast = useToast()

  const [draft, setDraft] = useState<Draft | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  /**
   * Drag-to-create has to claim touch gestures, which means the grid cannot be
   * scrolled while it is armed. Keeping it behind an explicit toggle means a
   * plain swipe scrolls the timetable instead of blocking out time by accident.
   */
  const [editMode, setEditMode] = useState(false)
  const [drag, setDrag] = useState<{ day: DayIndex; from: number; to: number } | null>(null)
  const dragging = useRef(false)

  const slots = useMemo(() => gridSlots(config), [config])
  const rowH = ROW_HEIGHT[config.granularity]
  const gridHeight = slots.length * rowH
  const dayStartMin = toMinutes(config.dayStart)

  const byDay = useMemo(() => {
    const map: ScheduleBlock[][] = [[], [], [], [], [], [], []]
    for (const b of blocks) if (b.day >= 0 && b.day <= 6) map[b.day].push(b)
    return map
  }, [blocks])

  const totals = useMemo(() => categoryTotals(blocks), [blocks])
  const plannedMinutes = totals.reduce((a, b) => a + b.minutes, 0)

  /* ---------------- drag to create ---------------- */

  function slotAt(clientY: number, rect: DOMRect): number {
    const y = clientY - rect.top
    return Math.max(0, Math.min(Math.floor(y / rowH), slots.length - 1))
  }

  function beginDrag(day: DayIndex, e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const idx = slotAt(e.clientY, rect)
    dragging.current = true
    setDrag({ day, from: idx, to: idx })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function moveDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current || !drag) return
    const rect = e.currentTarget.getBoundingClientRect()
    setDrag({ ...drag, to: slotAt(e.clientY, rect) })
  }

  function endDrag() {
    if (!dragging.current || !drag) return
    dragging.current = false
    const lo = Math.min(drag.from, drag.to)
    const hi = Math.max(drag.from, drag.to)
    const start = toClock(dayStartMin + lo * config.granularity)
    const end = toClock(dayStartMin + (hi + 1) * config.granularity)
    setDrag(null)
    const fallback = config.categories[0] ?? { name: 'General', color: 0 }
    setDraft({ day: drag.day, start, end, title: '', category: fallback.name, color: fallback.color, note: '' })
  }

  /* ---------------- now marker ---------------- */

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])
  const todayIndex = ((now.getDay() + 6) % 7) as DayIndex
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowVisible = nowMinutes >= dayStartMin && nowMinutes <= toMinutes(config.dayEnd)
  const nowTop = ((nowMinutes - dayStartMin) / config.granularity) * rowH

  async function saveDraft(d: Draft, alsoDays: DayIndex[]) {
    const payload = {
      day: d.day,
      start: d.start,
      end: d.end,
      title: d.title.trim() || d.category || 'Untitled',
      category: d.category.trim(),
      color: d.color,
      note: d.note.trim(),
    }
    if (toMinutes(d.end) <= toMinutes(d.start)) {
      toast('The end time has to be after the start time.', 'critical')
      return
    }
    if (d.id) await update(d.id, payload)
    else await create(payload)
    for (const day of alsoDays) {
      if (day === d.day) continue
      await create({ ...payload, day })
    }
    toast(d.id ? 'Block updated' : alsoDays.length > 1 ? 'Blocks added' : 'Block added')
    setDraft(null)
  }

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle="Your repeating week. Drag across the grid to block out time."
        action={
          <>
            <Button
              variant={editMode ? 'primary' : 'secondary'}
              onClick={() => {
                setEditMode((v) => !v)
                setDrag(null)
                dragging.current = false
              }}
              aria-pressed={editMode}
            >
              {editMode ? <Check size={16} /> : <Pencil size={16} />}
              {editMode ? 'Done' : 'Edit'}
            </Button>
            <Button variant="secondary" onClick={() => setCategoriesOpen(true)}>
              <Palette size={16} />
              <span className="hidden sm:inline">Categories</span>
            </Button>
            <Button variant="secondary" onClick={() => setConfigOpen(true)}>
              <Settings2 size={16} />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const fallback = config.categories[0] ?? { name: 'General', color: 0 }
                setDraft({
                  day: todayIndex,
                  start: config.dayStart,
                  end: toClock(dayStartMin + Math.max(config.granularity, 60)),
                  title: '',
                  category: fallback.name,
                  color: fallback.color,
                  note: '',
                })
              }}
            >
              <Plus size={16} />
              Add block
            </Button>
          </>
        }
      />

      {/* Category summary */}
      <Card className="mb-4">
        <CardHeader
          title="Planned this week"
          subtitle={`${hoursLabel(plannedMinutes)} across ${totals.length} categor${totals.length === 1 ? 'y' : 'ies'}`}
          action={<Badge>{blocks.length} blocks</Badge>}
        />
        <div className="px-5 pb-5">
          {totals.length ? (
            <>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
                {totals.map((t) => (
                  <div
                    key={t.category}
                    style={{ width: `${(t.minutes / plannedMinutes) * 100}%`, background: colorVar(t.color) }}
                    className="border-r-2 border-surface last:border-0"
                    title={`${t.category}: ${hoursLabel(t.minutes)}`}
                  />
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {totals.map((t) => (
                  <li key={t.category} className="inline-flex items-center gap-2 text-[12.5px]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorVar(t.color) }} aria-hidden />
                    <span className="text-ink-2">{t.category}</span>
                    <span className="tnum font-semibold text-ink">{hoursLabel(t.minutes)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-[13px] text-ink-3">Nothing blocked out yet. Drag across a day to start.</p>
          )}
        </div>
      </Card>

      {/* The grid */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <Segmented
            value={String(config.granularity)}
            onChange={(v) => saveConfig({ granularity: Number(v) as Granularity })}
            options={GRANULARITY_OPTIONS.map((g) => ({ value: String(g.value), label: g.label }))}
          />
          <span className="hidden text-[12px] text-ink-3 sm:block">
            {prettyClock(config.dayStart)} to {prettyClock(config.dayEnd)}
          </span>
        </div>

        <p
          className={cn(
            'border-b px-4 py-2 text-[12px]',
            editMode ? 'border-brand/30 bg-brand-soft font-medium text-brand' : 'border-line text-ink-3',
          )}
        >
          {editMode
            ? 'Edit mode on. Drag down a day to block out time. Scrolling the grid is paused until you tap Done.'
            : 'Tap a block to change it. Tap Edit to drag out new blocks.'}
        </p>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Day headers */}
            <div
              // top-0, not top-16. The wrapper uses overflow-x-auto, and CSS
              // computes overflow-y to auto alongside it, which makes that
              // wrapper a scroll container. A 64px offset then stuck the header
              // 64px DOWN from the grid's own top, hanging it over the first
              // two rows: 7am vanished behind it and 6am poked out above.
              className="sticky top-0 z-10 grid border-b border-line bg-surface"
              style={{ gridTemplateColumns: '58px repeat(7, minmax(0, 1fr))' }}
            >
              <div />
              {dayOrder().map((d) => (
                <div
                  key={d}
                  className={cn(
                    'border-l border-line py-2 text-center text-[12px] font-semibold',
                    d === todayIndex ? 'text-brand' : 'text-ink-2',
                  )}
                >
                  {DAY_SHORT[d]}
                  <span className="mt-0.5 block text-[10.5px] font-normal text-ink-3">
                    {hoursLabel(byDay[d].reduce((a, b) => a + (toMinutes(b.end) - toMinutes(b.start)), 0))}
                  </span>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="grid" style={{ gridTemplateColumns: '58px repeat(7, minmax(0, 1fr))' }}>
              {/* Time gutter */}
              <div className="relative" style={{ height: gridHeight }}>
                {slots.map((m, i) => {
                  const onHour = m % 60 === 0
                  const showLabel = config.granularity >= 30 ? true : onHour
                  return (
                    <div
                      key={m}
                      // Sits just inside the top of the row it labels. Centring
                      // it on the row's boundary line pushed the first label
                      // half above the grid, into the day headers.
                      className="absolute right-2 pt-px text-[10.5px] leading-none tabular-nums text-ink-3"
                      style={{ top: i * rowH }}
                    >
                      {showLabel ? prettyClock(toClock(m)) : ''}
                    </div>
                  )
                })}
              </div>

              {/* Day columns */}
              {dayOrder().map((day) => {
                const placed = placeDay(byDay[day])
                const isDragDay = drag?.day === day
                const lo = drag ? Math.min(drag.from, drag.to) : 0
                const hi = drag ? Math.max(drag.from, drag.to) : 0
                return (
                  <div
                    key={day}
                    className={cn(
                      'relative border-l border-line',
                      // Only claim touch gestures while editing, so the grid
                      // scrolls normally the rest of the time.
                      editMode && 'touch-none',
                      day === todayIndex && 'bg-brand-soft/12',
                    )}
                    style={{ height: gridHeight }}
                    onPointerDown={editMode ? (e) => beginDrag(day, e) : undefined}
                    onPointerMove={editMode ? moveDrag : undefined}
                    onPointerUp={editMode ? endDrag : undefined}
                    onPointerCancel={
                      editMode
                        ? () => {
                            dragging.current = false
                            setDrag(null)
                          }
                        : undefined
                    }
                  >
                    {/* Row lines */}
                    {slots.map((m, i) => (
                      <div
                        key={m}
                        className={cn(
                          'absolute inset-x-0 border-t',
                          m % 60 === 0 ? 'border-line-strong/60' : 'border-line/60',
                        )}
                        style={{ top: i * rowH, height: rowH }}
                      />
                    ))}

                    {/* Drag preview */}
                    {isDragDay ? (
                      <div
                        className="pointer-events-none absolute inset-x-1 rounded-lg border-2 border-dashed border-brand bg-brand/12"
                        style={{ top: lo * rowH, height: (hi - lo + 1) * rowH }}
                      />
                    ) : null}

                    {/* Now marker */}
                    {day === todayIndex && nowVisible ? (
                      <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: nowTop }}>
                        <div className="h-px w-full bg-critical" />
                        <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-critical" />
                      </div>
                    ) : null}

                    {/* Blocks */}
                    {placed.map(({ block, column, columns }) => {
                      const top = ((toMinutes(block.start) - dayStartMin) / config.granularity) * rowH
                      const height = Math.max(
                        ((toMinutes(block.end) - toMinutes(block.start)) / config.granularity) * rowH,
                        14,
                      )
                      const width = 100 / columns
                      const tall = height >= 34
                      return (
                        <button
                          key={block.id}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() =>
                            setDraft({
                              id: block.id,
                              day: block.day,
                              start: block.start,
                              end: block.end,
                              title: block.title,
                              category: block.category,
                              color: block.color,
                              note: block.note ?? '',
                            })
                          }
                          className="absolute overflow-hidden rounded-lg px-1.5 py-1 text-left transition-[filter] hover:brightness-105"
                          style={{
                            top,
                            height,
                            left: `calc(${column * width}% + 2px)`,
                            width: `calc(${width}% - 4px)`,
                            background: colorVar(block.color),
                            // A surface ring keeps neighbouring blocks separate without a border.
                            boxShadow: '0 0 0 2px var(--surface)',
                          }}
                          title={`${block.title} · ${prettyClock(block.start)} to ${prettyClock(block.end)}`}
                        >
                          <span className="block truncate text-[11px] font-semibold leading-tight text-white">
                            {block.title}
                          </span>
                          {tall ? (
                            <span className="block truncate text-[10px] leading-tight text-white/85">
                              {prettyClock(block.start)}
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Card>

      {!loading && !blocks.length ? (
        <Card className="mt-4">
          <EmptyState
            icon={<CalendarClock size={20} />}
            title="Your week is empty"
            body="Drag down a day column to block out a period, or use Add block to type the times in."
          />
        </Card>
      ) : null}

      <BlockEditor
        draft={draft}
        categories={config.categories}
        granularity={config.granularity}
        onClose={() => setDraft(null)}
        onSave={saveDraft}
        onDelete={async (id) => {
          await remove(id)
          toast('Block deleted', 'neutral')
          setDraft(null)
        }}
      />

      <CategoryManager
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        categories={config.categories}
        onSave={(categories) => {
          saveConfig({ categories })
          toast('Categories saved')
          setCategoriesOpen(false)
        }}
      />

      <GridSettings
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        dayStart={config.dayStart}
        dayEnd={config.dayEnd}
        onSave={(dayStart, dayEnd) => {
          saveConfig({ dayStart, dayEnd })
          setConfigOpen(false)
        }}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */

function BlockEditor({
  draft,
  categories,
  granularity,
  onClose,
  onSave,
  onDelete,
}: {
  draft: Draft | null
  categories: Array<{ name: string; color: number }>
  granularity: Granularity
  onClose: () => void
  onSave: (d: Draft, alsoDays: DayIndex[]) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [local, setLocal] = useState<Draft | null>(draft)
  const [repeat, setRepeat] = useState<DayIndex[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocal(draft)
    setRepeat([])
  }, [draft])

  if (!local) return null

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setLocal((d) => (d ? { ...d, [key]: value } : d))
  }

  return (
    <Modal
      open={!!draft}
      onClose={onClose}
      title={local.id ? 'Edit block' : 'New block'}
      subtitle={`${DAY_NAMES[local.day]}, ${durationLabel(local.start, local.end)}`}
      footer={
        <>
          {local.id ? (
            <div className="mr-auto">
              <ConfirmButton label="Delete" onConfirm={() => onDelete(local.id!)} />
            </div>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              try {
                await onSave(local, repeat)
              } finally {
                setSaving(false)
              }
            }}
          >
            {local.id ? 'Save changes' : 'Add block'}
          </Button>
        </>
      }
    >
      <Field label="What is it">
        <Input
          autoFocus
          value={local.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Leg day, Standup, Lunch"
        />
      </Field>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Day">
          <Select value={String(local.day)} onChange={(e) => set('day', Number(e.target.value) as DayIndex)}>
            {DAY_NAMES.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Start">
          <Input type="time" step={granularity * 60} value={local.start} onChange={(e) => set('start', e.target.value)} />
        </Field>
        <Field label="End">
          <Input type="time" step={granularity * 60} value={local.end} onChange={(e) => set('end', e.target.value)} />
        </Field>
      </div>

      <div className="mt-3">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Category</span>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                set('category', c.name)
                set('color', c.color)
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] transition-colors',
                local.category === c.name ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-2 hover:bg-surface-2',
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorVar(c.color) }} aria-hidden />
              {c.name}
            </button>
          ))}
        </div>
        <Input
          className="mt-2"
          value={local.category}
          onChange={(e) => set('category', e.target.value)}
          placeholder="Or type a new category"
        />
      </div>

      <div className="mt-3">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Colour</span>
        <div className="flex flex-wrap gap-1.5">
          {SCHEDULE_COLORS.map((c, i) => (
            <button
              key={c.name}
              onClick={() => set('color', i)}
              aria-label={c.name}
              title={c.name}
              className={cn(
                'h-8 w-8 rounded-lg transition-transform',
                local.color === i ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface' : 'hover:scale-105',
              )}
              style={{ background: colorVar(i) }}
            />
          ))}
        </div>
      </div>

      {!local.id ? (
        <div className="mt-4">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-2">
            Also add to <span className="font-normal text-ink-3">(optional)</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DAY_SHORT.map((d, i) => {
              const idx = i as DayIndex
              const on = repeat.includes(idx)
              return (
                <button
                  key={d}
                  disabled={idx === local.day}
                  onClick={() => setRepeat((r) => (on ? r.filter((x) => x !== idx) : [...r, idx]))}
                  className={cn(
                    'h-9 w-11 rounded-lg border text-[12.5px] font-medium transition-colors',
                    idx === local.day
                      ? 'cursor-not-allowed border-line bg-surface-2 text-ink-3'
                      : on
                        ? 'border-brand bg-brand text-brand-ink'
                        : 'border-line text-ink-2 hover:bg-surface-2',
                  )}
                >
                  {d}
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-3">
            <Copy size={12} />
            Copies this block to the days you pick.
          </p>
        </div>
      ) : null}

      <Field label="Note (optional)" className="mt-4">
        <Textarea value={local.note} onChange={(e) => set('note', e.target.value)} placeholder="Anything worth remembering" />
      </Field>
    </Modal>
  )
}

export function CategoryManager({
  open,
  onClose,
  categories,
  onSave,
}: {
  open: boolean
  onClose: () => void
  categories: Array<{ name: string; color: number }>
  onSave: (categories: Array<{ name: string; color: number }>) => void
}) {
  const [rows, setRows] = useState(categories)

  useEffect(() => {
    if (open) setRows(categories)
  }, [open, categories])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule categories"
      subtitle="The presets offered when you create a block, and the colour each one uses"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onSave(rows.filter((r) => r.name.trim()).map((r) => ({ ...r, name: r.name.trim() })))}
          >
            Save categories
          </Button>
        </>
      }
    >
      <ul className="space-y-2">
        {rows.map((row, i) => (
          <li key={i} className="rounded-xl border border-line bg-surface-2/50 p-2.5">
            <div className="flex items-center gap-2">
              <Input
                value={row.name}
                placeholder="Category name"
                onChange={(e) => setRows((l) => l.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
              <ConfirmButton label="Remove" onConfirm={() => setRows((l) => l.filter((_, j) => j !== i))} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SCHEDULE_COLORS.map((c, ci) => (
                <button
                  key={c.name}
                  onClick={() => setRows((l) => l.map((x, j) => (j === i ? { ...x, color: ci } : x)))}
                  aria-label={c.name}
                  title={c.name}
                  className={cn(
                    'h-7 w-7 rounded-lg transition-transform',
                    row.color === ci ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface' : 'hover:scale-105',
                  )}
                  style={{ background: colorVar(ci) }}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        className="mt-2.5 w-full"
        onClick={() => setRows((l) => [...l, { name: '', color: l.length % SCHEDULE_COLORS.length }])}
      >
        <Plus size={16} />
        Add category
      </Button>

      <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
        Removing a category here does not delete blocks that already use it. They keep their own name and colour until
        you edit them.
      </p>
    </Modal>
  )
}

function GridSettings({
  open,
  onClose,
  dayStart,
  dayEnd,
  onSave,
}: {
  open: boolean
  onClose: () => void
  dayStart: string
  dayEnd: string
  onSave: (start: string, end: string) => void
}) {
  const [start, setStart] = useState(dayStart)
  const [end, setEnd] = useState(dayEnd)
  useEffect(() => {
    if (open) {
      setStart(dayStart)
      setEnd(dayEnd)
    }
  }, [open, dayStart, dayEnd])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Grid hours"
      subtitle="How much of the day the timetable shows"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(start, end)} disabled={toMinutes(end) <= toMinutes(start)}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Day starts">
          <Input type="time" step={1800} value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Day ends">
          <Input type="time" step={1800} value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
      <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-ink-3">
        <Trash2 size={13} className="mt-px shrink-0 opacity-0" />
        Blocks outside these hours are kept, they just will not be drawn until you widen the range again.
      </p>
    </Modal>
  )
}
