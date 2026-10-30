import type { ReactNode } from 'react'
import { Card, Delta, cn } from './ui'
import { Sparkline } from './charts'

/**
 * The number is the chart. Use this instead of a one-bar bar chart whenever the
 * story is a single value.
 */
export function StatTile({
  label,
  value,
  unit,
  hint,
  delta,
  deltaUnit,
  deltaInvert,
  spark,
  sparkColor,
  status,
  className,
}: {
  label: string
  value: ReactNode
  unit?: string
  hint?: ReactNode
  delta?: number
  deltaUnit?: string
  deltaInvert?: boolean
  spark?: number[]
  sparkColor?: string
  status?: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('flex flex-col justify-between p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12.5px] font-medium text-ink-3">{label}</span>
        {status}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[26px] font-semibold leading-none tracking-[-0.025em] text-ink">{value}</span>
        {unit ? <span className="text-[12.5px] text-ink-3">{unit}</span> : null}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {typeof delta === 'number' ? (
          <Delta value={delta} unit={deltaUnit} invert={deltaInvert} />
        ) : hint ? (
          <span className="text-[12px] text-ink-3">{hint}</span>
        ) : (
          <span />
        )}
      </div>
      {spark && spark.length > 1 ? (
        <div className="mt-2 -mb-1">
          <Sparkline values={spark} color={sparkColor ?? 'var(--series-1)'} height={30} />
        </div>
      ) : null}
    </Card>
  )
}
