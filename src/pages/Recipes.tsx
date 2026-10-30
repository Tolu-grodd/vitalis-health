import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ChefHat, Copy, Plus, Trash2, Utensils } from 'lucide-react'
import { PageHeader } from '@/components/AppShell'
import { FoodPicker } from '@/components/FoodPicker'
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
  Select,
  Textarea,
  cn,
  useToast,
} from '@/components/ui'
import { useCustomFoods, useFlatCollection, useFoodUsage, useMutations, useSettings } from '@/hooks/useData'
import { GRAM_MEASURE, measuresFor } from '@/lib/measures'
import { dateKey, timeKey } from '@/lib/dates'
import { round1, scaleFood, scaleFromPer100, sumItems } from '@/lib/health'
import { dayOrder } from '@/lib/prefs'
import { colorVar } from '@/lib/schedule'
import { DAY_NAMES, DAY_SHORT, type DayIndex, type LibraryFood, type MealItem, type MealSlot, type PlanEntry, type Recipe } from '@/lib/types'

const SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const SLOT_COLOR: Record<MealSlot, number> = { Breakfast: 3, Lunch: 0, Dinner: 2, Snack: 4, Other: 1 }

let counter = 0
function itemKey() {
  return `r${Date.now().toString(36)}${counter++}`
}

function blankItem(): MealItem {
  return {
    key: itemKey(),
    name: '',
    grams: null,
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    per100: null,
    unit: 'g',
    qty: null,
    unitGrams: 1,
    unitLabel: 'Grams',
  }
}

/** Mirrors the meal editor: rebuild enough of a food to derive its units. */
function recipeFoodShape(item: MealItem, ref?: LibraryFood): Partial<LibraryFood> {
  if (ref) return ref
  return {
    name: item.name,
    category: 'Your foods',
    kcal: item.per100?.kcal ?? 0,
    serving: item.unit !== 'g' ? (item.unitGrams ?? undefined) : undefined,
    servingLabel: item.unit !== 'g' ? (item.unitLabel ?? undefined) : undefined,
  }
}

