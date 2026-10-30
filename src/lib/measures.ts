import type { CustomFood, LibraryFood, MealItem } from './types'

/**
 * How a portion can be measured.
 *
 * Grams are the only thing stored. Every other unit is a conversion factor,
 * so a meal logged in cups today still reports correct calories if the unit
 * system changes tomorrow, and so totals never depend on which unit was used.
 *
 * `grams` is the weight of ONE of this unit.
 */
export interface Measure {
  id: string
  /** Long form, for the select. */
  label: string
  /** Short form, for chips and lists. */
  short: string
  grams: number
  /** Shown under the field so the conversion is never a mystery. */
  note?: string
}

export const GRAM_MEASURE: Measure = { id: 'g', label: 'Grams', short: 'g', grams: 1 }
export const ML_MEASURE: Measure = { id: 'ml', label: 'Millilitres', short: 'ml', grams: 1 }

/**
 * Grams in one 240 ml cup, by food category. A cup of soup and a cup of
 * cornflakes weigh very different amounts, so a single global figure would be
 * wrong for most of the library. Individual foods can override this.
 */
const CUP_GRAMS_BY_CATEGORY: Record<string, number> = {
  'Swallows and staples': 200,
  'Rice and grains': 180,
  Soups: 240,
  'Stews and sauces': 240,
  'Beans and eggs': 180,
  'Plantain and tubers': 160,
  'Bread and breakfast': 120,
  'Pasta and noodles': 140,
  'Street food': 110,
  'Snacks and sweets': 120,
  'Fast food': 150,
  Meat: 140,
  Poultry: 140,
  'Fish and seafood': 140,
  Vegetables: 100,
  Fruit: 150,
  'Nuts and seeds': 140,
  Dairy: 240,
  'Oils and condiments': 218,
  'Soft drinks': 240,
  'Juices and dairy drinks': 240,
  'Local drinks': 240,
  'Hot drinks': 240,
  Alcohol: 240,
  'Malt drinks': 240,
  'Energy drinks': 240,
  'Your foods': 200,
}

/** Categories that are drinks, so millilitres make sense and cups are natural. */
const LIQUID_CATEGORIES = new Set([
  'Soft drinks',
  'Juices and dairy drinks',
  'Local drinks',
  'Hot drinks',
  'Alcohol',
  'Malt drinks',
  'Energy drinks',
])

export function isLiquidCategory(category: string | undefined): boolean {
  return !!category && LIQUID_CATEGORIES.has(category)
}

export function cupGramsFor(food: Pick<LibraryFood, 'category' | 'cupGrams'>): number {
  return food.cupGrams ?? CUP_GRAMS_BY_CATEGORY[food.category] ?? 200
}

/** A tablespoon is a sixteenth of a cup, which holds for solids and liquids alike. */
export function tbspGramsFor(food: Pick<LibraryFood, 'category' | 'cupGrams' | 'spoonGrams'>): number {
  if (food.spoonGrams) return food.spoonGrams
  return Math.round((cupGramsFor(food) / 16) * 10) / 10
}

/**
 * Every unit this food can sensibly be measured in, in the order a person
 * would look for them: its own serving first, then household measures, then
 * the raw weight that always works.
 */
