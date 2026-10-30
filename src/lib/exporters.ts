import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, parseISO } from 'date-fns'
import { bpAverages, classifyBP, mean, round1, sumMeals } from './health'
import { describeSize } from './measures'
import { prettyClock } from './schedule'
import type { DateRange } from './dates'
import type { BPReading, Meal, MedEntry, Settings, SleepEntry, WaterEntry } from './types'

export interface ExportBundle {
  range: DateRange
  days: string[]
  meals: Meal[]
  bp: BPReading[]
  water: WaterEntry[]
  sleep: SleepEntry[]
  meds: MedEntry[]
  settings: Settings
  who: { name?: string | null; email?: string | null }
}

/* ------------------------------------------------------------------ *
 * CSV
 * ------------------------------------------------------------------ */

function escapeCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCSV(headers: string[], rows: Array<Array<string | number | null>>): string {
  return [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\r\n')
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ------------------------------------------------------------------ *
 * Grouped meal log
 *
 * The log is naturally a hierarchy: a day holds meals, a meal holds
 * components. Flattening that into one row per component repeats the date and
 * meal name on every line and is miserable to read. Both exports below share
 * this grouping so the CSV and the spreadsheet always agree.
 * ------------------------------------------------------------------ */

interface ComponentRow {
  name: string
  /** Human readable size, for example "1 cup (180 g)". Carries the amount and
   *  the unit in one column so the sheet stays narrow. */
  size: string
  kcal: number
}

interface MealGroup {
  label: string
  time: string
  kcal: number
  note: string
  components: ComponentRow[]
}

interface DayGroup {
  date: string
  kcal: number
  meals: MealGroup[]
}

/** Kept deliberately short. Anything that applies to a whole day or a whole
 *  meal is written once and merged down, rather than repeated per component. */
export const MEAL_COLUMNS = ['Date', 'Time', 'Meal', 'Component', 'Weight', 'Calories', 'Meal total', 'Day total']

function groupMeals(meals: Meal[]): DayGroup[] {
  const byDay = new Map<string, Meal[]>()
  for (const m of meals) {
    const list = byDay.get(m.date) ?? []
    list.push(m)
    byDay.set(m.date, list)
  }

  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, list]) => {
      const ordered = [...list].sort((a, b) => (a.time || '').localeCompare(b.time || ''))
      return {
        date,
        kcal: Math.round(ordered.reduce((a, b) => a + (b.kcal || 0), 0)),
        meals: ordered.map((m) => ({
          // The slot is the useful label here, matching how people read a log.
          label: m.slot || m.name,
          time: m.time,
          kcal: Math.round(m.kcal || 0),
          note: m.note ?? '',
          components: (m.items ?? []).map((i) => ({
            name: i.name,
            size: describeSize(i),
            kcal: Math.round(i.kcal || 0),
          })),
        })),
      }
    })
}

/**
 * Grouped CSV: the date, meal, time and totals are written once on the first
 * line of their group and left blank underneath.
 *
 * CSV has no concept of a merged cell, so this is as close as the format gets.
 * Opened in a spreadsheet it reads as a grouped table. The Excel export does
 * the same thing with real merges.
 */
export function exportMealsCSV(bundle: ExportBundle) {
  const days = groupMeals(bundle.meals)
  const rows: Array<Array<string | number | null>> = []

  for (const day of days) {
    let dayLineUsed = false
    for (const meal of day.meals) {
      const components = meal.components.length ? meal.components : [{ name: '', size: '', kcal: 0 }]

      components.forEach((c, ci) => {
        const first = ci === 0
        // The day total rides on the same line as the date, so a day reads as
        // one block with its own bottom line.
        const firstOfDay = !dayLineUsed
        rows.push([
          firstOfDay ? fmtDay(day.date) : '',
          first ? prettyClock(meal.time) : '',
          first ? meal.label : '',
          c.name,
          c.size,
          c.kcal,
          first ? meal.kcal : '',
          firstOfDay ? day.kcal : '',
        ])
        dayLineUsed = true
      })
    }
    // A blank line between days, which is what makes it scannable.
    rows.push(MEAL_COLUMNS.map(() => ''))
  }

  download(
    `vitalis-meals_${bundle.range.from}_to_${bundle.range.to}.csv`,
    toCSV(MEAL_COLUMNS, rows),
    'text/csv;charset=utf-8',
  )
}

/**
 * The same log as a real spreadsheet, with the date, meal, time and totals
 * merged down over their rows exactly as they would be written by hand.
 */
