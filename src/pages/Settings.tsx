import { useEffect, useState } from 'react'
import {
  BookMarked,
  Dumbbell,
  Info,
  LogOut,
  Palette,
  Save,
  Target,
  Utensils,
} from 'lucide-react'
import { PageHeader, useTheme } from '@/components/AppShell'
import { InstallCard } from '@/components/PWA'
import { CategoryManager } from '@/pages/Schedule'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmButton,
  EmptyState,
  Field,
  Input,
  NumberInput,
  Segmented,
  Select,
  cn,
  useToast,
} from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import {
  useCustomFoods,
  useFlatCollection,
  useGymProfile,
  useMealTemplates,
  useMutations,
  useScheduleConfig,
  useSettings,
} from '@/hooks/useData'
import { macroEnergySplit } from '@/lib/health'
import { GRANULARITY_OPTIONS, toMinutes } from '@/lib/schedule'
import {
  DEFAULT_SETTINGS,
  type CustomExercise,
  type Granularity,
  type Routine,
  type Settings as SettingsShape,
} from '@/lib/types'

type Tab = 'goals' | 'training' | 'health' | 'display' | 'schedule' | 'data' | 'app'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'goals', label: 'Nutrition' },
  { id: 'training', label: 'Training' },
  { id: 'health', label: 'Health' },
  { id: 'display', label: 'Display' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'data', label: 'Saved data' },
  { id: 'app', label: 'App' },
]

export function Settings() {
  const { user, signOut } = useAuth()
  const { settings, save } = useSettings()
  const { config, saveConfig } = useScheduleConfig()
  const { profile, saveProfile } = useGymProfile()
  const { mode, setMode } = useTheme()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('goals')
  const [draft, setDraft] = useState<SettingsShape>(settings)
  const [saving, setSaving] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  useEffect(() => setDraft(settings), [settings])

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)

  function set<K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await save(draft)
      toast('Settings saved')
    } catch (e) {
      toast((e as Error).message, 'critical')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Targets, defaults and everything the app remembers about how you like it"
        action={
          <Button variant="primary" onClick={handleSave} loading={saving} disabled={!dirty || saving}>
            <Save size={16} />
            {dirty ? 'Save changes' : 'Saved'}
          </Button>
        }
      />

      <div className="mb-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors',
              tab === t.id ? 'bg-brand text-brand-ink' : 'bg-surface-2 text-ink-2 hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {dirty ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand-soft px-4 py-2.5">
          <span className="text-[13px] font-medium text-brand">You have unsaved changes.</span>
          <Button size="sm" variant="primary" onClick={handleSave} loading={saving}>
            Save now
          </Button>
        </div>
      ) : null}

      {tab === 'goals' ? <NutritionTab draft={draft} set={set} setDraft={setDraft} /> : null}
      {tab === 'training' ? (
        <TrainingTab
          draft={draft}
          set={set}
          weeklyGoal={profile.weeklyGoal || 4}
          bestStreak={profile.bestWeekStreak}
          onWeeklyGoal={async (n) => {
            await saveProfile({ weeklyGoal: n })
            toast(`Weekly goal set to ${n} sessions`)
          }}
        />
      ) : null}
      {tab === 'health' ? <HealthTab draft={draft} set={set} /> : null}
      {tab === 'display' ? <DisplayTab draft={draft} set={set} mode={mode} setMode={setMode} /> : null}
      {tab === 'schedule' ? (
        <ScheduleTab
          granularity={config.granularity}
          dayStart={config.dayStart}
          dayEnd={config.dayEnd}
          categoryCount={config.categories.length}
          onChange={(patch) => saveConfig(patch)}
          onOpenCategories={() => setCategoriesOpen(true)}
        />
      ) : null}
      {tab === 'data' ? <DataTab /> : null}
      {tab === 'app' ? <AppTab user={user} onSignOut={() => signOut()} /> : null}

      <CategoryManager
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        categories={config.categories}
        onSave={(categories) => {
          saveConfig({ categories })
          toast('Categories saved')
          setCategoriesOpen(false)
        }}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */

type Setter = <K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) => void

