import { classifyBP, correlation, mean } from './health'
import { prettyDate, shortDate } from './dates'
import type { BPReading, Meal, MedEntry, Settings, SleepEntry, WaterEntry } from './types'

export interface Insight {
  id: string
  title: string
  body: string
  tone: 'good' | 'warning' | 'serious' | 'critical' | 'neutral' | 'brand'
  /** Optional headline figure shown large on the card. */
  figure?: string
  figureUnit?: string
}

export interface InsightInput {
  days: string[]
  meals: Meal[]
  bp: BPReading[]
  water: WaterEntry[]
  sleep: SleepEntry[]
  meds: MedEntry[]
  settings: Settings
  previous?: { meals: Meal[]; bp: BPReading[] }
}

function sumBy<T>(list: T[], f: (t: T) => number): number {
  return list.reduce((a, b) => a + (f(b) || 0), 0)
}

function groupSum<T extends { date: string }>(list: T[], days: string[], f: (t: T) => number) {
  const m = new Map<string, number>()
  for (const x of list) m.set(x.date, (m.get(x.date) ?? 0) + (f(x) || 0))
  return days.map((d) => ({ date: d, value: m.get(d) ?? 0 }))
}

/**
 * Reads the range and writes the observations a person would make if they had
 * the patience to. Every claim is derived here, none of it generated prose.
 */