export async function exportMealsExcel(bundle: ExportBundle) {
  const { buildWorkbook, STYLE, colLetter } = await import('./xlsx')
  const days = groupMeals(bundle.meals)

  const rows: Array<Array<{ v: string | number | null; s?: number }>> = []
  const merges: string[] = []

  rows.push([{ v: 'Vitalis meal log', s: STYLE.title }])
  rows.push([
    {
      v: `${fmtDay(bundle.range.from)} to ${fmtDay(bundle.range.to)}  ·  ${bundle.who.name ?? bundle.who.email ?? ''}`,
      s: STYLE.subtitle,
    },
  ])
  rows.push([])
  rows.push(MEAL_COLUMNS.map((c) => ({ v: c, s: STYLE.header })))

  const HEADER_ROWS = 4

  for (const day of days) {
    const dayFirstRow = rows.length + 1

    for (const meal of day.meals) {
      const mealFirstRow = rows.length + 1
      const components = meal.components.length ? meal.components : [{ name: '', size: '', kcal: 0 }]

      components.forEach((c, ci) => {
        const first = ci === 0
        const firstOfDay = first && mealFirstRow === dayFirstRow
        rows.push([
          { v: firstOfDay ? fmtDay(day.date) : null, s: STYLE.groupCentre },
          { v: first ? prettyClock(meal.time) : null, s: STYLE.groupCentre },
          { v: first ? meal.label : null, s: STYLE.group },
          { v: c.name, s: STYLE.cell },
          { v: c.size, s: STYLE.cell },
          { v: c.kcal, s: STYLE.num },
          { v: first ? meal.kcal : null, s: STYLE.total },
          // Written once per day and merged down beside the date.
          { v: firstOfDay ? day.kcal : null, s: STYLE.total },
        ])
      })

      const mealLastRow = rows.length
      if (mealLastRow > mealFirstRow) {
        merges.push(`${colLetter(1)}${mealFirstRow}:${colLetter(1)}${mealLastRow}`) // Time
        merges.push(`${colLetter(2)}${mealFirstRow}:${colLetter(2)}${mealLastRow}`) // Meal
        merges.push(`${colLetter(6)}${mealFirstRow}:${colLetter(6)}${mealLastRow}`) // Meal total
      }
    }

    const dayLastRow = rows.length
    if (dayLastRow > dayFirstRow) {
      merges.push(`${colLetter(0)}${dayFirstRow}:${colLetter(0)}${dayLastRow}`) // Date
      merges.push(`${colLetter(7)}${dayFirstRow}:${colLetter(7)}${dayLastRow}`) // Day total
    }
  }

  buildWorkbookDownload(
    buildWorkbook([
      {
        name: 'Meal log',
        widths: [18, 10, 12, 26, 18, 11, 12, 12],
        rows,
        merges,
        freezeRows: HEADER_ROWS,
      },
    ]),
    `vitalis-meals_${bundle.range.from}_to_${bundle.range.to}.xlsx`,
  )
}

function buildWorkbookDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportBPCSV(bundle: ExportBundle) {
  const rows = [...bundle.bp]
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .map((r) => [
      r.date,
      r.time,
      r.systolic,
      r.diastolic,
      r.pulse ?? '',
      classifyBP(r.systolic, r.diastolic).label,
      r.arm ?? '',
      r.position ?? '',
      r.note ?? '',
    ])
  download(
    `vitalis-blood-pressure_${bundle.range.from}_to_${bundle.range.to}.csv`,
    toCSV(
      ['Date', 'Time', 'Systolic (mmHg)', 'Diastolic (mmHg)', 'Pulse (bpm)', 'Category', 'Arm', 'Position', 'Note'],
      rows,
    ),
    'text/csv;charset=utf-8',
  )
}

export function exportVitalsCSV(bundle: ExportBundle) {
  const rows: Array<Array<string | number | null>> = []
  for (const w of bundle.water) rows.push([w.date, w.time, 'Water', `${w.ml} ml`, ''])
  for (const s of bundle.sleep) rows.push([s.date, s.time, 'Sleep', `${s.hours} h`, `quality ${s.quality}/5`])
  for (const m of bundle.meds) rows.push([m.date, m.time, 'Medication', `${m.name} ${m.dose}`.trim(), m.taken ? 'taken' : 'not taken'])
  rows.sort((a, b) => `${a[0]}${a[1]}`.localeCompare(`${b[0]}${b[1]}`))
  download(
    `vitalis-vitals_${bundle.range.from}_to_${bundle.range.to}.csv`,
    toCSV(['Date', 'Time', 'Type', 'Value', 'Detail'], rows),
    'text/csv;charset=utf-8',
  )
}

/* ------------------------------------------------------------------ *
 * PDF report you can hand to a clinician
 * ------------------------------------------------------------------ */

