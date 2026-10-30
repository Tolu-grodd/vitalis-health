import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Search, Star } from 'lucide-react'
import { Badge, cn, useOnClickOutside } from './ui'
import { FOOD_CATEGORIES, matchScore, FOOD_LIBRARY } from '@/lib/foodLibrary'
import { measuresFor } from '@/lib/measures'
import type { CustomFood, FoodUsage, LibraryFood } from '@/lib/types'

/** What a pick hands back: the food, plus the size it was last logged at. */
export interface RememberedSize {
  unit: string
  qty: number
  unitGrams: number
  unitLabel: string
}

interface Row {
  food: LibraryFood
  section: 'recent' | 'yours' | 'library'
  remembered?: RememberedSize
  /** Uses so far, shown on recent rows. */
  count?: number
}

function slug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Headers read differently once a query narrows the list. */
function sectionLabel(section: Row['section'], searching: boolean): string {
  if (section === 'recent') return searching ? 'From your history' : 'You eat this often'
  if (section === 'yours') return 'Your saved foods'
  return searching ? 'More from the library' : 'Food library'
}

/**
 * Free text field with a ranked, sectioned food dropdown behind it. Typing a
 * name that is not in the library is always valid: the dropdown fills in the
 * numbers, it never gates what you can log.
 *
 * Results are grouped rather than concatenated. The previous version put every
 * saved food above the library in alphabetical order, so the list looked the
 * same whatever you had actually been eating.
 */
