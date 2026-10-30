import { useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown } from 'lucide-react'
import { Button, Field, Input, cn, useOnClickOutside } from './ui'
import { RANGE_PRESETS, rangeLabel, rangeLength } from '@/lib/dates'
import { useRange } from '@/hooks/useRange'

/**
 * Preset rows with a 16px bold check on the selection, ghost-wash hover, and a
 * custom range behind a hairline in the footer.
 */
export function DateRangeFilter({ className }: { className?: string }) {
  const { range, setPreset, setCustom } = useRange()
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(range.from)
  const [to, setTo] = useState(range.to)
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => setOpen(false))

  // Always the full, unambiguous range on wider screens.
  const label = rangeLabel(range)
  const shortLabel = RANGE_PRESETS.find((p) => p.id === range.id)?.label ?? 'Custom range'

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
      >
        <CalendarDays size={15} className="shrink-0 text-ink-3" />
        {/* The full range is long. Phones get the preset name only. */}
        <span className="max-w-[120px] truncate sm:hidden">{shortLabel}</span>
        <span className="hidden max-w-[280px] truncate sm:inline">{label}</span>
        <span className="tnum hidden text-[12px] text-ink-3 sm:inline">· {rangeLength(range)}d</span>
        <ChevronDown size={14} className={cn('shrink-0 text-ink-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-72 animate-scale-in overflow-hidden rounded-2xl border border-line bg-surface shadow-float">
          <ul className="p-1.5">
            {RANGE_PRESETS.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    setPreset(p.id)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] text-ink transition-colors hover:bg-surface-2"
                >
                  {p.label}
                  {range.id === p.id ? <Check size={16} strokeWidth={3} className="text-brand" /> : null}
                </button>
              </li>
            ))}
          </ul>

          <div className="border-t border-line px-3 py-3">
            <p className="mb-2 text-[12px] font-medium text-ink-3">Custom range</p>
            <div className="flex items-end gap-2">
              <Field label="From" className="flex-1">
                <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9 text-[13px]" />
              </Field>
              <Field label="To" className="flex-1">
                <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-9 text-[13px]" />
              </Field>
            </div>
            <Button
              size="sm"
              variant="primary"
              className="mt-2.5 w-full"
              onClick={() => {
                setCustom(from, to)
                setOpen(false)
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
