import { useState, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Table2, ChartColumn } from 'lucide-react'
import { Card, CardHeader, EmptyState, IconButton, cn } from './ui'
import { shortDate } from '@/lib/dates'

/* Categorical slots, fixed order, never cycled. Colour follows the entity. */
export const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'] as const

const AXIS = {
  tick: { fontSize: 11, fill: 'var(--ink-3)' },
  tickLine: false,
  axisLine: false,
} as const

const MARGIN = { top: 8, right: 8, bottom: 4, left: -18 }

/* ------------------------------------------------------------------ *
 * Shared chrome
 * ------------------------------------------------------------------ */

interface SeriesDef {
  key: string
  label: string
  color: string
  unit?: string
}

/**
 * Every chart ships a table-view twin, the WCAG-clean equivalent, so no value
 * is reachable only through hover.
 */
export function ChartCard({
  title,
  subtitle,
  series,
  data,
  xKey = 'date',
  height = 240,
  action,
  children,
  empty,
}: {
  title: string
  subtitle?: string
  series: SeriesDef[]
  data: Array<Record<string, number | string>>
  xKey?: string
  height?: number
  action?: ReactNode
  children: ReactNode
  empty?: boolean
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  return (
    // min-w-0 lets the card shrink into its grid column instead of being held
    // open by the chart's measured pixel width.
    <Card className="min-w-0 overflow-hidden">
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={
          <div className="flex items-center gap-1">
            {action}
            <IconButton
              label={view === 'chart' ? 'Show data table' : 'Show chart'}
              onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
            >
              {view === 'chart' ? <Table2 size={16} /> : <ChartColumn size={16} />}
            </IconButton>
          </div>
        }
      />

      {series.length > 1 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 pb-3">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.label}
            </span>
          ))}
        </div>
      ) : null}

      {empty ? (
        <EmptyState title="Nothing logged in this range" body="Entries you add will chart here automatically." />
      ) : view === 'chart' ? (
        <div className="w-full min-w-0 overflow-hidden px-2 pb-4" style={{ height: height + 24 }}>
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="max-h-[320px] overflow-auto px-5 pb-5">
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-line text-left">
                <th className="py-2 pr-3 font-medium text-ink-3">Date</th>
                {series.map((s) => (
                  <th key={s.key} className="py-2 pl-3 text-right font-medium text-ink-3">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((row, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  <td className="py-2 pr-3 text-ink-2">{String(row[xKey])}</td>
                  {series.map((s) => (
                    <td key={s.key} className="tnum py-2 pl-3 text-right text-ink">
                      {typeof row[s.key] === 'number' ? Math.round(row[s.key] as number).toLocaleString() : '-'}
                      {s.unit ? <span className="ml-0.5 text-ink-3">{s.unit}</span> : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

interface TooltipPayloadItem {
  name?: string
  dataKey?: string | number
  value?: number
  color?: string
  payload?: Record<string, unknown>
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
  labelFormatter,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  unit?: string
  labelFormatter?: (l: string) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="pointer-events-none rounded-xl border border-line bg-surface px-3 py-2 shadow-float">
      <p className="mb-1.5 text-[12px] font-medium text-ink-3">
        {labelFormatter && label ? labelFormatter(label) : label}
      </p>
      <div className="space-y-1">
        {payload
          .filter((p) => typeof p.value === 'number')
          .map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden />
                {p.name}
              </span>
              <span className="tnum text-[12px] font-semibold text-ink">
                {Math.round(p.value as number).toLocaleString()}
                {unit ? <span className="ml-0.5 font-normal text-ink-3">{unit}</span> : null}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}

const CURSOR = { stroke: 'var(--line-strong)', strokeWidth: 1 }
const BAR_CURSOR = { fill: 'var(--surface-2)' }

/* ------------------------------------------------------------------ *
 * Calories per day, against the goal
 * ------------------------------------------------------------------ */

export function CalorieTrend({
  data,
  goal,
  height = 240,
}: {
  data: Array<{ date: string; kcal: number }>
  goal: number
  height?: number
}) {
  const chartData = data.map((d) => ({ ...d, label: shortDate(d.date) }))
  return (
    <ChartCard
      title="Daily calories"
      subtitle={`Against a ${goal.toLocaleString()} kcal target`}
      series={[{ key: 'kcal', label: 'Calories', color: 'var(--series-1)', unit: ' kcal' }]}
      data={chartData.map((d) => ({ date: d.label, kcal: d.kcal }))}
      height={height}
      empty={!data.some((d) => d.kcal > 0)}
    >
      <BarChart data={chartData} margin={MARGIN} barCategoryGap="26%">
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...AXIS} minTickGap={18} />
        <YAxis {...AXIS} width={52} />
        <Tooltip content={<ChartTooltip unit=" kcal" />} cursor={BAR_CURSOR} />
        <ReferenceLine
          y={goal}
          stroke="var(--line-strong)"
          strokeWidth={1.5}
          label={{ value: 'Target', position: 'right', fill: 'var(--ink-3)', fontSize: 11 }}
        />
        <Bar dataKey="kcal" name="Calories" radius={[4, 4, 0, 0]} maxBarSize={30}>
          {chartData.map((d, i) => (
            /* Emphasis, not a value-ramp: over-target days are called out with a
               status colour; everything else is the single series colour. */
            <Cell key={i} fill={goal > 0 && d.kcal > goal ? 'var(--serious)' : 'var(--series-1)'} />
          ))}
        </Bar>
      </BarChart>
    </ChartCard>
  )
}

/* ------------------------------------------------------------------ *
 * Macro energy, stacked
 * ------------------------------------------------------------------ */

export function MacroTrend({
  data,
  height = 220,
}: {
  data: Array<{ date: string; protein: number; carbs: number; fat: number }>
  height?: number
}) {
  const chartData = data.map((d) => ({ ...d, label: shortDate(d.date) }))
  const series: SeriesDef[] = [
    { key: 'protein', label: 'Protein', color: 'var(--series-1)', unit: ' g' },
    { key: 'carbs', label: 'Carbs', color: 'var(--series-2)', unit: ' g' },
    { key: 'fat', label: 'Fat', color: 'var(--series-3)', unit: ' g' },
  ]
  return (
    <ChartCard
      title="Macronutrients"
      subtitle="Grams per day"
      series={series}
      data={chartData.map((d) => ({ date: d.label, protein: d.protein, carbs: d.carbs, fat: d.fat }))}
      height={height}
      empty={!data.some((d) => d.protein + d.carbs + d.fat > 0)}
    >
      <BarChart data={chartData} margin={MARGIN} barCategoryGap="26%">
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...AXIS} minTickGap={18} />
        <YAxis {...AXIS} width={44} />
        <Tooltip content={<ChartTooltip unit=" g" />} cursor={BAR_CURSOR} />
        {/* 2px surface stroke gives the required gap between stacked fills. */}
        <Bar dataKey="protein" name="Protein" stackId="m" fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} maxBarSize={30} />
        <Bar dataKey="carbs" name="Carbs" stackId="m" fill="var(--series-2)" stroke="var(--surface)" strokeWidth={2} maxBarSize={30} />
        <Bar dataKey="fat" name="Fat" stackId="m" fill="var(--series-3)" stroke="var(--surface)" strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={30} />
      </BarChart>
    </ChartCard>
  )
}

/* ------------------------------------------------------------------ *
 * Blood pressure on one axis, both measures in mmHg.
 * Pulse (bpm) deliberately lives in its own chart: never a second y-scale.
 * ------------------------------------------------------------------ */

export function BPTrend({
  data,
  targetSystolic,
  targetDiastolic,
  height = 250,
}: {
  data: Array<{ date: string; systolic: number; diastolic: number }>
  targetSystolic: number
  targetDiastolic: number
  height?: number
}) {
  const chartData = data.map((d) => ({ ...d, label: shortDate(d.date) }))
  const series: SeriesDef[] = [
    { key: 'systolic', label: 'Systolic', color: 'var(--series-1)', unit: ' mmHg' },
    { key: 'diastolic', label: 'Diastolic', color: 'var(--series-2)', unit: ' mmHg' },
  ]
  return (
    <ChartCard
      title="Blood pressure trend"
      subtitle={`Daily average · target ${targetSystolic}/${targetDiastolic} mmHg`}
      series={series}
      data={chartData.map((d) => ({ date: d.label, systolic: d.systolic, diastolic: d.diastolic }))}
      height={height}
      empty={!data.length}
    >
      <LineChart data={chartData} margin={MARGIN}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...AXIS} minTickGap={18} />
        <YAxis {...AXIS} width={44} domain={['dataMin - 12', 'dataMax + 12']} />
        <Tooltip content={<ChartTooltip unit=" mmHg" />} cursor={CURSOR} />
        <ReferenceLine y={targetSystolic} stroke="var(--line-strong)" strokeWidth={1} />
        <ReferenceLine y={targetDiastolic} stroke="var(--line-strong)" strokeWidth={1} />
        <Line
          type="monotone"
          dataKey="systolic"
          name="Systolic"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)', fill: 'var(--series-1)' }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--surface)' }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="diastolic"
          name="Diastolic"
          stroke="var(--series-2)"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)', fill: 'var(--series-2)' }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--surface)' }}
          connectNulls
        />
      </LineChart>
    </ChartCard>
  )
}

export function PulseTrend({ data, height = 180 }: { data: Array<{ date: string; pulse: number }>; height?: number }) {
  const chartData = data.map((d) => ({ ...d, label: shortDate(d.date) }))
  return (
    <ChartCard
      title="Resting pulse"
      subtitle="Daily average, beats per minute"
      series={[{ key: 'pulse', label: 'Pulse', color: 'var(--series-3)', unit: ' bpm' }]}
      data={chartData.map((d) => ({ date: d.label, pulse: d.pulse }))}
      height={height}
      empty={!data.length}
    >
      <AreaChart data={chartData} margin={MARGIN}>
        <defs>
          <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-3)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--series-3)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...AXIS} minTickGap={18} />
        <YAxis {...AXIS} width={40} domain={['dataMin - 8', 'dataMax + 8']} />
        <Tooltip content={<ChartTooltip unit=" bpm" />} cursor={CURSOR} />
        <Area
          type="monotone"
          dataKey="pulse"
          name="Pulse"
          stroke="var(--series-3)"
          strokeWidth={2}
          fill="url(#pulseFill)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }}
          connectNulls
        />
      </AreaChart>
    </ChartCard>
  )
}

