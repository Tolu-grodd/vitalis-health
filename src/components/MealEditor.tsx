import { useEffect, useMemo, useState } from 'react'
import { BookmarkPlus, ChevronDown, Copy, Plus, Sparkles, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  Field,
  IconButton,
  Input,
  Modal,
  NumberInput,
  Segmented,
  Select,
  cn,
  useToast,
} from './ui'
import { FoodPicker, type RememberedSize } from './FoodPicker'
import { dateKey, timeKey } from '@/lib/dates'
import { defaultMealName, kcalFromMacros, round1, scaleFood, scaleFromPer100, sumItems } from '@/lib/health'
import { FOOD_CATEGORIES } from '@/lib/foodLibrary'
import { GRAM_MEASURE, measuresFor } from '@/lib/measures'
import { useCustomFoods, useFoodUsage, useMealTemplates, useMutations, useRecordFoodUse } from '@/hooks/useData'
import type { LibraryFood, Meal, MealItem, MealSlot } from '@/lib/types'

const SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other']

let keyCounter = 0
function newKey() {
  return `i${Date.now()}_${keyCounter++}`
}

function blankItem(): MealItem {
  return {
    key: newKey(),
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

/**
 * Best guess at the food behind a row, so the unit list can be built even for
 * rows restored from a saved meal, where the original library entry is gone.
 */
function foodShapeOf(item: MealItem, ref?: LibraryFood): Partial<LibraryFood> {
  if (ref) return ref
  return {
    name: item.name,
    category: 'Your foods',
    kcal: item.per100?.kcal ?? 0,
    protein: item.per100?.protein ?? 0,
    carbs: item.per100?.carbs ?? 0,
    fat: item.per100?.fat ?? 0,
    serving: item.unit === 'portion' ? (item.unitGrams ?? undefined) : undefined,
    servingLabel: item.unit === 'portion' ? (item.unitLabel ?? undefined) : undefined,
  }
}

/** Suggest a slot from the clock so the common case needs no thought. */
function slotForNow(time: string): MealSlot {
  const h = Number(time.split(':')[0])
  if (h < 11) return 'Breakfast'
  if (h < 16) return 'Lunch'
  if (h < 22) return 'Dinner'
  return 'Snack'
}

export function MealEditor({
  open,
  onClose,
  editing,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  editing?: Meal | null
  defaultDate?: string
}) {
  const toast = useToast()
  const { create, update } = useMutations('meals')
  const { foods, saveFood } = useCustomFoods()
  const { templates, saveTemplate } = useMealTemplates()
  const usage = useFoodUsage()
  const recordFoodUse = useRecordFoodUse()

  const [date, setDate] = useState(defaultDate ?? dateKey())
  const [time, setTime] = useState(timeKey())
  const [slot, setSlot] = useState<MealSlot>(slotForNow(timeKey()))
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<MealItem[]>([blankItem()])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  /** The library entry each row came from, so its unit list survives editing. */
  const [foodRefs, setFoodRefs] = useState<Record<string, LibraryFood>>({})

  // Reset the form each time the modal opens, seeded from the meal being edited.
  useEffect(() => {
    if (!open) return
    if (editing) {
      setDate(editing.date)
      setTime(editing.time)
      setSlot(editing.slot ?? 'Other')
      setName(editing.name ?? '')
      setNote(editing.note ?? '')
      setItems(editing.items?.length ? editing.items.map((i) => ({ ...i, key: i.key || newKey() })) : [blankItem()])
    } else {
      const t = timeKey()
      setDate(defaultDate ?? dateKey())
      setTime(t)
      setSlot(slotForNow(t))
      setName('')
      setNote('')
      setItems([blankItem()])
    }
    setExpanded({})
    setShowTemplates(false)
  }, [open, editing, defaultDate])

  const totals = useMemo(() => sumItems(items), [items])
  const filled = items.filter((i) => i.name.trim() || i.kcal > 0)

  function patch(key: string, changes: Partial<MealItem>) {
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...changes } : i)))
  }

  /**
   * Picking a food starts it in the unit that food is normally eaten in, and
   * at the amount you used last time if you have logged it before. That is the
   * single biggest saving in repeat logging.
   */
  function pickFood(key: string, food: LibraryFood, remembered?: RememberedSize) {
    setFoodRefs((r) => ({ ...r, [key]: food }))
    const measures = measuresFor(food)
    const chosen =
      (remembered ? measures.find((m) => m.id === remembered.unit) : undefined) ?? measures[0] ?? GRAM_MEASURE
    const qty = remembered && remembered.unit === chosen.id ? remembered.qty : 1
    const grams = round1(qty * chosen.grams)

    patch(key, {
      ...scaleFood(food, grams),
      per100: { kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat },
      unit: chosen.id,
      qty,
      unitGrams: chosen.grams,
      unitLabel: chosen.label,
    })
  }

  /** Grams stay canonical. Whatever the unit, this recomputes them and then
   *  rescales the nutrition, but only while the row still has a per-100 g
   *  basis. Once you type a calorie figure yourself, your figure stands. */
  function applySize(item: MealItem, changes: Partial<MealItem>) {
    const next = { ...item, ...changes }
    const per = next.unitGrams ?? 1
    const grams = next.qty != null ? round1(next.qty * per) : null
    const scaled = item.per100 && grams != null ? scaleFromPer100(item.per100, grams) : null
    patch(item.key, { ...changes, grams, ...(scaled ?? {}) })
  }

  /** Switch a row's unit, carrying the size across rather than resetting it. */
  function setUnit(item: MealItem, measureId: string) {
    const measures = measuresFor(foodShapeOf(item, foodRefs[item.key]))
    const measure = measures.find((m) => m.id === measureId) ?? GRAM_MEASURE
    const grams = item.grams ?? null
    const qty = grams != null && measure.grams > 0 ? round1(grams / measure.grams) : (item.qty ?? 1)
    applySize(item, { unit: measure.id, unitGrams: measure.grams, unitLabel: measure.label, qty })
  }

  function addRow() {
    const item = blankItem()
    setItems((l) => [...l, item])
  }

  function removeRow(key: string) {
    setItems((l) => (l.length === 1 ? [blankItem()] : l.filter((i) => i.key !== key)))
  }

  function duplicateRow(item: MealItem) {
    setItems((l) => {
      const idx = l.findIndex((i) => i.key === item.key)
      const copy = { ...item, key: newKey() }
      return [...l.slice(0, idx + 1), copy, ...l.slice(idx + 1)]
    })
  }

  async function saveItemAsFood(item: MealItem) {
    const basis =
      item.per100 ??
      (item.grams && item.grams > 0
        ? {
            kcal: Math.round((item.kcal / item.grams) * 100),
            protein: round1((item.protein / item.grams) * 100),
            carbs: round1((item.carbs / item.grams) * 100),
            fat: round1((item.fat / item.grams) * 100),
          }
        : null)
    if (!basis || !item.name.trim()) {
      toast('Add a name and a weight first so it can be saved per 100 g.', 'critical')
      return
    }
    await saveFood({
      name: item.name.trim(),
      per100g: true,
      ...basis,
      category: 'Your foods',
      // Keep the portion you actually used, so re-picking it later behaves.
      serving: item.unit !== 'g' && item.unitGrams ? item.unitGrams : (item.grams ?? null),
      servingLabel: item.unit !== 'g' ? (item.unitLabel ?? null) : null,
    })
    toast(`${item.name.trim()} saved to your foods`)
  }

  async function handleSave(alsoTemplate: boolean) {
    if (!filled.length) {
      toast('Add at least one component.', 'critical')
      return
    }
    setSaving(true)
    try {
      const clean: MealItem[] = filled.map((i) => ({
        key: i.key,
        name: i.name.trim() || 'Untitled item',
        grams: i.grams ?? null,
        kcal: Math.round(i.kcal) || 0,
        protein: round1(i.protein) || 0,
        carbs: round1(i.carbs) || 0,
        fat: round1(i.fat) || 0,
        per100: i.per100 ?? null,
        unit: i.unit ?? 'g',
        qty: i.qty ?? null,
        unitGrams: i.unitGrams ?? null,
        unitLabel: i.unitLabel ?? null,
      }))
      const t = sumItems(clean)
      const payload = {
        date,
        time,
        at: new Date(`${date}T${time || '00:00'}`),
        slot,
        // Naming a meal after its components beats labelling every evening
        // "Dinner", which tells you nothing when you scan the list later.
        name: name.trim() || defaultMealName(clean) || slot,
        note: note.trim(),
        items: clean,
        kcal: Math.round(t.kcal),
        protein: round1(t.protein),
        carbs: round1(t.carbs),
        fat: round1(t.fat),
        grams: round1(t.grams),
      }
      if (editing) await update(editing.id, payload)
      else await create(payload)

      if (alsoTemplate) {
        await saveTemplate({ name: payload.name, items: clean })
      }

      // Feeds the picker's ranking and its memory of how much you had.
      // Never allowed to fail the save: the meal is what matters.
      recordFoodUse(clean).catch(() => {})
      toast(editing ? 'Meal updated' : 'Meal logged')
      onClose()
    } catch (e) {
      toast((e as Error).message, 'critical')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <Modal
      open={open && !createOpen}
      onClose={onClose}
      wide
      title={editing ? 'Edit meal' : 'Log a meal'}
      subtitle="Add every component with its own weight and calories. Totals are worked out for you."
      footer={
        <>
          <div className="mr-auto hidden items-center gap-3 sm:flex">
            <span className="tnum text-[13px] text-ink-3">
              <span className="text-[17px] font-semibold text-ink">{Math.round(totals.kcal).toLocaleString()}</span> kcal
            </span>
            <span className="tnum text-[12px] text-ink-3">
              P {round1(totals.protein)} · C {round1(totals.carbs)} · F {round1(totals.fat)} g
            </span>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {!editing ? (
            <Button variant="secondary" onClick={() => handleSave(true)} disabled={saving}>
              <BookmarkPlus size={15} />
              Save + reuse
            </Button>
          ) : null}
          <Button variant="primary" onClick={() => handleSave(false)} loading={saving} disabled={saving}>
            {editing ? 'Save changes' : 'Log meal'}
          </Button>
        </>
      }
    >
      {/* When & what */}
      <div className="grid gap-3 sm:grid-cols-[1fr_140px_120px]">
        <Field label="Meal name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={slot} />
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Time eaten">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Segmented value={slot} onChange={setSlot} options={SLOTS.map((s) => ({ value: s, label: s }))} />
        {templates.length ? (
          <Button size="sm" variant="ghost" onClick={() => setShowTemplates((s) => !s)}>
            <Sparkles size={14} />
            Reuse a saved meal
            <ChevronDown size={13} className={cn('transition-transform', showTemplates && 'rotate-180')} />
          </Button>
        ) : null}
      </div>

      {showTemplates ? (
        <div className="mt-3 rounded-xl border border-line bg-surface-2 p-2">
          <ul className="space-y-1">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => {
                    setItems(t.items.map((i) => ({ ...i, key: newKey() })))
                    if (!name) setName(t.name)
                    setShowTemplates(false)
                    toast(`Loaded "${t.name}"`)
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface"
                >
                  <span className="truncate text-[13px] font-medium text-ink">{t.name}</span>
                  <Badge className="tnum">
                    {t.items.reduce((a, b) => a + (b.kcal || 0), 0)} kcal · {t.items.length} items
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Components */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">
            Components ({filled.length})
          </h4>
          <span className="text-[12px] text-ink-3">Pick from the library, or just type your own numbers</span>
        </div>

        <ul className="space-y-2">
          {items.map((item) => {
            const isOpen = expanded[item.key]
            const macroKcal = kcalFromMacros(item.protein, item.carbs, item.fat)
            const mismatch = item.kcal > 0 && macroKcal > 0 && Math.abs(macroKcal - item.kcal) / item.kcal > 0.25
            const rowMeasures = measuresFor(foodShapeOf(item, foodRefs[item.key]))
            const activeMeasure = rowMeasures.find((m) => m.id === item.unit)
            return (
              <li key={item.key} className="rounded-2xl border border-line bg-surface-2/50 p-2.5">
                {/* Phones get the name on its own line and the numbers on the
                    next, each flexible. Fixed pixel widths side by side used to
                    push the modal wider than the screen. */}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:items-start">
                  <FoodPicker
                    className="w-full sm:min-w-[180px] sm:flex-1"
                    value={item.name}
                    customFoods={foods}
                    usage={usage}
                    onChange={(v) => patch(item.key, { name: v })}
                    onPick={(f, remembered) => pickFood(item.key, f, remembered)}
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
                        onChange={(e) =>
                          applySize(item, { qty: e.target.value === '' ? null : Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1 sm:w-[118px] sm:flex-none">
                      <Select
                        value={item.unit ?? 'g'}
                        aria-label="Unit"
                        className="px-2 pr-6"
                        onChange={(e) => setUnit(item, e.target.value)}
                      >
                        {rowMeasures.map((m) => (
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
                    <div className="flex shrink-0 items-center">
                      <IconButton
                        label={isOpen ? 'Hide macros' : 'Show macros'}
                        className="h-8 w-7 sm:w-8"
                        onClick={() => setExpanded((e) => ({ ...e, [item.key]: !isOpen }))}
                      >
                        <ChevronDown size={16} className={cn('transition-transform', isOpen && 'rotate-180')} />
                      </IconButton>
                      <IconButton
                        label="Duplicate component"
                        className="h-8 w-7 sm:w-8"
                        onClick={() => duplicateRow(item)}
                      >
                        <Copy size={15} />
                      </IconButton>
                      <IconButton
                        label="Remove component"
                        className="h-8 w-7 hover:text-critical sm:w-8"
                        onClick={() => removeRow(item.key)}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  </div>
                </div>

                <p className="mt-1.5 flex flex-wrap gap-x-2 pl-1 text-[11.5px] text-ink-3">
                  {activeMeasure && activeMeasure.id !== 'g' && item.grams != null ? (
                    <span className="font-medium text-ink-2">{activeMeasure.note ?? ''} · that is {round1(item.grams)} g</span>
                  ) : null}
                  {item.per100 ? (
                    <span>
                      {item.per100.kcal} kcal per 100 g. Calories follow the size until you type your own.
                    </span>
                  ) : null}
                </p>

                {isOpen ? (
                  <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-line pt-2.5">
                    {item.unit !== 'g' && item.unit !== 'ml' ? (
                      <>
                        <Field label={`Grams in one ${(item.unitLabel || 'unit').toLowerCase()}`} className="col-span-2 sm:col-span-1">
                          <NumberInput
                            value={item.unitGrams ?? ''}
                            min={1}
                            onChange={(e) =>
                              applySize(item, { unitGrams: e.target.value === '' ? null : Number(e.target.value) })
                            }
                          />
                        </Field>
                        <Field label="Call this unit" className="col-span-3 sm:col-span-2">
                          <Input
                            value={item.unitLabel ?? ''}
                            placeholder="1 wrap, 1 plate, 1 spoon"
                            onChange={(e) => patch(item.key, { unitLabel: e.target.value })}
                          />
                        </Field>
                      </>
                    ) : null}
                    <Field label="Protein (g)">
                      <NumberInput
                        value={item.protein || ''}
                        min={0}
                        step="0.1"
                        onChange={(e) => patch(item.key, { protein: Number(e.target.value) || 0, per100: null })}
                      />
                    </Field>
                    <Field label="Carbs (g)">
                      <NumberInput
                        value={item.carbs || ''}
                        min={0}
                        step="0.1"
                        onChange={(e) => patch(item.key, { carbs: Number(e.target.value) || 0, per100: null })}
                      />
                    </Field>
                    <Field label="Fat (g)">
                      <NumberInput
                        value={item.fat || ''}
                        min={0}
                        step="0.1"
                        onChange={(e) => patch(item.key, { fat: Number(e.target.value) || 0, per100: null })}
                      />
                    </Field>
                    <div className="col-span-3 flex flex-wrap items-center justify-between gap-2">
                      {mismatch ? (
                        <span className="text-[11.5px] text-serious">
                          Those macros work out to about {macroKcal} kcal, worth a second look.
                        </span>
                      ) : (
                        <span className="text-[11.5px] text-ink-3">Macros are optional. Calories alone is fine.</span>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => saveItemAsFood(item)}>
                        <BookmarkPlus size={14} />
                        Save to my foods
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>

        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" onClick={addRow}>
            <Plus size={16} />
            Add component
          </Button>
          <Button variant="ghost" onClick={() => setCreateOpen(true)}>
            <Sparkles size={16} />
            Create a new food
          </Button>
        </div>
      </div>

      <Field label="Note (optional)" className="mt-4">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="How you felt, where you ate..." />
      </Field>

      {/* Running total, since the mobile footer can't fit it */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-3 sm:hidden">
        <span className="text-[13px] font-medium text-ink-2">Meal total</span>
        <span className="tnum text-[17px] font-semibold text-ink">
          {Math.round(totals.kcal).toLocaleString()} kcal
        </span>
      </div>
    </Modal>

    <CreateFoodModal
      open={createOpen}
      onClose={() => setCreateOpen(false)}
      onCreated={(food) => {
        setItems((l) => {
          const rows = l.filter((i) => i.name.trim() || i.kcal > 0)
          const item = { ...blankItem(), key: newKey() }
          const grams = food.serving ?? 100
          return [
            ...rows,
            {
              ...item,
              ...scaleFood(food, grams),
              per100: { kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat },
              unit: food.serving ? ('portion' as const) : ('g' as const),
              portions: food.serving ? 1 : null,
              portionGrams: food.serving ?? null,
              portionLabel: food.servingLabel ?? (food.serving ? '1 portion' : null),
            },
          ]
        })
        setCreateOpen(false)
      }}
    />
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Create a food
 * ------------------------------------------------------------------ */

/**
 * Captures a food properly: its nutrition basis, and what one portion of it
 * weighs. Saved to your own foods, so it turns up in search from then on, and
 * dropped straight into the meal being logged.
 *
 * The numbers can be entered per 100 g or per portion, because a label gives
 * you one and a plate of food gives you the other.
 */
function CreateFoodModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (food: LibraryFood) => void
}) {
  const { saveFood } = useCustomFoods()
  const toast = useToast()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('Your foods')
  const [basis, setBasis] = useState<'per100' | 'perPortion'>('per100')
  const [kcal, setKcal] = useState<number | ''>('')
  const [protein, setProtein] = useState<number | ''>('')
  const [carbs, setCarbs] = useState<number | ''>('')
  const [fat, setFat] = useState<number | ''>('')
  const [serving, setServing] = useState<number | ''>('')
  const [servingLabel, setServingLabel] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setCategory('Your foods')
    setBasis('per100')
    setKcal('')
    setProtein('')
    setCarbs('')
    setFat('')
    setServing('')
    setServingLabel('')
  }, [open])

  const num = (v: number | '') => (typeof v === 'number' ? v : 0)
  const portionGrams = typeof serving === 'number' && serving > 0 ? serving : null

  // Everything is stored per 100 g, so per-portion entries are converted back.
  const per100 =
    basis === 'per100' || !portionGrams
      ? { kcal: num(kcal), protein: num(protein), carbs: num(carbs), fat: num(fat) }
      : {
          kcal: Math.round((num(kcal) / portionGrams) * 100),
          protein: round1((num(protein) / portionGrams) * 100),
          carbs: round1((num(carbs) / portionGrams) * 100),
          fat: round1((num(fat) / portionGrams) * 100),
        }

  const canSave = name.trim().length > 0 && num(kcal) > 0 && (basis === 'per100' || portionGrams != null)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a new food"
      subtitle="Saved to your foods and added to this meal"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={!canSave || saving}
            onClick={async () => {
              setSaving(true)
              try {
                await saveFood({
                  name: name.trim(),
                  per100g: true,
                  ...per100,
                  category: category.trim() || 'Your foods',
                  serving: portionGrams,
                  servingLabel: servingLabel.trim() || null,
                })
                onCreated({
                  name: name.trim(),
                  ...per100,
                  category: category.trim() || 'Your foods',
                  serving: portionGrams ?? undefined,
                  servingLabel: servingLabel.trim() || undefined,
                })
                toast(`${name.trim()} saved to your foods`)
              } catch (e) {
                toast((e as Error).message, 'critical')
              } finally {
                setSaving(false)
              }
            }}
          >
            Save and add
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <Field label="Food name">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Mum's jollof rice" />
        </Field>
        <Field label="Category">
          <Input
            list="vitalis-food-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Your foods"
          />
          <datalist id="vitalis-food-categories">
            {FOOD_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="One portion weighs" hint="grams, optional but recommended">
          <NumberInput
            value={serving}
            min={1}
            placeholder="250"
            onChange={(e) => setServing(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Field>
        <Field label="A portion is" hint="what you would call it">
          <Input value={servingLabel} onChange={(e) => setServingLabel(e.target.value)} placeholder="1 plate" />
        </Field>
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">The numbers below are</span>
        <Segmented
          value={basis}
          onChange={setBasis}
          options={[
            { value: 'per100', label: 'Per 100 g' },
            { value: 'perPortion', label: 'Per portion' },
          ]}
        />
        {basis === 'perPortion' && !portionGrams ? (
          <p className="mt-1.5 text-[12px] text-serious">
            Set what one portion weighs first, otherwise there is nothing to convert from.
          </p>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Calories" hint="kcal">
          <NumberInput value={kcal} min={0} onChange={(e) => setKcal(e.target.value === '' ? '' : Number(e.target.value))} />
        </Field>
        <Field label="Protein" hint="g">
          <NumberInput
            value={protein}
            min={0}
            step="0.1"
            onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Field>
        <Field label="Carbs" hint="g">
          <NumberInput
            value={carbs}
            min={0}
            step="0.1"
            onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Field>
        <Field label="Fat" hint="g">
          <NumberInput
            value={fat}
            min={0}
            step="0.1"
            onChange={(e) => setFat(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Field>
      </div>

      {basis === 'perPortion' && portionGrams ? (
        <p className="mt-3 rounded-xl bg-surface-2 px-4 py-3 text-[12.5px] text-ink-2">
          Stored as <span className="tnum font-semibold text-ink">{per100.kcal} kcal per 100 g</span>, worked out from{' '}
          {num(kcal)} kcal in a {portionGrams} g portion.
        </p>
      ) : null}
    </Modal>
  )
}