export function Recipes() {
  const { items: recipes, loading } = useFlatCollection<Recipe>('recipes', 'name')
  const { items: plan } = useFlatCollection<PlanEntry>('mealplan')
  const { settings } = useSettings()
  const recipeM = useMutations('recipes')
  const planM = useMutations('mealplan')
  const mealM = useMutations('meals')
  const toast = useToast()

  const [tab, setTab] = useState<'recipes' | 'plan'>('recipes')
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [logging, setLogging] = useState<Recipe | null>(null)
  const [planCell, setPlanCell] = useState<{ day: DayIndex; slot: MealSlot; entry?: PlanEntry } | null>(null)

  const planByDay = useMemo(() => {
    const map = new Map<string, PlanEntry>()
    for (const p of plan) map.set(`${p.day}-${p.slot}`, p)
    return map
  }, [plan])

  const dayTotals = useMemo(
    () =>
      ([0, 1, 2, 3, 4, 5, 6] as DayIndex[]).map((d) =>
        SLOTS.reduce((a, s) => a + (planByDay.get(`${d}-${s}`)?.kcal ?? 0), 0),
      ),
    [planByDay],
  )

  async function logRecipeAsMeal(recipe: Recipe, servings: number, slot: MealSlot) {
    const factor = servings / Math.max(recipe.servings, 1)
    const items: MealItem[] = recipe.items.map((i) => ({
      ...i,
      key: itemKey(),
      grams: i.grams != null ? round1(i.grams * factor) : null,
      qty: i.qty != null ? round1(i.qty * factor) : null,
      kcal: Math.round(i.kcal * factor),
      protein: round1(i.protein * factor),
      carbs: round1(i.carbs * factor),
      fat: round1(i.fat * factor),
    }))
    const t = sumItems(items)
    const date = dateKey()
    const time = timeKey()
    await mealM.create({
      date,
      time,
      at: new Date(`${date}T${time}`),
      slot,
      name: recipe.name,
      note: `From recipe, ${servings} serving${servings === 1 ? '' : 's'}`,
      items,
      kcal: Math.round(t.kcal),
      protein: round1(t.protein),
      carbs: round1(t.carbs),
      fat: round1(t.fat),
      grams: round1(t.grams),
    })
    toast(`${recipe.name} logged as ${slot.toLowerCase()}`)
  }

  return (
    <>
      <PageHeader
        title="Recipes and meal plan"
        subtitle="Build a meal once, then log it in a tap or drop it into your week"
        action={
          <Button
            variant="primary"
            onClick={() =>
              setEditing({
                id: '',
                name: '',
                servings: 2,
                items: [blankItem()],
                note: '',
                kcal: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                grams: 0,
              })
            }
          >
            <Plus size={16} />
            New recipe
          </Button>
        }
      />

      <div className="mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'recipes', label: `Recipes (${recipes.length})` },
            { value: 'plan', label: 'Weekly plan' },
          ]}
        />
      </div>

      {tab === 'recipes' ? (
        loading && !recipes.length ? (
          <Card>
            <EmptyState title="Loading recipes" />
          </Card>
        ) : !recipes.length ? (
          <Card>
            <EmptyState
              icon={<ChefHat size={20} />}
              title="No recipes yet"
              body="A recipe is just a meal you saved with its servings. Build it once and the per-serving calories are worked out for you."
              action={
                <Button
                  variant="primary"
                  onClick={() =>
                    setEditing({
                      id: '',
                      name: '',
                      servings: 2,
                      items: [blankItem()],
                      note: '',
                      kcal: 0,
                      protein: 0,
                      carbs: 0,
                      fat: 0,
                      grams: 0,
                    })
                  }
                >
                  <Plus size={16} />
                  Create your first recipe
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recipes.map((r) => {
              const perServing = Math.round(r.kcal / Math.max(r.servings, 1))
              return (
                <Card key={r.id} className="flex flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-ink">{r.name}</p>
                      <p className="mt-0.5 text-[12px] text-ink-3">
                        {r.servings} serving{r.servings === 1 ? '' : 's'} · {r.items.length} components
                      </p>
                    </div>
                    <span className="shrink-0 text-right">
                      <span className="tnum block text-[20px] font-semibold leading-none tracking-[-0.02em] text-ink">
                        {perServing.toLocaleString()}
                      </span>
                      <span className="text-[10.5px] text-ink-3">kcal / serving</span>
                    </span>
                  </div>

                  <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-3">
                    {r.items.map((i) => i.name).join(', ')}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Badge className="tnum">P {round1(r.protein / Math.max(r.servings, 1))}</Badge>
                    <Badge className="tnum">C {round1(r.carbs / Math.max(r.servings, 1))}</Badge>
                    <Badge className="tnum">F {round1(r.fat / Math.max(r.servings, 1))}</Badge>
                    <Badge className="tnum">{Math.round(r.kcal).toLocaleString()} kcal total</Badge>
                  </div>

                  <div className="mt-auto flex items-center gap-1.5 pt-3.5">
                    <Button size="sm" variant="primary" className="flex-1" onClick={() => setLogging(r)}>
                      <Utensils size={14} />
                      Log it
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>
                      Edit
                    </Button>
                    <IconButton
                      label="Duplicate recipe"
                      onClick={() => setEditing({ ...r, id: '', name: `${r.name} copy` })}
                    >
                      <Copy size={15} />
                    </IconButton>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      ) : (
        <Card className="overflow-hidden">
          <CardHeader
            title="Your repeating week"
            subtitle={`Planned average ${Math.round(dayTotals.reduce((a, b) => a + b, 0) / 7).toLocaleString()} kcal a day against a ${settings.calorieGoal.toLocaleString()} kcal target`}
          />
          <div className="overflow-x-auto px-5 pb-5">
            <div className="min-w-[720px]">
              <div className="grid gap-2" style={{ gridTemplateColumns: '92px repeat(7, minmax(0, 1fr))' }}>
                <div />
                {dayOrder().map((d) => (
                  <div key={d} className="pb-1 text-center">
                    <p className="text-[12px] font-semibold text-ink-2">{DAY_SHORT[d]}</p>
                    <p
                      className={cn(
                        'tnum text-[11px]',
                        dayTotals[d] > settings.calorieGoal ? 'text-serious' : 'text-ink-3',
                      )}
                    >
                      {dayTotals[d] ? `${dayTotals[d].toLocaleString()} kcal` : 'unplanned'}
                    </p>
                  </div>
                ))}

                {SLOTS.map((slot) => (
                  <div key={slot} className="contents">
                    <div className="flex items-center justify-end pr-2 text-[12px] font-medium text-ink-3">{slot}</div>
                    {dayOrder().map((day) => {
                      const entry = planByDay.get(`${day}-${slot}`)
                      return (
                        <button
                          key={`${day}-${slot}`}
                          onClick={() => setPlanCell({ day, slot, entry })}
                          className={cn(
                            'min-h-[58px] rounded-xl border p-2 text-left transition-colors',
                            entry ? 'border-transparent text-white' : 'border-dashed border-line hover:bg-surface-2',
                          )}
                          style={entry ? { background: colorVar(SLOT_COLOR[slot]) } : undefined}
                        >
                          {entry ? (
                            <>
                              <span className="block truncate text-[11.5px] font-semibold leading-tight">
                                {entry.name}
                              </span>
                              <span className="tnum mt-0.5 block text-[10.5px] text-white/85">
                                {entry.kcal.toLocaleString()} kcal
                              </span>
                            </>
                          ) : (
                            <span className="flex h-full items-center justify-center text-[11px] text-ink-3">
                              <Plus size={13} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <RecipeEditor
        recipe={editing}
        onClose={() => setEditing(null)}
        onSave={async (r) => {
          const t = sumItems(r.items)
          const payload = {
            name: r.name.trim(),
            servings: Math.max(r.servings, 1),
            items: r.items,
            note: r.note ?? '',
            kcal: Math.round(t.kcal),
            protein: round1(t.protein),
            carbs: round1(t.carbs),
            fat: round1(t.fat),
            grams: round1(t.grams),
          }
          if (r.id) await recipeM.update(r.id, payload)
          else await recipeM.create(payload)
          toast(r.id ? 'Recipe updated' : 'Recipe saved')
          setEditing(null)
        }}
        onDelete={async (id) => {
          await recipeM.remove(id)
          toast('Recipe deleted', 'neutral')
          setEditing(null)
        }}
      />

      <LogRecipeModal recipe={logging} onClose={() => setLogging(null)} onLog={logRecipeAsMeal} />

      <PlanCellModal
        cell={planCell}
        recipes={recipes}
        onClose={() => setPlanCell(null)}
        onSave={async (day, slot, entry) => {
          const existing = planByDay.get(`${day}-${slot}`)
          if (existing) await planM.update(existing.id, entry)
          else await planM.create({ day, slot, ...entry })
          toast('Plan updated')
          setPlanCell(null)
        }}
        onClear={async (id) => {
          await planM.remove(id)
          toast('Cleared', 'neutral')
          setPlanCell(null)
        }}
        onLogNow={async (recipe, servings, slot) => {
          await logRecipeAsMeal(recipe, servings, slot)
          setPlanCell(null)
        }}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */

function RecipeEditor({
  recipe,
  onClose,
  onSave,
  onDelete,
}: {
  recipe: Recipe | null
  onClose: () => void
  onSave: (r: Recipe) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const { foods } = useCustomFoods()
  const usage = useFoodUsage()
  const [local, setLocal] = useState<Recipe | null>(recipe)
  const [saving, setSaving] = useState(false)
  const [foodRefs, setFoodRefs] = useState<Record<string, LibraryFood>>({})

  useEffect(() => setLocal(recipe), [recipe])
  if (!local) return null

  const totals = sumItems(local.items)
  const perServing = Math.round(totals.kcal / Math.max(local.servings, 1))

  function patch(key: string, changes: Partial<MealItem>) {
    setLocal((r) => (r ? { ...r, items: r.items.map((i) => (i.key === key ? { ...i, ...changes } : i)) } : r))
  }

  function pickFood(key: string, food: LibraryFood) {
    setFoodRefs((r) => ({ ...r, [key]: food }))
    const measure = measuresFor(food)[0] ?? GRAM_MEASURE
    const grams = round1(measure.grams)
    patch(key, {
      ...scaleFood(food, grams),
      per100: { kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat },
      unit: measure.id,
      qty: 1,
      unitGrams: measure.grams,
      unitLabel: measure.label,
    })
  }

  /** Same rule as the meal editor: grams stay canonical, units multiply up. */
  function applySize(item: MealItem, changes: Partial<MealItem>) {
    const next = { ...item, ...changes }
    const per = next.unitGrams ?? 1
    const grams = next.qty != null ? round1(next.qty * per) : null
    const scaled = item.per100 && grams != null ? scaleFromPer100(item.per100, grams) : null
    patch(item.key, { ...changes, grams, ...(scaled ?? {}) })
  }

  function setUnit(item: MealItem, measureId: string) {
    const measures = measuresFor(recipeFoodShape(item, foodRefs[item.key]))
    const measure = measures.find((m) => m.id === measureId) ?? GRAM_MEASURE
    const qty = item.grams != null && measure.grams > 0 ? round1(item.grams / measure.grams) : (item.qty ?? 1)
    applySize(item, { unit: measure.id, unitGrams: measure.grams, unitLabel: measure.label, qty })
  }

  return (
    <Modal
      open={!!recipe}
      onClose={onClose}
      wide
      title={local.id ? 'Edit recipe' : 'New recipe'}
      subtitle="Build it from components exactly like a meal, then say how many servings it makes"
      footer={
        <>
          {local.id ? (
            <div className="mr-auto">
              <ConfirmButton label="Delete recipe" onConfirm={() => onDelete(local.id)} />
            </div>
          ) : null}
          <div className="mr-auto hidden items-center gap-3 sm:flex">
            <span className="tnum text-[13px] text-ink-3">
              <span className="text-[17px] font-semibold text-ink">{perServing.toLocaleString()}</span> kcal per serving
            </span>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={saving || !local.name.trim()}
            onClick={async () => {
              setSaving(true)
              try {
                await onSave({ ...local, items: local.items.filter((i) => i.name.trim() || i.kcal > 0) })
              } finally {
                setSaving(false)
              }
            }}
          >
            Save recipe
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
        <Field label="Recipe name">
          <Input
            autoFocus
            value={local.name}
            onChange={(e) => setLocal((r) => (r ? { ...r, name: e.target.value } : r))}
            placeholder="Jollof rice and chicken"
          />
        </Field>
        <Field label="Servings" hint="how many it makes">
          <NumberInput
            value={local.servings}
            min={1}
            onChange={(e) => setLocal((r) => (r ? { ...r, servings: Number(e.target.value) || 1 } : r))}
          />
        </Field>
      </div>

      <div className="mt-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">Components</h4>
        <ul className="space-y-2">
          {local.items.map((item) => (
            <li
              key={item.key}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-surface-2/50 p-2.5 sm:flex-row sm:flex-nowrap sm:items-start"
            >
              <FoodPicker
                className="w-full sm:min-w-[180px] sm:flex-1"
                value={item.name}
                customFoods={foods}
                usage={usage}
                onChange={(v) => patch(item.key, { name: v })}
                onPick={(f) => pickFood(item.key, f)}
              />
              <div className="flex w-full items-center gap-1.5 sm:w-auto sm:gap-2">
                <div className="min-w-0 flex-1 sm:w-[72px] sm:flex-none">
                  <NumberInput
                    value={item.qty ?? ''}
                    min={0}
                    step={item.unit === 'g' || item.unit === 'ml' ? '1' : '0.25'}
                    placeholder={item.unit === 'g' ? 'g' : 'qty'}
                    aria-label="Amount"
                    className="px-2"
                    onChange={(e) => applySize(item, { qty: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                </div>
                <div className="min-w-0 flex-1 sm:w-[118px] sm:flex-none">
                  <Select
                    value={item.unit ?? 'g'}
                    aria-label="Unit"
                    className="px-2 pr-6"
                    onChange={(e) => setUnit(item, e.target.value)}
                  >
                    {measuresFor(recipeFoodShape(item, foodRefs[item.key])).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="min-w-0 flex-1 sm:w-[96px] sm:flex-none">
                  <NumberInput
                    value={item.kcal || ''}
                    min={0}
                    placeholder="kcal"
                    aria-label="Calories"
                    className="px-2"
                    onChange={(e) => patch(item.key, { kcal: Number(e.target.value) || 0, per100: null })}
                  />
                </div>
                <IconButton
                  label="Remove component"
                  className="h-8 w-7 shrink-0 hover:text-critical sm:w-8"
                  onClick={() =>
                    setLocal((r) =>
                      r
                        ? {
                            ...r,
                            items: r.items.length === 1 ? [blankItem()] : r.items.filter((i) => i.key !== item.key),
                          }
                        : r,
                    )
                  }
                >
                  <Trash2 size={15} />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          className="mt-2.5 w-full"
          onClick={() => setLocal((r) => (r ? { ...r, items: [...r.items, blankItem()] } : r))}
        >
          <Plus size={16} />
          Add component
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3 sm:grid-cols-4">
        <div>
          <p className="text-[11px] text-ink-3">Whole recipe</p>
          <p className="tnum text-[15px] font-semibold text-ink">{Math.round(totals.kcal).toLocaleString()} kcal</p>
        </div>
        <div>
          <p className="text-[11px] text-ink-3">Per serving</p>
          <p className="tnum text-[15px] font-semibold text-ink">{perServing.toLocaleString()} kcal</p>
        </div>
        <div>
          <p className="text-[11px] text-ink-3">Protein / serving</p>
          <p className="tnum text-[15px] font-semibold text-ink">
            {round1(totals.protein / Math.max(local.servings, 1))} g
          </p>
        </div>
        <div>
          <p className="text-[11px] text-ink-3">Weight</p>
          <p className="tnum text-[15px] font-semibold text-ink">{round1(totals.grams)} g</p>
        </div>
      </div>

      <Field label="Note (optional)" className="mt-4">
        <Textarea
          value={local.note ?? ''}
          onChange={(e) => setLocal((r) => (r ? { ...r, note: e.target.value } : r))}
          placeholder="Method, tweaks, where the recipe came from"
        />
      </Field>
    </Modal>
  )
}

function LogRecipeModal({
  recipe,
  onClose,
  onLog,
}: {
  recipe: Recipe | null
  onClose: () => void
  onLog: (r: Recipe, servings: number, slot: MealSlot) => Promise<void>
}) {
  const [servings, setServings] = useState(1)
  const [slot, setSlot] = useState<MealSlot>('Lunch')

  useEffect(() => {
    if (!recipe) return
    setServings(1)
    const h = new Date().getHours()
    setSlot(h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : h < 22 ? 'Dinner' : 'Snack')
  }, [recipe])

  if (!recipe) return null
  const perServing = Math.round(recipe.kcal / Math.max(recipe.servings, 1))

  return (
    <Modal
      open={!!recipe}
      onClose={onClose}
      title={`Log ${recipe.name}`}
      subtitle="It is recorded as a normal meal, with today's date and the time now"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              await onLog(recipe, servings, slot)
              onClose()
            }}
          >
            Log {Math.round(perServing * servings).toLocaleString()} kcal
          </Button>
        </>
      }
    >
      <Field label="Servings eaten">
        <NumberInput
          autoFocus
          step="0.5"
          min={0.5}
          value={servings}
          onChange={(e) => setServings(Number(e.target.value) || 1)}
        />
      </Field>
      <div className="mt-3">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Meal</span>
        <Segmented value={slot} onChange={setSlot} options={SLOTS.map((s) => ({ value: s, label: s }))} />
      </div>
      <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-[13px] text-ink-2">
        {perServing.toLocaleString()} kcal per serving, so {servings} serving{servings === 1 ? '' : 's'} comes to{' '}
        <span className="font-semibold text-ink">{Math.round(perServing * servings).toLocaleString()} kcal</span>.
      </p>
    </Modal>
  )
}

function PlanCellModal({
  cell,
  recipes,
  onClose,
  onSave,
  onClear,
  onLogNow,
}: {
  cell: { day: DayIndex; slot: MealSlot; entry?: PlanEntry } | null
  recipes: Recipe[]
  onClose: () => void
  onSave: (day: DayIndex, slot: MealSlot, entry: Omit<PlanEntry, 'id' | 'day' | 'slot'>) => Promise<void>
  onClear: (id: string) => Promise<void>
  onLogNow: (recipe: Recipe, servings: number, slot: MealSlot) => Promise<void>
}) {
  const [recipeId, setRecipeId] = useState('')
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState<number | ''>('')
  const [servings, setServings] = useState(1)

  useEffect(() => {
    if (!cell) return
    setRecipeId(cell.entry?.recipeId ?? '')
    setName(cell.entry?.name ?? '')
    setKcal(cell.entry?.kcal ?? '')
    setServings(cell.entry?.servings ?? 1)
  }, [cell])

  if (!cell) return null
  const chosen = recipes.find((r) => r.id === recipeId)

  function applyRecipe(id: string) {
    setRecipeId(id)
    const r = recipes.find((x) => x.id === id)
    if (!r) return
    setName(r.name)
    setKcal(Math.round((r.kcal / Math.max(r.servings, 1)) * servings))
  }

  return (
    <Modal
      open={!!cell}
      onClose={onClose}
      title={`${DAY_NAMES[cell.day]} ${cell.slot.toLowerCase()}`}
      subtitle="Pick a recipe, or just type what you plan to eat"
      footer={
        <>
          {cell.entry ? (
            <div className="mr-auto">
              <ConfirmButton label="Clear" onConfirm={() => onClear(cell.entry!.id)} />
            </div>
          ) : null}
          {chosen ? (
            <Button variant="secondary" onClick={() => onLogNow(chosen, servings, cell.slot)}>
              <Utensils size={15} />
              Log it today
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!name.trim()}
            onClick={() =>
              onSave(cell.day, cell.slot, {
                recipeId: recipeId || null,
                name: name.trim(),
                servings,
                kcal: typeof kcal === 'number' ? kcal : 0,
              })
            }
          >
            Save to plan
          </Button>
        </>
      }
    >
      {recipes.length ? (
        <Field label="From a recipe">
          <Select value={recipeId} onChange={(e) => applyRecipe(e.target.value)}>
            <option value="">Not a saved recipe</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({Math.round(r.kcal / Math.max(r.servings, 1))} kcal per serving)
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <p className="rounded-xl bg-surface-2 px-4 py-3 text-[13px] text-ink-2">
          <BookOpen size={14} className="mr-1.5 inline text-ink-3" />
          You have no recipes yet. You can still type a plan by hand below.
        </p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_100px_110px]">
        <Field label="What">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rice and stew" />
        </Field>
        <Field label="Servings">
          <NumberInput
            step="0.5"
            min={0.5}
            value={servings}
            onChange={(e) => {
              const v = Number(e.target.value) || 1
              setServings(v)
              if (chosen) setKcal(Math.round((chosen.kcal / Math.max(chosen.servings, 1)) * v))
            }}
          />
        </Field>
        <Field label="Calories">
          <NumberInput
            value={kcal}
            min={0}
            onChange={(e) => setKcal(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Field>
      </div>
    </Modal>
  )
}
