import { useMemo, useState } from 'react'
import { ChevronDown, Clock, Pencil, Plus, UtensilsCrossed } from 'lucide-react'
import { PageHeader } from '@/components/AppShell'
import { MealEditor } from '@/components/MealEditor'
import { Badge, Button, Card, ConfirmButton, EmptyState, IconButton, SkeletonBlock, cn, useToast } from '@/components/ui'
import { useRangeCollection, useMutations, useSettings } from '@/hooks/useData'
import { useRange } from '@/hooks/useRange'
import { daysInRange, prettyDate, prettyTime } from '@/lib/dates'
import { describeSize, round1, sumMeals } from '@/lib/health'
import type { Meal } from '@/lib/types'

export function Meals() {
  const { range } = useRange()
  const { items, loading } = useRangeCollection<Meal>('meals', range)
  const { settings } = useSettings()
  const { remove } = useMutations('meals')
  const toast = useToast()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Meal | null>(null)
  const [openMeal, setOpenMeal] = useState<string | null>(null)

  const byDay = useMemo(() => {
    const map = new Map<string, Meal[]>()
    for (const m of items) {
      const list = map.get(m.date) ?? []
      list.push(m)
      map.set(m.date, list)
    }
    for (const list of map.values()) list.sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    return daysInRange(range)
      .slice()
      .reverse()
      .map((d) => ({ date: d, meals: map.get(d) ?? [] }))
      .filter((d) => d.meals.length > 0)
  }, [items, range])

  function openNew(date?: string) {
    setEditing(null)
    setEditorOpen(true)
    setDefaultDate(date)
  }
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined)

  return (
    <>
      <PageHeader
        title="Meals"
        subtitle={`${items.length} meal${items.length === 1 ? '' : 's'} logged in this range`}
        action={
          <Button variant="primary" onClick={() => openNew()}>
            <Plus size={16} />
            Log a meal
          </Button>
        }
      />

      {loading && !items.length ? (
        <div className="space-y-3">
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-28" />
        </div>
      ) : !byDay.length ? (
        <Card>
          <EmptyState
            icon={<UtensilsCrossed size={20} />}
            title="No meals in this range"
            body="Log a meal and it will be stamped with today's date and the time you ate, then charted automatically."
            action={
              <Button variant="primary" onClick={() => openNew()}>
                <Plus size={16} />
                Log your first meal
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-7">
          {byDay.map(({ date, meals }) => {
            const t = sumMeals(meals)
            const ratio = settings.calorieGoal ? Math.min(t.kcal / settings.calorieGoal, 1) : 0
            const over = t.kcal > settings.calorieGoal
            return (
              <section key={date}>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{prettyDate(date)}</h2>
                    <p className="mt-0.5 text-[12.5px] text-ink-3">
                      {meals.length} meal{meals.length === 1 ? '' : 's'} · P {round1(t.protein)} · C {round1(t.carbs)} ·
                      F {round1(t.fat)} g
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tnum text-[15px] font-semibold text-ink">
                      {Math.round(t.kcal).toLocaleString()}
                      <span className="ml-1 text-[12px] font-normal text-ink-3">
                        / {settings.calorieGoal.toLocaleString()} kcal
                      </span>
                    </p>
                    <div className="mt-1.5 h-1.5 w-40 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{
                          width: `${ratio * 100}%`,
                          background: over ? 'var(--serious)' : 'var(--brand)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {meals.map((meal) => {
                    const isOpen = openMeal === meal.id
                    return (
                      <Card key={meal.id} className="overflow-hidden">
                        <div className="flex items-start gap-3 p-4">
                          <button
                            onClick={() => setOpenMeal(isOpen ? null : meal.id)}
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                            aria-expanded={isOpen}
                          >
                            <ChevronDown
                              size={16}
                              className={cn('mt-0.5 shrink-0 text-ink-3 transition-transform', isOpen && 'rotate-180')}
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-[14px] font-semibold tracking-[-0.01em] text-ink">
                                  {meal.name}
                                </span>
                                <Badge>{meal.slot}</Badge>
                                <span className="inline-flex items-center gap-1 text-[12px] text-ink-3">
                                  <Clock size={12} />
                                  {prettyTime(meal.time)}
                                </span>
                              </div>
                              {/* Components and their calories, so the list is
                                  readable without opening anything. */}
                              <p className="mt-1 truncate text-[12.5px] text-ink-3">
                                {meal.items
                                  .map((i) => {
                                    const size = describeSize(i)
                                    return `${i.name}${size ? ` ${size}` : ''} ${Math.round(i.kcal)} kcal`
                                  })
                                  .join(' · ')}
                              </p>
                            </div>
                          </button>
                          <div className="shrink-0 text-right">
                            <p className="tnum text-[15px] font-semibold text-ink">
                              {Math.round(meal.kcal).toLocaleString()}
                              <span className="ml-0.5 text-[11px] font-normal text-ink-3">kcal</span>
                            </p>
                            <p className="tnum text-[11.5px] text-ink-3">
                              P {round1(meal.protein)} · C {round1(meal.carbs)} · F {round1(meal.fat)}
                            </p>
                          </div>
                          <IconButton
                            label="Edit meal"
                            onClick={() => {
                              setEditing(meal)
                              setDefaultDate(undefined)
                              setEditorOpen(true)
                            }}
                          >
                            <Pencil size={15} />
                          </IconButton>
                        </div>

                        {isOpen ? (
                          <div className="animate-fade-in border-t border-line bg-surface-2/40 px-4 py-3">
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[440px] border-collapse text-[13px]">
                                <thead>
                                  <tr className="border-b border-line text-left text-ink-3">
                                    <th className="py-1.5 pr-3 font-medium">Component</th>
                                    <th className="py-1.5 px-3 text-right font-medium">Weight</th>
                                    <th className="py-1.5 px-3 text-right font-medium">Calories</th>
                                    <th className="py-1.5 px-3 text-right font-medium">P</th>
                                    <th className="py-1.5 px-3 text-right font-medium">C</th>
                                    <th className="py-1.5 pl-3 text-right font-medium">F</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {meal.items.map((i, idx) => (
                                    <tr key={i.key ?? idx} className="border-b border-line/60 last:border-0">
                                      <td className="py-2 pr-3 text-ink">{i.name}</td>
                                      <td className="tnum py-2 px-3 text-right text-ink-2">
                                        {describeSize(i) || '-'}
                                      </td>
                                      <td className="tnum py-2 px-3 text-right font-medium text-ink">
                                        {Math.round(i.kcal).toLocaleString()}
                                      </td>
                                      <td className="tnum py-2 px-3 text-right text-ink-2">{round1(i.protein)}</td>
                                      <td className="tnum py-2 px-3 text-right text-ink-2">{round1(i.carbs)}</td>
                                      <td className="tnum py-2 pl-3 text-right text-ink-2">{round1(i.fat)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t border-line font-semibold text-ink">
                                    <td className="py-2 pr-3">Total</td>
                                    <td className="tnum py-2 px-3 text-right">{round1(meal.grams)} g</td>
                                    <td className="tnum py-2 px-3 text-right">
                                      {Math.round(meal.kcal).toLocaleString()}
                                    </td>
                                    <td className="tnum py-2 px-3 text-right">{round1(meal.protein)}</td>
                                    <td className="tnum py-2 px-3 text-right">{round1(meal.carbs)}</td>
                                    <td className="tnum py-2 pl-3 text-right">{round1(meal.fat)}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                            {meal.note ? (
                              <p className="mt-3 text-[12.5px] italic text-ink-3">"{meal.note}"</p>
                            ) : null}
                            <div className="mt-3 flex justify-end">
                              <ConfirmButton
                                label="Delete meal"
                                onConfirm={async () => {
                                  await remove(meal.id)
                                  toast('Meal deleted', 'neutral')
                                }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </Card>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <MealEditor
        open={editorOpen}
        editing={editing}
        defaultDate={defaultDate}
        onClose={() => {
          setEditorOpen(false)
          setEditing(null)
        }}
      />
    </>
  )
}