const INK = '#0b0b0b'
const MUTED = '#6b6a66'
const BRAND: [number, number, number] = [28, 92, 171]

function fmtDay(key: string) {
  return format(parseISO(key), 'EEE d MMM yyyy')
}

export function exportPDF(bundle: ExportBundle) {
  const { range, days, meals, bp, water, sleep, meds, settings, who } = bundle
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const M = 40

  /* ---- header ---- */
  doc.setFillColor(...BRAND)
  doc.roundedRect(M, M, 22, 22, 6, 6, 'F')
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(1.6)
  doc.lines(
    [
      [2.8, 0],
      [1.5, -3.9],
      [2.2, 6.7],
      [1.9, -4.9],
      [1.2, 2.1],
      [4.3, 0],
    ],
    M + 4,
    M + 12,
  )

  doc.setTextColor(INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Vitalis health report', M + 32, M + 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text(
    `${fmtDay(range.from)} to ${fmtDay(range.to)}  ·  ${days.length} days`,
    M + 32,
    M + 23,
  )

  doc.setFontSize(8)
  doc.text(
    [who.name ?? who.email ?? '', `Generated ${format(new Date(), 'd MMM yyyy, HH:mm')}`].filter(Boolean).join('  ·  '),
    pageW - M,
    M + 11,
    { align: 'right' },
  )

  let y = M + 46

  /* ---- summary ---- */
  const kcalByDay = new Map<string, number>()
  for (const m of meals) kcalByDay.set(m.date, (kcalByDay.get(m.date) ?? 0) + m.kcal)
  const loggedKcal = [...kcalByDay.values()].filter((v) => v > 0)
  const totals = sumMeals(meals)
  const avgBP = bpAverages(bp)
  const waterDays = new Map<string, number>()
  for (const w of water) waterDays.set(w.date, (waterDays.get(w.date) ?? 0) + w.ml)
  const sleepHours = sleep.map((s) => s.hours)

  const summary: Array<[string, string]> = [
    ['Average daily calories', loggedKcal.length ? `${Math.round(mean(loggedKcal)).toLocaleString()} kcal` : '-'],
    ['Calorie target', `${settings.calorieGoal.toLocaleString()} kcal`],
    ['Days logged', `${loggedKcal.length} of ${days.length}`],
    ['Average macros (P / C / F)', meals.length ? `${round1(totals.protein / Math.max(loggedKcal.length, 1))} / ${round1(totals.carbs / Math.max(loggedKcal.length, 1))} / ${round1(totals.fat / Math.max(loggedKcal.length, 1))} g` : '-'],
    ['Blood pressure readings', String(bp.length)],
    ['Average blood pressure', avgBP.systolic ? `${avgBP.systolic}/${avgBP.diastolic} mmHg (${classifyBP(avgBP.systolic, avgBP.diastolic).label})` : '-'],
    ['Average pulse', avgBP.pulse ? `${avgBP.pulse} bpm` : '-'],
    ['Average water', waterDays.size ? `${Math.round(mean([...waterDays.values()]))} ml/day` : '-'],
    ['Average sleep', sleepHours.length ? `${round1(mean(sleepHours))} h` : '-'],
    ['Doses logged', meds.length ? `${meds.filter((m) => m.taken).length} taken of ${meds.length}` : '-'],
  ]

  autoTable(doc, {
    startY: y,
    head: [['Summary', '']],
    body: summary,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 0, right: 6 }, textColor: INK },
    headStyles: { fontStyle: 'bold', fontSize: 8, textColor: MUTED, cellPadding: { top: 0, bottom: 6, left: 0, right: 0 } },
    columnStyles: { 0: { cellWidth: 200, textColor: MUTED }, 1: { fontStyle: 'bold' } },
    margin: { left: M, right: M },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22

  /* ---- daily calorie table ---- */
  if (kcalByDay.size) {
    const proteinBy = new Map<string, number>()
    const carbBy = new Map<string, number>()
    const fatBy = new Map<string, number>()
    const mealCount = new Map<string, number>()
    for (const m of meals) {
      proteinBy.set(m.date, (proteinBy.get(m.date) ?? 0) + m.protein)
      carbBy.set(m.date, (carbBy.get(m.date) ?? 0) + m.carbs)
      fatBy.set(m.date, (fatBy.get(m.date) ?? 0) + m.fat)
      mealCount.set(m.date, (mealCount.get(m.date) ?? 0) + 1)
    }
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Meals', 'Calories', 'vs target', 'Protein', 'Carbs', 'Fat']],
      body: days
        .filter((d) => kcalByDay.has(d))
        .map((d) => {
          const k = kcalByDay.get(d) ?? 0
          const delta = k - settings.calorieGoal
          return [
            fmtDay(d),
            String(mealCount.get(d) ?? 0),
            `${Math.round(k).toLocaleString()} kcal`,
            `${delta >= 0 ? '+' : ''}${Math.round(delta).toLocaleString()}`,
            `${round1(proteinBy.get(d) ?? 0)} g`,
            `${round1(carbBy.get(d) ?? 0)} g`,
            `${round1(fatBy.get(d) ?? 0)} g`,
          ]
        }),
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 4, textColor: INK },
      headStyles: { fillColor: BRAND, textColor: 255, fontSize: 8.5 },
      alternateRowStyles: { fillColor: [246, 246, 244] },
      margin: { left: M, right: M },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22
  }

  /* ---- blood pressure table ---- */
  if (bp.length) {
    if (y > doc.internal.pageSize.getHeight() - 160) {
      doc.addPage()
      y = M
    }
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Time', 'Reading', 'Pulse', 'Category', 'Context']],
      body: [...bp]
        .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
        .map((r) => [
          fmtDay(r.date),
          r.time,
          `${r.systolic}/${r.diastolic} mmHg`,
          r.pulse ? `${r.pulse} bpm` : '-',
          classifyBP(r.systolic, r.diastolic).label,
          [r.arm ? `${r.arm} arm` : '', r.position ?? '', r.note ?? ''].filter(Boolean).join(', '),
        ]),
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 4, textColor: INK },
      headStyles: { fillColor: BRAND, textColor: 255, fontSize: 8.5 },
      alternateRowStyles: { fillColor: [246, 246, 244] },
      margin: { left: M, right: M },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22
  }

  /* ---- what actually drove the calories ---- */
  if (meals.length) {
    const byFood = new Map<string, { name: string; kcal: number; times: number }>()
    for (const m of meals) {
      for (const i of m.items ?? []) {
        const key = i.name.trim().toLowerCase()
        if (!key) continue
        const cur = byFood.get(key) ?? { name: i.name.trim(), kcal: 0, times: 0 }
        cur.kcal += i.kcal || 0
        cur.times += 1
        byFood.set(key, cur)
      }
    }
    const top = [...byFood.values()].sort((a, b) => b.kcal - a.kcal).slice(0, 12)
    const totalComponentKcal = [...byFood.values()].reduce((a, b) => a + b.kcal, 0) || 1

    if (top.length) {
      if (y > doc.internal.pageSize.getHeight() - 200) {
        doc.addPage()
        y = M
      }
      autoTable(doc, {
        startY: y,
        head: [['Biggest calorie sources', 'Times eaten', 'Total kcal', 'Share']],
        body: top.map((f) => [
          f.name,
          String(f.times),
          `${Math.round(f.kcal).toLocaleString()} kcal`,
          `${Math.round((f.kcal / totalComponentKcal) * 100)}%`,
        ]),
        theme: 'striped',
        styles: { fontSize: 8.5, cellPadding: 4, textColor: INK },
        headStyles: { fillColor: BRAND, textColor: 255, fontSize: 8.5 },
        alternateRowStyles: { fillColor: [246, 246, 244] },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        margin: { left: M, right: M },
      })
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22
    }
  }

  /* ---- meal detail ---- */
  if (meals.length) {
    doc.addPage()
    y = M
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(INK)
    doc.text('Meal detail', M, y)
    y += 14
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Time', 'Meal', 'Component', 'Weight', 'kcal', 'P', 'C', 'F']],
      body: [...meals]
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .flatMap((m) =>
          (m.items ?? []).map((i, idx) => [
            idx === 0 ? fmtDay(m.date) : '',
            idx === 0 ? m.time : '',
            idx === 0 ? m.name : '',
            i.name,
            describeSize(i) || '-',
            String(Math.round(i.kcal)),
            String(round1(i.protein)),
            String(round1(i.carbs)),
            String(round1(i.fat)),
          ]),
        ),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 3.5, textColor: INK },
      headStyles: { fillColor: BRAND, textColor: 255, fontSize: 8 },
      alternateRowStyles: { fillColor: [246, 246, 244] },
      margin: { left: M, right: M },
    })
  }

  /* ---- footer on every page ---- */
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(MUTED)
    doc.text(
      'Self-reported data recorded in Vitalis. Informational only. Not a medical device and not a diagnosis.',
      M,
      doc.internal.pageSize.getHeight() - 22,
    )
    doc.text(`${p} / ${pages}`, pageW - M, doc.internal.pageSize.getHeight() - 22, { align: 'right' })
  }

  doc.save(`vitalis-report_${range.from}_to_${range.to}.pdf`)
}