export function buildInsights(input: InsightInput): Insight[] {
  const { days, meals, bp, water, sleep, meds, settings, previous } = input
  const out: Insight[] = []

  /* ---------- calories ---------- */
  const kcalByDay = groupSum(meals, days, (m) => m.kcal)
  const loggedDays = kcalByDay.filter((d) => d.value > 0)

  if (loggedDays.length) {
    const avg = mean(loggedDays.map((d) => d.value))
    const diff = avg - settings.calorieGoal
    const overDays = loggedDays.filter((d) => d.value > settings.calorieGoal).length
    out.push({
      id: 'kcal-avg',
      title: 'Average daily calories',
      figure: Math.round(avg).toLocaleString(),
      figureUnit: 'kcal',
      tone: Math.abs(diff) <= settings.calorieGoal * 0.1 ? 'good' : diff > 0 ? 'serious' : 'warning',
      body:
        Math.abs(diff) <= settings.calorieGoal * 0.1
          ? `Across ${loggedDays.length} logged day${loggedDays.length === 1 ? '' : 's'} you are tracking close to your ${settings.calorieGoal.toLocaleString()} kcal target.`
          : diff > 0
            ? `That is ${Math.round(diff).toLocaleString()} kcal a day above your target, and you went over on ${overDays} of ${loggedDays.length} logged days.`
            : `That is ${Math.round(-diff).toLocaleString()} kcal a day below your target. Under-eating for long stretches is worth a second look.`,
    })

    const sorted = [...loggedDays].sort(
      (a, b) => Math.abs(a.value - settings.calorieGoal) - Math.abs(b.value - settings.calorieGoal),
    )
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    if (best && worst && best.date !== worst.date) {
      out.push({
        id: 'kcal-spread',
        title: 'Closest and furthest from target',
        tone: 'neutral',
        body: `${prettyDate(best.date)} landed nearest at ${Math.round(best.value).toLocaleString()} kcal. ${prettyDate(worst.date)} was furthest at ${Math.round(worst.value).toLocaleString()} kcal.`,
      })
    }

    if (previous?.meals?.length) {
      const prevAvg = mean(
        Object.values(
          previous.meals.reduce<Record<string, number>>((acc, m) => {
            acc[m.date] = (acc[m.date] ?? 0) + m.kcal
            return acc
          }, {}),
        ),
      )
      if (prevAvg > 0) {
        const change = avg - prevAvg
        out.push({
          id: 'kcal-trend',
          title: 'Versus the previous period',
          figure: `${change >= 0 ? '+' : ''}${Math.round(change).toLocaleString()}`,
          figureUnit: 'kcal/day',
          tone: Math.abs(change) < 100 ? 'neutral' : change > 0 ? 'serious' : 'good',
          body: `Your daily average moved from ${Math.round(prevAvg).toLocaleString()} to ${Math.round(avg).toLocaleString()} kcal compared with the equivalent stretch before this one.`,
        })
      }
    }
  }

  /* ---------- protein ---------- */
  const proteinByDay = groupSum(meals, days, (m) => m.protein)
  const proteinDays = proteinByDay.filter((d) => d.value > 0)
  if (proteinDays.length >= 3) {
    const avgP = mean(proteinDays.map((d) => d.value))
    out.push({
      id: 'protein',
      title: 'Protein intake',
      figure: Math.round(avgP).toString(),
      figureUnit: `g of ${settings.proteinGoal} g`,
      tone: avgP >= settings.proteinGoal * 0.9 ? 'good' : 'warning',
      body:
        avgP >= settings.proteinGoal * 0.9
          ? 'You are hitting your protein target most days.'
          : `You are averaging ${Math.round(settings.proteinGoal - avgP)} g a day short of your protein target.`,
    })
  }

  /* ---------- meal timing ---------- */
  const lateMeals = meals.filter((m) => Number((m.time || '00:00').split(':')[0]) >= 22)
  if (meals.length >= 5 && lateMeals.length >= 2) {
    out.push({
      id: 'late-eating',
      title: 'Late-night eating',
      figure: lateMeals.length.toString(),
      figureUnit: 'meals after 10pm',
      tone: 'warning',
      body: `Those meals carried ${Math.round(sumBy(lateMeals, (m) => m.kcal)).toLocaleString()} kcal in total. Late intake is a common reason morning readings drift up.`,
    })
  }

  /* ---------- most frequent components ---------- */
  if (meals.length >= 3) {
    const counts = new Map<string, { n: number; kcal: number }>()
    for (const m of meals)
      for (const i of m.items ?? []) {
        const k = i.name.trim().toLowerCase()
        if (!k) continue
        const cur = counts.get(k) ?? { n: 0, kcal: 0 }
        counts.set(k, { n: cur.n + 1, kcal: cur.kcal + (i.kcal || 0) })
      }
    const top = [...counts.entries()].sort((a, b) => b[1].kcal - a[1].kcal)[0]
    if (top && top[1].n >= 2) {
      out.push({
        id: 'top-food',
        title: 'Your biggest calorie source',
        figure: Math.round(top[1].kcal).toLocaleString(),
        figureUnit: 'kcal total',
        tone: 'neutral',
        body: `"${top[0]}" appeared in ${top[1].n} components this period and contributed more calories than anything else you logged.`,
      })
    }
  }

  /* ---------- blood pressure ---------- */
  if (bp.length) {
    const avgSys = mean(bp.map((r) => r.systolic))
    const avgDia = mean(bp.map((r) => r.diastolic))
    const cat = classifyBP(Math.round(avgSys), Math.round(avgDia))
    out.push({
      id: 'bp-avg',
      title: 'Average blood pressure',
      figure: `${Math.round(avgSys)}/${Math.round(avgDia)}`,
      figureUnit: 'mmHg',
      tone: cat.tone,
      body: `${bp.length} reading${bp.length === 1 ? '' : 's'} average to ${cat.label.toLowerCase()}. ${cat.advice}`,
    })

    if (previous?.bp?.length) {
      const prevSys = mean(previous.bp.map((r) => r.systolic))
      const change = avgSys - prevSys
      if (Math.abs(change) >= 2) {
        out.push({
          id: 'bp-trend',
          title: 'Systolic trend',
          figure: `${change >= 0 ? '+' : ''}${Math.round(change)}`,
          figureUnit: 'mmHg',
          tone: change > 0 ? 'serious' : 'good',
          body: `Your systolic average moved from ${Math.round(prevSys)} to ${Math.round(avgSys)} mmHg against the previous period.`,
        })
      }
    }

    const highest = [...bp].sort((a, b) => b.systolic - a.systolic)[0]
    if (highest && classifyBP(highest.systolic, highest.diastolic).id !== 'normal') {
      out.push({
        id: 'bp-peak',
        title: 'Highest reading',
        figure: `${highest.systolic}/${highest.diastolic}`,
        figureUnit: 'mmHg',
        tone: classifyBP(highest.systolic, highest.diastolic).tone,
        body: `Recorded on ${prettyDate(highest.date)}${highest.note ? `, noted "${highest.note}"` : ''}.`,
      })
    }

    /* Calories on day N against systolic on day N+1. Correlation is not cause;
       the copy says so. */
    const kcalMap = new Map(kcalByDay.map((d) => [d.date, d.value]))
    const sysByDay = new Map<string, number[]>()
    for (const r of bp) {
      const l = sysByDay.get(r.date) ?? []
      l.push(r.systolic)
      sysByDay.set(r.date, l)
    }
    const xs: number[] = []
    const ys: number[] = []
    for (let i = 0; i < days.length - 1; i++) {
      const k = kcalMap.get(days[i]) ?? 0
      const next = sysByDay.get(days[i + 1])
      if (k > 0 && next?.length) {
        xs.push(k)
        ys.push(mean(next))
      }
    }
    const r = correlation(xs, ys)
    if (r != null && Math.abs(r) >= 0.4) {
      out.push({
        id: 'kcal-bp',
        title: 'Calories and next-day pressure',
        figure: r.toFixed(2),
        figureUnit: 'correlation',
        tone: r > 0 ? 'warning' : 'neutral',
        body:
          r > 0
            ? `Across ${xs.length} paired days, heavier days tended to be followed by higher systolic readings. That is a pattern, not a cause, but it is worth watching.`
            : `Across ${xs.length} paired days, heavier days tended to be followed by lower systolic readings. Treat it as a curiosity rather than a finding.`,
      })
    }
  }

  /* ---------- water ---------- */
  const waterByDay = groupSum(water, days, (w) => w.ml).filter((d) => d.value > 0)
  if (waterByDay.length >= 3) {
    const avgW = mean(waterByDay.map((d) => d.value))
    out.push({
      id: 'water',
      title: 'Water intake',
      figure: (avgW / 1000).toFixed(1),
      figureUnit: `L of ${(settings.waterGoalMl / 1000).toFixed(1)} L`,
      tone: avgW >= settings.waterGoalMl * 0.9 ? 'good' : 'warning',
      body:
        avgW >= settings.waterGoalMl * 0.9
          ? 'You are meeting your hydration goal on most logged days.'
          : `You are averaging ${Math.round(settings.waterGoalMl - avgW)} ml a day below your goal.`,
    })
  }

  /* ---------- sleep ---------- */
  const sleepByDay = groupSum(sleep, days, (s) => s.hours).filter((d) => d.value > 0)
  if (sleepByDay.length >= 3) {
    const avgS = mean(sleepByDay.map((d) => d.value))
    const short = sleepByDay.filter((d) => d.value < settings.sleepGoalHours - 1)
    out.push({
      id: 'sleep',
      title: 'Sleep',
      figure: avgS.toFixed(1),
      figureUnit: `h of ${settings.sleepGoalHours} h`,
      tone: avgS >= settings.sleepGoalHours - 0.5 ? 'good' : 'warning',
      body: short.length
        ? `${short.length} of ${sleepByDay.length} logged nights fell more than an hour short of your goal.`
        : 'You are hitting your sleep goal consistently.',
    })

    if (bp.length >= 4 && short.length >= 2) {
      const shortDates = new Set(short.map((d) => d.date))
      const onShort = bp.filter((r) => shortDates.has(r.date)).map((r) => r.systolic)
      const onRest = bp.filter((r) => !shortDates.has(r.date)).map((r) => r.systolic)
      if (onShort.length >= 2 && onRest.length >= 2) {
        const gap = mean(onShort) - mean(onRest)
        if (Math.abs(gap) >= 3) {
          out.push({
            id: 'sleep-bp',
            title: 'Short nights and your readings',
            figure: `${gap >= 0 ? '+' : ''}${Math.round(gap)}`,
            figureUnit: 'mmHg systolic',
            tone: gap > 0 ? 'warning' : 'neutral',
            body: `On days after a short night your systolic averaged ${Math.round(mean(onShort))} against ${Math.round(mean(onRest))} on the rest.`,
          })
        }
      }
    }
  }

  /* ---------- medication adherence ---------- */
  if (meds.length >= 3) {
    const taken = meds.filter((m) => m.taken).length
    const rate = Math.round((taken / meds.length) * 100)
    out.push({
      id: 'meds',
      title: 'Medication adherence',
      figure: `${rate}%`,
      tone: rate >= 90 ? 'good' : rate >= 70 ? 'warning' : 'serious',
      body: `${taken} of ${meds.length} logged doses were marked as taken.`,
    })
  }

  /* ---------- logging consistency ---------- */
  const covered = new Set([...meals, ...bp, ...water, ...sleep, ...meds].map((x) => x.date))
  const coverage = Math.round((covered.size / days.length) * 100)
  out.push({
    id: 'coverage',
    title: 'Logging consistency',
    figure: `${coverage}%`,
    tone: coverage >= 80 ? 'good' : coverage >= 50 ? 'warning' : 'neutral',
    body: `You logged something on ${covered.size} of the ${days.length} days in this range${coverage < 80 ? '. Gaps make the trends less reliable.' : '.'}`,
  })

  return out
}

/** Longest run of consecutive days with at least one entry, ending today. */
export function currentStreak(dates: Set<string>, days: string[]): number {
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (dates.has(days[i])) streak++
    else break
  }
  return streak
}

export function busiestDayLabel(days: Array<{ date: string; value: number }>): string {
  const top = [...days].sort((a, b) => b.value - a.value)[0]
  return top && top.value > 0 ? shortDate(top.date) : '-'
}