export function FoodPicker({
  value,
  onChange,
  onPick,
  customFoods = [],
  usage = [],
  placeholder = 'Search a food, or type your own',
  autoFocus,
  className,
}: {
  value: string
  onChange: (name: string) => void
  onPick: (food: LibraryFood, remembered?: RememberedSize) => void
  customFoods?: CustomFood[]
  usage?: FoodUsage[]
  placeholder?: string
  autoFocus?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [category, setCategory] = useState('All')
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  useOnClickOutside(ref, () => setOpen(false))

  const yours = useMemo<LibraryFood[]>(
    () =>
      customFoods.map((f) => ({
        name: f.name,
        kcal: f.kcal,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        category: f.category || 'Your foods',
        serving: f.serving ?? undefined,
        servingLabel: f.servingLabel ?? undefined,
        cupGrams: f.cupGrams ?? undefined,
        spoonGrams: f.spoonGrams ?? undefined,
        pieceGrams: f.pieceGrams ?? undefined,
        pieceLabel: f.pieceLabel ?? undefined,
      })),
    [customFoods],
  )

  /** Name to food, so a usage record can be resolved back to real nutrition. */
  const byName = useMemo(() => {
    const m = new Map<string, LibraryFood>()
    for (const f of FOOD_LIBRARY) m.set(slug(f.name), f)
    for (const f of yours) m.set(slug(f.name), f)
    return m
  }, [yours])

  const rows = useMemo<Row[]>(() => {
    const q = value.trim()
    const inCategory = (f: LibraryFood) => category === 'All' || f.category === category
    const taken = new Set<string>()
    const out: Row[] = []

    /* Recent: most used first, then most recent. This is the section that
       makes the picker feel like it knows you. */
    const ranked = [...usage]
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0) || (b.lastUsed ?? '').localeCompare(a.lastUsed ?? ''))
      .slice(0, 40)

    for (const u of ranked) {
      const known = byName.get(u.id) ?? byName.get(slug(u.name))
      const food: LibraryFood =
        known ??
        ({
          name: u.name,
          kcal: u.per100?.kcal ?? 0,
          protein: u.per100?.protein ?? 0,
          carbs: u.per100?.carbs ?? 0,
          fat: u.per100?.fat ?? 0,
          category: u.category || 'Your foods',
          serving: u.serving ?? undefined,
          servingLabel: u.servingLabel ?? undefined,
        } as LibraryFood)

      if (!inCategory(food)) continue
      if (q && matchScore(food, q) == null) continue

      taken.add(slug(food.name))
      out.push({
        food,
        section: 'recent',
        count: u.count,
        remembered:
          u.unit && u.qty != null
            ? {
                unit: u.unit,
                qty: u.qty,
                unitGrams: u.unitGrams ?? 1,
                unitLabel: u.unitLabel ?? u.unit,
              }
            : undefined,
      })
      if (out.length >= 8) break
    }

    const rank = (list: LibraryFood[], section: Row['section'], limit: number) => {
      const scored: Array<{ f: LibraryFood; s: number }> = []
      for (const f of list) {
        if (!inCategory(f)) continue
        if (taken.has(slug(f.name))) continue
        const s = matchScore(f, q)
        if (s == null) continue
        scored.push({ f, s })
      }
      scored.sort((a, b) => a.s - b.s || a.f.name.localeCompare(b.f.name))
      for (const { f } of scored.slice(0, limit)) {
        taken.add(slug(f.name))
        out.push({ food: f, section })
      }
    }

    rank(yours, 'yours', 8)
    rank(FOOD_LIBRARY, 'library', q ? 30 : 24)

    return out
  }, [value, category, usage, yours, byName])

  useEffect(() => setCursor(0), [value, category])

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`[data-row="${cursor}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor, open])

  function choose(row: Row) {
    onPick(row.food, row.remembered)
    setOpen(false)
  }

  /* Section headers are rendered inline, so the flat index used for keyboard
     navigation is tracked separately from the rendered order. */
  let flat = -1

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
              setOpen(true)
              return
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setCursor((c) => Math.min(c + 1, rows.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setCursor((c) => Math.max(c - 1, 0))
            } else if (e.key === 'Enter' && open && rows[cursor]) {
              e.preventDefault()
              choose(rows[cursor])
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-3 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
        />
      </div>

      {/* No fixed minimum width: on a narrow row a 300px dropdown pushed the
          whole modal wider than the phone. */}
      {open ? (
        <div className="absolute z-40 mt-1.5 w-full animate-scale-in overflow-hidden rounded-2xl border border-line bg-surface shadow-float sm:min-w-[320px]">
          <div className="flex gap-1.5 overflow-x-auto border-b border-line px-2 py-2">
            {['All', ...FOOD_CATEGORIES].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  'shrink-0 rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors',
                  category === c ? 'bg-brand text-brand-ink' : 'bg-surface-2 text-ink-2 hover:text-ink',
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {rows.length ? (
            <ul ref={listRef} className="max-h-72 overflow-y-auto p-1.5">
              {rows.map((row, i) => {
                flat = i
                const prev = rows[i - 1]
                const showHeader = !prev || prev.section !== row.section
                const measures = measuresFor(row.food)
                const primary = measures[0]
                const kcalFor = Math.round((row.food.kcal * primary.grams) / 100)
                return (
                  <li key={`${row.section}-${row.food.name}`}>
                    {showHeader ? (
                      <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                        {sectionLabel(row.section, value.trim().length > 0)}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      data-row={flat}
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => choose(row)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                        i === cursor ? 'bg-surface-2' : 'hover:bg-surface-2',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          {row.section === 'recent' ? (
                            <Clock size={11} className="shrink-0 text-brand" />
                          ) : row.section === 'yours' ? (
                            <Star size={11} className="shrink-0 text-warning" />
                          ) : null}
                          <span className="truncate text-[13px] font-medium text-ink">{row.food.name}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-[11.5px] text-ink-3">
                          {row.remembered
                            ? `Last time: ${row.remembered.qty} ${row.remembered.unitLabel.toLowerCase()}`
                            : `${primary.label.toLowerCase() === 'grams' ? '100 g' : `1 ${primary.label.toLowerCase()}`} is about ${kcalFor} kcal`}
                          {row.count && row.count > 1 ? ` · logged ${row.count} times` : ''}
                        </span>
                      </span>
                      <Badge className="tnum shrink-0">{row.food.kcal} /100g</Badge>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-[12.5px] leading-relaxed text-ink-3">
              Nothing matches{category === 'All' ? '' : ` in ${category}`}. Keep typing to log it as your own food.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
