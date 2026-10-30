import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subDays,
} from 'date-fns'
import { daysFromWeekStart, displayPrefs } from './prefs'

/** Local calendar day key. Deliberately *not* UTC, because a meal belongs to the day
 *  you ate it in your own timezone. */
export function dateKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd')
}

export function timeKey(d: Date = new Date()): string {
  return format(d, 'HH:mm')
}

export function fromKeys(date: string, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const d = parseISO(date)
  d.setHours(h || 0, m || 0, 0, 0)
  return d
}

export function prettyDate(key: string): string {
  const today = dateKey()
  if (key === today) return 'Today'
  if (key === dateKey(subDays(new Date(), 1))) return 'Yesterday'
  return format(parseISO(key), 'EEE d MMM yyyy')
}

export function shortDate(key: string): string {
  return format(parseISO(key), 'd MMM')
}

/** Full absolute date. Never says "Today", so it cannot be misread as one. */
export function fullDate(key: string): string {
  return format(parseISO(key), 'EEEE d MMMM yyyy')
}

/**
 * A date range as one unambiguous string, for example
 * "Last 7 days, 30 Aug to 5 Sep 2026".
 *
 * Both ends are absolute on purpose. Rendering the end as "Today" next to an
 * absolute start date reads as though the app thinks today is the start date.
 */
export function rangeLabel(range: DateRange): string {
  const from = parseISO(range.from)
  const to = parseISO(range.to)
  const sameYear = from.getFullYear() === to.getFullYear()
  const span = `${format(from, sameYear ? 'd MMM' : 'd MMM yyyy')} to ${format(to, 'd MMM yyyy')}`
  const preset = RANGE_PRESETS.find((p) => p.id === range.id)
  return preset ? `${preset.label}, ${span}` : span
}

export function prettyTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h || 0, m || 0)
  return format(d, displayPrefs().timeFormat === '24h' ? 'HH:mm' : 'h:mm a')
}

/** Weekday headers in the user's chosen order. */
export function weekdayLabels(): string[] {
  const mondayFirst = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return displayPrefs().weekStartsOn === 'sun'
    ? ['Sun', ...mondayFirst.slice(0, 6)]
    : mondayFirst
}

/** The current week as a range, honouring which day the week starts on. */
export function weekRange(from: Date = new Date()): DateRange {
  const start = new Date(from)
  start.setDate(from.getDate() - daysFromWeekStart(from.getDay()))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { id: 'custom', from: dateKey(start), to: dateKey(end), label: 'This week' }
}

export type RangeId = '7d' | '14d' | '30d' | '90d' | 'mtd' | 'custom'

export interface DateRange {
  id: RangeId
  from: string
  to: string
  label: string
}

export const RANGE_PRESETS: Array<{ id: RangeId; label: string }> = [
  { id: '7d', label: 'Last 7 days' },
  { id: '14d', label: 'Last 14 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'mtd', label: 'Month to date' },
]

export function buildRange(id: RangeId, from?: string, to?: string): DateRange {
  const now = new Date()
  const today = dateKey(now)
  switch (id) {
    case '7d':
      return { id, from: dateKey(subDays(now, 6)), to: today, label: 'Last 7 days' }
    case '14d':
      return { id, from: dateKey(subDays(now, 13)), to: today, label: 'Last 14 days' }
    case '30d':
      return { id, from: dateKey(subDays(now, 29)), to: today, label: 'Last 30 days' }
    case '90d':
      return { id, from: dateKey(subDays(now, 89)), to: today, label: 'Last 90 days' }
    case 'mtd':
      return { id, from: dateKey(startOfMonth(now)), to: today, label: 'Month to date' }
    default:
      return {
        id: 'custom',
        from: from ?? dateKey(subDays(now, 6)),
        to: to ?? today,
        label: 'Custom range',
      }
  }
}

/** Every day in the range, oldest first, so charts show empty days as zero
 *  rather than silently closing the gap. */
export function daysInRange(range: DateRange): string[] {
  const start = parseISO(range.from)
  const end = parseISO(range.to)
  if (differenceInCalendarDays(end, start) < 0) return [range.from]
  return eachDayOfInterval({ start, end }).map((d) => dateKey(d))
}

export function rangeLength(range: DateRange): number {
  return differenceInCalendarDays(parseISO(range.to), parseISO(range.from)) + 1
}

/** The equal-length window immediately before `range`, for period-over-period. */
export function previousRange(range: DateRange): DateRange {
  const len = rangeLength(range)
  const end = subDays(parseISO(range.from), 1)
  const start = subDays(end, len - 1)
  return { id: 'custom', from: dateKey(start), to: dateKey(end), label: 'Previous period' }
}

export function monthGrid(monthDate: Date): Array<{ key: string; inMonth: boolean }> {
  const first = startOfMonth(monthDate)
  const last = endOfMonth(monthDate)
  const lead = daysFromWeekStart(first.getDay())
  const cells: Array<{ key: string; inMonth: boolean }> = []
  for (let i = lead; i > 0; i--) cells.push({ key: dateKey(subDays(first, i)), inMonth: false })
  for (const d of eachDayOfInterval({ start: first, end: last })) cells.push({ key: dateKey(d), inMonth: true })
  let trail = 1
  while (cells.length % 7 !== 0) {
    cells.push({ key: dateKey(addDays(last, trail)), inMonth: false })
    trail++
  }
  return cells
}

export { format, parseISO, startOfMonth, endOfMonth, addDays, subDays }