/* ------------------------------------------------------------------ *
 * Macro split donut: part-to-whole at a glance, 3 segments
 * ------------------------------------------------------------------ */

export function MacroDonut({
  split,
  size = 150,
}: {
  split: { protein: number; carbs: number; fat: number }
  size?: number
}) {
  const data = [
    { name: 'Protein', value: split.protein, color: 'var(--series-1)' },
    { name: 'Carbs', value: split.carbs, color: 'var(--series-2)' },
    { name: 'Fat', value: split.fat, color: 'var(--series-3)' },
  ]
  const total = data.reduce((a, b) => a + b.value, 0)

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {total > 0 ? (
          <PieChart width={size} height={size}>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={size * 0.32}
              outerRadius={size * 0.48}
              paddingAngle={2}
              stroke="var(--surface)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip unit="%" />} />
          </PieChart>
        ) : (
          <div
            className="rounded-full border-[12px] border-surface-3"
            style={{ width: size, height: size }}
            aria-hidden
          />
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] uppercase tracking-[0.06em] text-ink-3">Energy</span>
          <span className="text-[12px] font-medium text-ink-2">split</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[13px] text-ink-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} aria-hidden />
              {d.name}
            </span>
            <span className="tnum text-[13px] font-semibold text-ink">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Horizontal bars for nominal categories, e.g. sets per muscle group.
 * One series, one colour. Bar length carries the value, never hue.
 * ------------------------------------------------------------------ */

export function CategoryBars({
  title,
  subtitle,
  data,
  label,
  unit,
  color = 'var(--series-1)',
}: {
  title: string
  subtitle?: string
  data: Array<{ name: string; value: number }>
  label: string
  unit: string
  color?: string
}) {
  const rows = [...data].sort((a, b) => b.value - a.value)
  const height = Math.max(rows.length * 26 + 20, 120)
  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      series={[{ key: 'value', label, color, unit: ` ${unit}` }]}
      data={rows.map((r) => ({ date: r.name, value: r.value }))}
      xKey="date"
      height={height}
      empty={!rows.length}
    >
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 34, bottom: 4, left: 4 }} barCategoryGap="24%">
        <CartesianGrid horizontal={false} />
        <XAxis type="number" {...AXIS} />
        <YAxis type="category" dataKey="name" {...AXIS} width={96} />
        <Tooltip content={<ChartTooltip unit={` ${unit}`} />} cursor={BAR_CURSOR} />
        <Bar dataKey="value" name={label} fill={color} radius={[0, 4, 4, 0]} maxBarSize={16} />
      </BarChart>
    </ChartCard>
  )
}