export function measuresFor(food?: Partial<LibraryFood> | null): Measure[] {
  const out: Measure[] = []
  const category = food?.category ?? 'Your foods'
  const liquid = food?.isLiquid ?? isLiquidCategory(category)

  if (food?.serving && food.serving > 0) {
    out.push({
      id: 'portion',
      label: food.servingLabel?.trim() || 'Portion',
      short: 'portion',
      grams: food.serving,
      note: `${food.servingLabel?.trim() || 'One portion'} is about ${round(food.serving)} g`,
    })
  }

  // Skip the piece when it is the same weight as the portion, otherwise a
  // seasoning cube offers "Portion" and "1 cube" as two identical choices.
  const pieceDuplicatesPortion =
    !!food?.pieceGrams && !!food?.serving && Math.abs(food.pieceGrams - food.serving) < 0.5

  if (food?.pieceGrams && food.pieceGrams > 0 && !pieceDuplicatesPortion) {
    out.push({
      id: 'piece',
      label: food.pieceLabel?.trim() || 'Piece',
      short: 'piece',
      grams: food.pieceGrams,
      note: `One ${(food.pieceLabel || 'piece').toLowerCase()} is about ${round(food.pieceGrams)} g`,
    })
  }

  if (food?.sliceGrams && food.sliceGrams > 0) {
    out.push({
      id: 'slice',
      label: 'Slice',
      short: 'slice',
      grams: food.sliceGrams,
      note: `One slice is about ${round(food.sliceGrams)} g`,
    })
  }

  const cup = cupGramsFor({ category, cupGrams: food?.cupGrams })
  out.push({
    id: 'cup',
    label: 'Cup',
    short: 'cup',
    grams: cup,
    note: `One cup is about ${round(cup)} g of this`,
  })

  const tbsp = tbspGramsFor({ category, cupGrams: food?.cupGrams, spoonGrams: food?.spoonGrams })
  out.push({
    id: 'tbsp',
    label: 'Tablespoon',
    short: 'tbsp',
    grams: tbsp,
    note: `One tablespoon is about ${round(tbsp)} g of this`,
  })
  out.push({
    id: 'tsp',
    label: 'Teaspoon',
    short: 'tsp',
    grams: Math.round((tbsp / 3) * 10) / 10,
    note: `One teaspoon is about ${round(tbsp / 3)} g of this`,
  })

  if (liquid) out.push({ ...ML_MEASURE, note: 'Millilitres, counted as 1 g each' })

  out.push({ ...GRAM_MEASURE, note: 'Weighed on a scale' })

  // A custom unit the person typed on the row keeps its place in the list.
  return out
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}

export function findMeasure(measures: Measure[], id: string | undefined): Measure | undefined {
  return measures.find((m) => m.id === id)
}

/* ------------------------------------------------------------------ *
 * Reading rows written by older builds
 * ------------------------------------------------------------------ */

/**
 * Earlier versions stored only grams, or a grams/portion pair. This maps any
 * of those shapes onto the current one so old meals still display and edit
 * correctly, rather than silently losing their portion.
 */
export function normalizeItem(item: MealItem): MealItem {
  if (item.qty != null && item.unit) return item

  // The grams/portion pair, from the build that introduced portions.
  if (item.unit === 'portion' && item.portions != null) {
    return {
      ...item,
      qty: item.portions,
      unitGrams: item.portionGrams ?? null,
      unitLabel: item.portionLabel ?? 'Portion',
    }
  }

  return {
    ...item,
    unit: 'g',
    qty: item.grams ?? null,
    unitGrams: 1,
    unitLabel: 'Grams',
  }
}

/** How a component's size reads in a list or a report. */
export function describeSize(raw: MealItem): string {
  const item = normalizeItem(raw)
  const grams = item.grams

  if (item.unit === 'g' || !item.unit) return grams != null ? `${round(grams)} g` : ''
  if (item.qty == null) return grams != null ? `${round(grams)} g` : ''

  const qty = round(item.qty)
  const label = (item.unitLabel || item.unit).toLowerCase()

  // "1 plate" reads better than "1 x plate", but "2 cup" does not.
  const noun = label.startsWith('1 ') ? label.slice(2) : label
  const plural = qty === 1 || noun.endsWith('s') ? noun : `${noun}s`
  const size = `${qty} ${plural}`

  return grams != null ? `${size} (${round(grams)} g)` : size
}

/** Just the unit part, for compact table columns. */
export function unitShort(raw: MealItem): string {
  const item = normalizeItem(raw)
  if (!item.unit || item.unit === 'g') return 'g'
  return item.unitLabel || item.unit
}

export function fromCustomFood(f: CustomFood): LibraryFood {
  return {
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
  }
}
