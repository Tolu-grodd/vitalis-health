import { displayPrefs } from './prefs'
import type { Granularity, ScheduleBlock, ScheduleConfig } from './types'

/** Eight identity colours, taken in the fixed categorical order. A ninth
 *  category folds back to the first rather than inventing a new hue. */
export const SCHEDULE_COLORS = [
  { name: 'Blue', varName: '--series-1' },
  { name: 'Orange', varName: '--series-2' },
  { name: 'Aqua', varName: '--series-3' },
  { name: 'Yellow', varName: '--series-4' },
  { name: 'Pink', varName: '--series-5' },
  { name: 'Green', varName: '--series-6' },
  { name: 'Violet', varName: '--series-7' },
  { name: 'Red', varName: '--series-8' },
]

export function colorVar(slot: number): string {
  const c = SCHEDULE_COLORS[((slot % SCHEDULE_COLORS.length) + SCHEDULE_COLORS.length) % SCHEDULE_COLORS.length]
  return `var(${c.varName})`
}

export function toMinutes(clock: string): number {
  const [h, m] = clock.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function toClock(minutes: number): string {
  const clamped = Math.max(0, Math.min(minutes, 24 * 60))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function prettyClock(clock: string): string {
  const mins = toMinutes(clock)
  const h24 = Math.floor(mins / 60)
  const m = mins % 60
  if (displayPrefs().timeFormat === '24h') {
    return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  const suffix = h24 >= 12 ? 'pm' : 'am'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`
}

export function durationLabel(start: string, end: string): string {
  const mins = Math.max(toMinutes(end) - toMinutes(start), 0)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (!h) return `${m} min`
  if (!m) return `${h} hr`
  return `${h} hr ${m} min`
}

export function blockMinutes(b: ScheduleBlock): number {
  return Math.max(toMinutes(b.end) - toMinutes(b.start), 0)
}

/** Every row boundary in the grid, as minutes past midnight. */
export function gridSlots(config: ScheduleConfig): number[] {
  const start = toMinutes(config.dayStart)
  const end = toMinutes(config.dayEnd)
  const out: number[] = []
  for (let m = start; m < end; m += config.granularity) out.push(m)
  return out
}

export function snap(minutes: number, granularity: Granularity): number {
  return Math.round(minutes / granularity) * granularity
}

/**
 * Side-by-side placement for blocks that overlap. Blocks are grouped into
 * clusters that touch, then each cluster is packed into the fewest columns,
 * so a double-booked hour reads as two blocks rather than one hiding another.
 */
export interface PlacedBlock {
  block: ScheduleBlock
  column: number
  columns: number
}

export function placeDay(blocks: ScheduleBlock[]): PlacedBlock[] {
  const sorted = [...blocks].sort(
    (a, b) => toMinutes(a.start) - toMinutes(b.start) || toMinutes(b.end) - toMinutes(a.end),
  )
  const placed: PlacedBlock[] = []
  let cluster: ScheduleBlock[] = []
  let clusterEnd = -1

  const flush = () => {
    if (!cluster.length) return
    const columnEnds: number[] = []
    const assigned: Array<{ block: ScheduleBlock; column: number }> = []
    for (const b of cluster) {
      const s = toMinutes(b.start)
      let col = columnEnds.findIndex((endAt) => endAt <= s)
      if (col === -1) {
        col = columnEnds.length
        columnEnds.push(toMinutes(b.end))
      } else {
        columnEnds[col] = toMinutes(b.end)
      }
      assigned.push({ block: b, column: col })
    }
    const columns = columnEnds.length
    for (const a of assigned) placed.push({ ...a, columns })
    cluster = []
    clusterEnd = -1
  }

  for (const b of sorted) {
    const s = toMinutes(b.start)
    if (cluster.length && s >= clusterEnd) flush()
    cluster.push(b)
    clusterEnd = Math.max(clusterEnd, toMinutes(b.end))
  }
  flush()

  return placed
}

/** Total scheduled minutes per category, for the summary strip. */
export function categoryTotals(blocks: ScheduleBlock[]): Array<{ category: string; color: number; minutes: number }> {
  const map = new Map<string, { color: number; minutes: number }>()
  for (const b of blocks) {
    const key = b.category || 'Uncategorised'
    const cur = map.get(key) ?? { color: b.color, minutes: 0 }
    cur.minutes += blockMinutes(b)
    map.set(key, cur)
  }
  return [...map.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.minutes - a.minutes)
}

export function hoursLabel(minutes: number): string {
  const h = minutes / 60
  return h % 1 === 0 ? `${h} hr` : `${h.toFixed(1)} hr`
}

/** Does this block collide with an existing one on the same day. */
export function overlaps(a: { start: string; end: string }, b: { start: string; end: string }): boolean {
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end)
}

export const GRANULARITY_OPTIONS: Array<{ value: Granularity; label: string }> = [
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
]