/* ------------------------------------------------------------------ *
 * Strength progression for one exercise over time
 * ------------------------------------------------------------------ */

export function ProgressionChart({
  data,
  exercise,
  height = 230,
}: {
  data: Array<{ date: string; top: number; estimated: number }>
  exercise: string
  height?: number
}) {
  const chartData = data.map((d) => ({ ...d, label: shortDate(d.date) }))
  const series: SeriesDef[] = [
    { key: 'top', label: 'Heaviest set', color: 'var(--series-1)', unit: ' kg' },
    { key: 'estimated', label: 'Estimated max', color: 'var(--series-2)', unit: ' kg' },
  ]
  return (
    <ChartCard
      title="Progression"
      subtitle={exercise ? `${exercise}, heaviest working set and estimated one rep max` : 'Pick an exercise'}
      series={series}
      data={chartData.map((d) => ({ date: d.label, top: d.top, estimated: d.estimated }))}
      height={height}
      empty={data.length < 1}
    >
      <LineChart data={chartData} margin={MARGIN}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...AXIS} minTickGap={18} />
        <YAxis {...AXIS} width={44} domain={['dataMin - 5', 'dataMax + 5']} />
        <Tooltip content={<ChartTooltip unit=" kg" />} cursor={CURSOR} />
        <Line
          type="monotone"
          dataKey="top"
          name="Heaviest set"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)', fill: 'var(--series-1)' }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--surface)' }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="estimated"
          name="Estimated max"
          stroke="var(--series-2)"
          strokeWidth={2}
          dot={{ r: 3.5, strokeWidth: 2, stroke: 'var(--surface)', fill: 'var(--series-2)' }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--surface)' }}
          connectNulls
        />
      </LineChart>
    </ChartCard>
  )
}