function NutritionTab({
  draft,
  set,
  setDraft,
}: {
  draft: SettingsShape
  set: Setter
  setDraft: React.Dispatch<React.SetStateAction<SettingsShape>>
}) {
  const split = macroEnergySplit({
    kcal: draft.calorieGoal,
    protein: draft.proteinGoal,
    carbs: draft.carbGoal,
    fat: draft.fatGoal,
    grams: 0,
  })
  const macroKcal = draft.proteinGoal * 4 + draft.carbGoal * 4 + draft.fatGoal * 9

  function rebalance() {
    const kcal = draft.calorieGoal
    setDraft((d) => ({
      ...d,
      proteinGoal: Math.round((kcal * 0.3) / 4),
      carbGoal: Math.round((kcal * 0.4) / 4),
      fatGoal: Math.round((kcal * 0.3) / 9),
    }))
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader
          title="Calories and macros"
          subtitle="What the goal ring and the daily meters measure against"
          action={
            <Button size="sm" variant="ghost" onClick={rebalance}>
              <Target size={14} />
              Balance macros
            </Button>
          }
        />
        <div className="space-y-4 px-5 pb-5">
          <Field label="Calorie target" hint="kcal per day">
            <NumberInput
              value={draft.calorieGoal}
              min={800}
              max={8000}
              step={50}
              onChange={(e) => set('calorieGoal', Number(e.target.value) || 0)}
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Protein" hint="g">
              <NumberInput
                value={draft.proteinGoal}
                min={0}
                onChange={(e) => set('proteinGoal', Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Carbs" hint="g">
              <NumberInput value={draft.carbGoal} min={0} onChange={(e) => set('carbGoal', Number(e.target.value) || 0)} />
            </Field>
            <Field label="Fat" hint="g">
              <NumberInput value={draft.fatGoal} min={0} onChange={(e) => set('fatGoal', Number(e.target.value) || 0)} />
            </Field>
          </div>

          <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12.5px] text-ink-2">
                Those macros carry <span className="tnum font-semibold text-ink">{macroKcal.toLocaleString()}</span> kcal
              </span>
              <span className="tnum text-[12px] text-ink-3">
                {split.protein}% P · {split.carbs}% C · {split.fat}% F
              </span>
            </div>
            {Math.abs(macroKcal - draft.calorieGoal) > draft.calorieGoal * 0.05 ? (
              <p className="mt-1.5 text-[12px] text-serious">
                That is {Math.abs(macroKcal - draft.calorieGoal).toLocaleString()} kcal{' '}
                {macroKcal > draft.calorieGoal ? 'above' : 'below'} your calorie target. Balance macros will line them
                up.
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Water and sleep" subtitle="Goals and the one-tap amounts on the water card" />
        <div className="space-y-4 px-5 pb-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Water goal" hint="ml per day">
              <NumberInput
                value={draft.waterGoalMl}
                min={0}
                step={100}
                onChange={(e) => set('waterGoalMl', Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Sleep goal" hint="hours per night">
              <NumberInput
                value={draft.sleepGoalHours}
                min={0}
                max={16}
                step="0.5"
                onChange={(e) => set('sleepGoalHours', Number(e.target.value) || 0)}
              />
            </Field>
          </div>

          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Water quick add buttons</span>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <NumberInput
                  key={i}
                  value={draft.waterQuickAmounts?.[i] ?? 250}
                  min={1}
                  aria-label={`Quick amount ${i + 1}`}
                  onChange={(e) =>
                    set(
                      'waterQuickAmounts',
                      [0, 1, 2, 3].map((j) =>
                        j === i ? Number(e.target.value) || 0 : (draft.waterQuickAmounts?.[j] ?? 250),
                      ),
                    )
                  }
                />
              ))}
            </div>
            <p className="mt-1.5 text-[12px] text-ink-3">
              A glass is about 250 ml, a can 330 ml, a small bottle 500 ml.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function TrainingTab({
  draft,
  set,
  weeklyGoal,
  bestStreak,
  onWeeklyGoal,
}: {
  draft: SettingsShape
  set: Setter
  weeklyGoal: number
  bestStreak: number
  onWeeklyGoal: (n: number) => Promise<void>
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader
          title="Weekly training goal"
          subtitle="How many sessions count as a full week. Streaks and the dashboard ring measure against this."
        />
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2">
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                onClick={() => onWeeklyGoal(n)}
                className={cn(
                  'h-11 flex-1 rounded-xl border text-[14px] font-semibold transition-colors',
                  weeklyGoal === n ? 'border-brand bg-brand text-brand-ink' : 'border-line text-ink-2 hover:bg-surface-2',
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-ink-3">
            Saved immediately. Best run so far: <span className="font-semibold text-ink">{bestStreak}</span> weeks.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Logging defaults" subtitle="How the workout editor behaves when you start a session" />
        <div className="space-y-4 px-5 pb-5">
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Weight unit</span>
            <Segmented
              value={draft.weightUnit}
              onChange={(v) => set('weightUnit', v)}
              options={[
                { value: 'kg', label: 'Kilograms' },
                { value: 'lb', label: 'Pounds' },
              ]}
            />
            <p className="mt-1.5 text-[12px] text-ink-3">
              Weights are always stored in kilograms, so switching converts what you see without touching your history.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Default rest timer" hint="seconds">
              <NumberInput
                value={draft.restTimerSeconds}
                min={10}
                max={600}
                step={15}
                onChange={(e) => set('restTimerSeconds', Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Sets per new exercise" hint="empty rows added">
              <NumberInput
                value={draft.defaultSets}
                min={1}
                max={10}
                onChange={(e) => set('defaultSets', Number(e.target.value) || 1)}
              />
            </Field>
          </div>
        </div>
      </Card>
    </div>
  )
}

function HealthTab({ draft, set }: { draft: SettingsShape; set: Setter }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader title="Blood pressure targets" subtitle="Drawn as reference lines on the trend chart" />
        <div className="space-y-4 px-5 pb-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target systolic" hint="mmHg">
              <NumberInput
                value={draft.bpTargetSystolic}
                min={80}
                max={200}
                onChange={(e) => set('bpTargetSystolic', Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Target diastolic" hint="mmHg">
              <NumberInput
                value={draft.bpTargetDiastolic}
                min={40}
                max={140}
                onChange={(e) => set('bpTargetDiastolic', Number(e.target.value) || 0)}
              />
            </Field>
          </div>
          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-3">
            <Info size={14} className="mt-px shrink-0" />
            These are your own targets, not clinical advice. If you are being treated for blood pressure, use the
            numbers your clinician gave you.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Reading defaults" subtitle="Preselected each time you log a reading" />
        <div className="space-y-4 px-5 pb-5">
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Arm</span>
            <Segmented
              value={draft.bpDefaultArm}
              onChange={(v) => set('bpDefaultArm', v)}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
              ]}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Position</span>
            <Segmented
              value={draft.bpDefaultPosition}
              onChange={(v) => set('bpDefaultPosition', v)}
              options={[
                { value: 'sitting', label: 'Sitting' },
                { value: 'standing', label: 'Standing' },
                { value: 'lying', label: 'Lying' },
              ]}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

function DisplayTab({
  draft,
  set,
  mode,
  setMode,
}: {
  draft: SettingsShape
  set: Setter
  mode: 'system' | 'light' | 'dark'
  setMode: (m: 'system' | 'light' | 'dark') => void
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader title="Appearance" subtitle="Theme applies to this device only" />
        <div className="space-y-4 px-5 pb-5">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
          <Field label="Display name" hint="Used in the greeting and on the exported report">
            <Input
              value={draft.displayName ?? ''}
              placeholder="Leave blank to use your Google name"
              onChange={(e) => set('displayName', e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Dates and times" subtitle="Applies everywhere times and weeks are shown" />
        <div className="space-y-4 px-5 pb-5">
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Time format</span>
            <Segmented
              value={draft.timeFormat}
              onChange={(v) => set('timeFormat', v)}
              options={[
                { value: '12h', label: '1:30 pm' },
                { value: '24h', label: '13:30' },
              ]}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Week starts on</span>
            <Segmented
              value={draft.weekStartsOn}
              onChange={(v) => set('weekStartsOn', v)}
              options={[
                { value: 'mon', label: 'Monday' },
                { value: 'sun', label: 'Sunday' },
              ]}
            />
            <p className="mt-1.5 text-[12px] text-ink-3">
              Changes the schedule columns, the history calendar and which days count as this week.
            </p>
          </div>
          <Field label="Date range the app opens on">
            <Select value={draft.defaultRange} onChange={(e) => set('defaultRange', e.target.value as SettingsShape['defaultRange'])}>
              <option value="7d">Last 7 days</option>
              <option value="14d">Last 14 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="mtd">Month to date</option>
            </Select>
          </Field>
        </div>
      </Card>
    </div>
  )
}

function ScheduleTab({
  granularity,
  dayStart,
  dayEnd,
  categoryCount,
  onChange,
  onOpenCategories,
}: {
  granularity: Granularity
  dayStart: string
  dayEnd: string
  categoryCount: number
  onChange: (patch: { granularity?: Granularity; dayStart?: string; dayEnd?: string }) => void
  onOpenCategories: () => void
}) {
  const [start, setStart] = useState(dayStart)
  const [end, setEnd] = useState(dayEnd)

  useEffect(() => {
    setStart(dayStart)
    setEnd(dayEnd)
  }, [dayStart, dayEnd])

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader title="Timetable grid" subtitle="Saved as you change them" />
        <div className="space-y-4 px-5 pb-5">
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Slot size</span>
            <Segmented
              value={String(granularity)}
              onChange={(v) => onChange({ granularity: Number(v) as Granularity })}
              options={GRANULARITY_OPTIONS.map((g) => ({ value: String(g.value), label: g.label }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Day starts">
              <Input
                type="time"
                step={1800}
                value={start}
                onChange={(e) => setStart(e.target.value)}
                onBlur={() => toMinutes(end) > toMinutes(start) && onChange({ dayStart: start })}
              />
            </Field>
            <Field label="Day ends">
              <Input
                type="time"
                step={1800}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                onBlur={() => toMinutes(end) > toMinutes(start) && onChange({ dayEnd: end })}
              />
            </Field>
          </div>
          <p className="text-[12px] leading-relaxed text-ink-3">
            Blocks outside these hours are kept, they are just not drawn until you widen the range again.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Categories"
          subtitle="The presets offered when you create a block, and their colours"
          action={<Badge>{categoryCount}</Badge>}
        />
        <div className="px-5 pb-5">
          <Button variant="secondary" onClick={onOpenCategories}>
            <Palette size={15} />
            Edit categories and colours
          </Button>
        </div>
      </Card>
    </div>
  )
}

function DataTab() {
  const { foods, removeFood } = useCustomFoods()
  const { templates, removeTemplate } = useMealTemplates()
  const { items: exercises } = useFlatCollection<CustomExercise>('exercises')
  const { items: routines } = useFlatCollection<Routine>('routines')
  const exerciseM = useMutations('exercises')
  const routineM = useMutations('routines')

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader title="Your saved foods" subtitle="Quoted per 100 g" action={<Badge>{foods.length}</Badge>} />
        {foods.length ? (
          <ul className="max-h-72 divide-y divide-line overflow-y-auto">
            {foods.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-5 py-2.5">
                <Utensils size={14} className="shrink-0 text-ink-3" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{f.name}</span>
                <span className="tnum shrink-0 text-[12px] text-ink-3">{f.kcal} kcal</span>
                <ConfirmButton label="Remove" onConfirm={() => removeFood(f.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No saved foods yet"
            body="Open a meal component, expand the macros and tap Save to my foods."
          />
        )}
      </Card>

      <Card>
        <CardHeader title="Reusable meals" subtitle="Saved with Save and reuse" action={<Badge>{templates.length}</Badge>} />
        {templates.length ? (
          <ul className="max-h-72 divide-y divide-line overflow-y-auto">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                <BookMarked size={14} className="shrink-0 text-ink-3" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{t.name}</span>
                <span className="tnum shrink-0 text-[12px] text-ink-3">
                  {t.items.reduce((a, b) => a + (b.kcal || 0), 0).toLocaleString()} kcal
                </span>
                <ConfirmButton label="Remove" onConfirm={() => removeTemplate(t.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No reusable meals yet" body="When logging a meal you eat often, choose Save and reuse." />
        )}
      </Card>

      <Card>
        <CardHeader
          title="Custom exercises"
          subtitle="Yours, on top of the built-in library"
          action={<Badge>{exercises.length}</Badge>}
        />
        {exercises.length ? (
          <ul className="max-h-72 divide-y divide-line overflow-y-auto">
            {exercises.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-5 py-2.5">
                <Dumbbell size={14} className="shrink-0 text-ink-3" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{e.name}</span>
                <span className="shrink-0 text-[12px] text-ink-3">
                  {e.group} · {e.equipment}
                </span>
                <ConfirmButton label="Remove" onConfirm={() => exerciseM.remove(e.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No custom exercises"
            body="Create one from the workout editor when the library does not have what you need."
          />
        )}
      </Card>

      <Card>
        <CardHeader title="Routines" subtitle="Templates you start sessions from" action={<Badge>{routines.length}</Badge>} />
        {routines.length ? (
          <ul className="max-h-72 divide-y divide-line overflow-y-auto">
            {routines.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                <Dumbbell size={14} className="shrink-0 text-ink-3" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{r.name}</span>
                <span className="shrink-0 text-[12px] text-ink-3">{r.exercises.length} exercises</span>
                <ConfirmButton label="Remove" onConfirm={() => routineM.remove(r.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No routines yet" body="Build one on the Gym tab under Routines." />
        )}
      </Card>
    </div>
  )
}

function AppTab({
  user,
  onSignOut,
}: {
  user: { displayName?: string | null; email?: string | null; photoURL?: string | null } | null
  onSignOut: () => void
}) {
  const { save } = useSettings()
  const toast = useToast()

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <InstallCard />

      <div className="space-y-4">
        <Card>
          <CardHeader title="Account" />
          <div className="flex flex-wrap items-center gap-3 px-5 pb-5">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="h-11 w-11 rounded-full border border-line object-cover"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-ink">{user?.displayName ?? 'Signed in'}</p>
              <p className="truncate text-[12.5px] text-ink-3">{user?.email}</p>
            </div>
            <Button variant="secondary" onClick={onSignOut}>
              <LogOut size={15} />
              Sign out
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Reset" subtitle="Puts every target and default back to how it shipped" />
          <div className="px-5 pb-5">
            <ConfirmButton
              label="Reset all settings to defaults"
              onConfirm={async () => {
                await save(DEFAULT_SETTINGS)
                toast('Settings reset to defaults', 'neutral')
              }}
            />
            <p className="mt-2 text-[12px] leading-relaxed text-ink-3">
              This only touches settings. Your meals, readings, workouts and schedule are not affected.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
