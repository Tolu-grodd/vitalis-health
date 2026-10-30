import { useMemo, useState } from 'react'
import { Download, FileText, Sheet, Sparkles, TableProperties } from 'lucide-react'
import { PageHeader } from '@/components/AppShell'
import { BPTrend, CalorieTrend, DailyBarTrend, MacroTrend } from '@/components/charts'
import { Button, Card, CardHeader, EmptyState, StatusPill, useToast } from '@/components/ui'
import { useRangeCollection, useSettings } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useRange } from '@/hooks/useRange'
import { daysInRange, previousRange } from '@/lib/dates'
import { bpAverages } from '@/lib/health'
import { buildInsights } from '@/lib/insights'
import type { ExportBundle } from '@/lib/exporters'
import type { BPReading, Meal, MedEntry, SleepEntry, WaterEntry } from '@/lib/types'

export function Insights() {
  const { user } = useAuth()
  const { range } = useRange()
  const { settings } = useSettings()
  const toast = useToast()
  const prev = useMemo(() => previousRange(range), [range])

  const meals = useRangeCollection<Meal>('meals', range)
  const bp = useRangeCollection<BPReading>('bp', range)
  const water = useRangeCollection<WaterEntry>('water', range)
  const sleep = useRangeCollection<SleepEntry>('sleep', range)
  const meds = useRangeCollection<MedEntry>('meds', range)
  const prevMeals = useRangeCollection<Meal>('meals', prev)
  const prevBP = useRangeCollection<BPReading>('bp', prev)

  const days = useMemo(() => daysInRange(range), [range])

  const insights = useMemo(
    () =>
      buildInsights({
        days,
        meals: meals.items,
        bp: bp.items,
        water: water.items,
        sleep: sleep.items,
        meds: meds.items,
        settings,
        previous: { meals: prevMeals.items, bp: prevBP.items },
      }),
    [days, meals.items, bp.items, water.items, sleep.items, meds.items, settings, prevMeals.items, prevBP.items],
  )

  const bundle: ExportBundle = {
    range,
    days,
    meals: meals.items,
    bp: bp.items,
    water: water.items,
    sleep: sleep.items,
    meds: meds.items,
    settings,
    who: { name: settings.displayName || user?.displayName, email: user?.email },
  }

  const kcalByDay = useMemo(() => {
    const m = new Map<string, number>()
    for (const x of meals.items) m.set(x.date, (m.get(x.date) ?? 0) + x.kcal)
    return days.map((d) => ({ date: d, kcal: m.get(d) ?? 0 }))
  }, [meals.items, days])

  const macroByDay = useMemo(() => {
    const m = new Map<string, { protein: number; carbs: number; fat: number }>()
    for (const x of meals.items) {
      const cur = m.get(x.date) ?? { protein: 0, carbs: 0, fat: 0 }
      m.set(x.date, { protein: cur.protein + x.protein, carbs: cur.carbs + x.carbs, fat: cur.fat + x.fat })
    }
    return days.map((d) => ({ date: d, ...(m.get(d) ?? { protein: 0, carbs: 0, fat: 0 }) }))
  }, [meals.items, days])

  const bpByDay = useMemo(() => {
    const m = new Map<string, BPReading[]>()
    for (const r of bp.items) {
      const l = m.get(r.date) ?? []
      l.push(r)
      m.set(r.date, l)
    }
    return days
      .filter((d) => m.has(d))
      .map((d) => {
        const a = bpAverages(m.get(d)!)
        return { date: d, systolic: a.systolic, diastolic: a.diastolic }
      })
  }, [bp.items, days])

  const waterByDay = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of water.items) m.set(w.date, (m.get(w.date) ?? 0) + w.ml)
    return days.map((d) => ({ date: d, value: m.get(d) ?? 0 }))
  }, [water.items, days])

  const hasAnything = meals.items.length + bp.items.length + water.items.length + sleep.items.length > 0

  const [exporting, setExporting] = useState(false)

  /** The PDF engine is ~380 kB, so it loads on demand rather than on first paint. */
  async function runExport(kind: 'pdf' | 'meals' | 'excel' | 'bp' | 'vitals') {
    setExporting(true)
    try {
      const mod = await import('@/lib/exporters')
      if (kind === 'pdf') {
        mod.exportPDF(bundle)
        toast('PDF report generated')
      } else if (kind === 'excel') {
        await mod.exportMealsExcel(bundle)
        toast('Excel meal log downloaded')
      } else if (kind === 'meals') {
        mod.exportMealsCSV(bundle)
        toast('Meals CSV downloaded')
      } else if (kind === 'bp') {
        mod.exportBPCSV(bundle)
        toast('Blood pressure CSV downloaded')
      } else {
        mod.exportVitalsCSV(bundle)
        toast('Vitals CSV downloaded')
      }
    } catch (e) {
      toast((e as Error).message, 'critical')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Insights"
        subtitle="Trends from this range, plus a report you can hand over"
        action={
          <Button variant="primary" onClick={() => runExport('pdf')} loading={exporting} disabled={!hasAnything || exporting}>
            {!exporting ? <FileText size={16} /> : null}
            Download PDF report
          </Button>
        }
      />

      {!hasAnything ? (
        <Card>
          <EmptyState
            icon={<Sparkles size={20} />}
            title="Nothing to read yet"
            body="Log a few days of meals or readings and this page will fill in."
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {insights.map((i) => (
              <Card key={i.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-ink">{i.title}</p>
                  <StatusPill tone={i.tone}>
                    {i.tone === 'good'
                      ? 'On track'
                      : i.tone === 'warning'
                        ? 'Watch'
                        : i.tone === 'serious'
                          ? 'Attention'
                          : i.tone === 'critical'
                            ? 'Act'
                            : 'Note'}
                  </StatusPill>
                </div>
                {i.figure ? (
                  <p className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-[28px] font-semibold leading-none tracking-[-0.025em] text-ink">
                      {i.figure}
                    </span>
                    {i.figureUnit ? <span className="text-[12px] text-ink-3">{i.figureUnit}</span> : null}
                  </p>
                ) : null}
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-2">{i.body}</p>
              </Card>
            ))}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <CalorieTrend data={kcalByDay} goal={settings.calorieGoal} />
            <MacroTrend data={macroByDay} />
            {bpByDay.length ? (
              <BPTrend
                data={bpByDay}
                targetSystolic={settings.bpTargetSystolic}
                targetDiastolic={settings.bpTargetDiastolic}
              />
            ) : null}
            {waterByDay.some((d) => d.value > 0) ? (
              <DailyBarTrend
                title="Water intake"
                subtitle="Millilitres per day"
                data={waterByDay}
                label="Water"
                unit="ml"
                goal={settings.waterGoalMl}
              />
            ) : null}
          </div>

          <Card className="mt-4">
            <CardHeader
              title="Export your data"
              subtitle="Your log, in formats other tools and clinicians can read"
            />
            <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-4">
              <Button variant="secondary" onClick={() => runExport('pdf')} disabled={exporting}>
                <FileText size={15} />
                PDF report
              </Button>
              <Button variant="secondary" onClick={() => runExport('excel')} disabled={!meals.items.length || exporting}>
                <Sheet size={15} />
                Meal log (Excel)
              </Button>
              <Button variant="secondary" onClick={() => runExport('meals')} disabled={!meals.items.length || exporting}>
                <TableProperties size={15} />
                Meals CSV
              </Button>
              <Button variant="secondary" onClick={() => runExport('bp')} disabled={!bp.items.length || exporting}>
                <TableProperties size={15} />
                Blood pressure CSV
              </Button>
              <Button
                variant="secondary"
                onClick={() => runExport('vitals')}
                disabled={(!water.items.length && !sleep.items.length && !meds.items.length) || exporting}
              >
                <Download size={15} />
                Vitals CSV
              </Button>
            </div>
            <p className="px-5 pb-5 text-[12px] leading-relaxed text-ink-3">
              Exports cover the date range currently selected at the top of the page. The meals CSV has one row per
              component, so you can pivot it however you like.
            </p>
          </Card>
        </>
      )}
    </>
  )
}