/* ------------------------------------------------------------------ *
 * Compact sparkline for stat tiles
 * ------------------------------------------------------------------ */

export function Sparkline({
  values,
  color = 'var(--series-1)',
  height = 36,
}: {
  values: number[]
  color?: string
  height?: number
}) {
  if (values.length < 2) return <div style={{ height }} />
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const w = 100
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = height - ((v - min) / span) * (height - 4) - 2
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }} aria-hidden>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Generic single-series day trend (water, sleep, anything per-day)
 * ------------------------------------------------------------------ */

export function DailyBarTrend({
  title,
  subtitle,
  data,
  label,
  unit,
  color = 'var(--series-1)',
  goal,
  height = 200,
}: {
  title: string
  subtitle?: string
  data: Array<{ date: string; value: number }>
  label: string
  unit: string
  color?: string
  goal?: number
  height?: number
}) {
  const chartData = data.map((d) => ({ label: shortDate(d.date), value: d.value }))
  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      series={[{ key: 'value', label, color, unit: ` ${unit}` }]}
      data={chartData.map((d) => ({ date: d.label, value: d.value }))}
      height={height}
      empty={!data.some((d) => d.value > 0)}
    >
      <BarChart data={chartData} margin={MARGIN} barCategoryGap="26%">
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...AXIS} minTickGap={18} />
        <YAxis {...AXIS} width={46} />
        <Tooltip content={<ChartTooltip unit={` ${unit}`} />} cursor={BAR_CURSOR} />
        {goal ? (
          <ReferenceLine
            y={goal}
            stroke="var(--line-strong)"
            strokeWidth={1.5}
            label={{ value: 'Goal', position: 'right', fill: 'var(--ink-3)', fontSize: 11 }}
          />
        ) : null}
        <Bar dataKey="value" name={label} fill={color} radius={[4, 4, 0, 0]} maxBarSize={30} />
      </BarChart>
    </ChartCard>
  )
}

/* ------------------------------------------------------------------ *
 * Day-of-week heat strip: one hue, light to dark (sequential)
 * ------------------------------------------------------------------ */

const SEQ = ['var(--seq-100)', 'var(--seq-250)', 'var(--seq-400)', 'var(--seq-550)', 'var(--seq-700)']

export function HeatStrip({
  data,
  unit = 'kcal',
}: {
  data: Array<{ date: string; value: number }>
  unit?: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex flex-wrap gap-1">
      {data.map((d) => {
        const step = d.value === 0 ? -1 : Math.min(Math.floor((d.value / max) * SEQ.length), SEQ.length - 1)
        return (
          <div
            key={d.date}
            title={`${shortDate(d.date)}: ${Math.round(d.value).toLocaleString()} ${unit}`}
            className={cn('h-6 w-6 rounded-[5px] border border-line')}
            style={{ background: step < 0 ? 'var(--surface-2)' : SEQ[step] }}
          />
        )
      })}
    </div>
  )
}
