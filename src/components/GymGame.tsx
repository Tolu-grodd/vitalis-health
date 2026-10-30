import { Award, Flame, Lock, Target, Trophy, Zap } from 'lucide-react'
import { Badge, Card, CardHeader, cn } from './ui'
import { ALL_BADGES, levelFromXP, weekStatsFrom, weeklyChallenges, type WeekStats } from '@/lib/gym'
import type { GymProfile, Workout } from '@/lib/types'

/** ISO-ish week index, used only to rotate the challenge set deterministically. */
export function weekIndex(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 1)
  return Math.floor((d.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

const TIER_STYLE: Record<string, { ring: string; text: string; bg: string }> = {
  bronze: { ring: 'ring-serious/40', text: 'text-serious', bg: 'bg-serious/12' },
  silver: { ring: 'ring-ink-3/40', text: 'text-ink-2', bg: 'bg-surface-3' },
  gold: { ring: 'ring-warning/50', text: 'text-warning', bg: 'bg-warning/15' },
}

/* ------------------------------------------------------------------ *
 * Level and XP
 * ------------------------------------------------------------------ */

export function LevelCard({
  profile,
  weekWorkouts,
  compact,
}: {
  profile: GymProfile
  weekWorkouts: Workout[]
  compact?: boolean
}) {
  const level = levelFromXP(profile.xp)
  const goal = profile.weeklyGoal || 4
  const done = weekWorkouts.length
  const goalRatio = Math.min(done / goal, 1)

  return (
    <Card className={cn('overflow-hidden', compact ? 'p-4' : 'p-5')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium text-ink-3">Training level</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold leading-none tracking-[-0.025em] text-ink">
              {level.level}
            </span>
            <span className="text-[13px] font-medium text-ink-2">{level.title}</span>
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Zap size={19} />
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
          <span className="text-ink-3">
            <span className="tnum font-semibold text-ink">{profile.xp.toLocaleString()}</span> XP
          </span>
          <span className="tnum text-ink-3">{level.toNext.toLocaleString()} to level {level.level + 1}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-700"
            style={{ width: `${level.progress * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-surface-2 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] text-ink-3">
            <Flame size={11} /> Week streak
          </p>
          <p className="tnum mt-0.5 text-[15px] font-semibold text-ink">{profile.weekStreak}</p>
        </div>
        <div className="rounded-xl bg-surface-2 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] text-ink-3">
            <Trophy size={11} /> Badges
          </p>
          <p className="tnum mt-0.5 text-[15px] font-semibold text-ink">
            {profile.badges.length}
            <span className="ml-0.5 text-[10px] font-normal text-ink-3">/{ALL_BADGES.length}</span>
          </p>
        </div>
        <div className="rounded-xl bg-surface-2 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] text-ink-3">
            <Target size={11} /> Sessions
          </p>
          <p className="tnum mt-0.5 text-[15px] font-semibold text-ink">{profile.sessions}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
          <span className="font-medium text-ink-2">This week</span>
          <span className="tnum text-ink-3">
            <span className="font-semibold text-ink">{done}</span> of {goal} sessions
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: goal }, (_, i) => (
            <div
              key={i}
              className={cn('h-2 flex-1 rounded-full transition-colors', i < done ? 'bg-good' : 'bg-surface-3')}
            />
          ))}
        </div>
        {goalRatio >= 1 ? (
          <p className="mt-2 text-[12px] font-medium text-good-text">Weekly goal met. Anything else is a bonus.</p>
        ) : null}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ *
 * Weekly challenges
 * ------------------------------------------------------------------ */

export function ChallengeCard({ weekWorkouts, prsThisWeek }: { weekWorkouts: Workout[]; prsThisWeek: number }) {
  const stats: WeekStats = weekStatsFrom(weekWorkouts, prsThisWeek)
  const challenges = weeklyChallenges(weekIndex())

  return (
    <Card>
      <CardHeader
        title="This week's challenges"
        subtitle="Three targets, refreshed every Monday"
        action={
          <Badge>{challenges.filter((c) => c.value(stats) >= c.target).length} of {challenges.length} done</Badge>
        }
      />
      <ul className="space-y-3 px-5 pb-5">
        {challenges.map((c) => {
          const value = c.value(stats)
          const ratio = Math.min(value / c.target, 1)
          const complete = value >= c.target
          return (
            <li key={c.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className={cn('text-[13px] font-medium', complete ? 'text-good-text' : 'text-ink-2')}>
                  {complete ? 'Done: ' : ''}
                  {c.label}
                </span>
                <span className="tnum shrink-0 text-[12px] text-ink-3">
                  <span className="font-semibold text-ink">{Math.round(value).toLocaleString()}</span> /{' '}
                  {c.target.toLocaleString()} {c.unit}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${ratio * 100}%`, background: complete ? 'var(--good)' : 'var(--brand)' }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/* ------------------------------------------------------------------ *
 * Badge shelf
 * ------------------------------------------------------------------ */

export function BadgeShelf({ earned }: { earned: string[] }) {
  const held = new Set(earned)
  return (
    <Card>
      <CardHeader
        title="Badges"
        subtitle="Unlocked automatically when you meet the condition"
        action={
          <Badge>
            {held.size} of {ALL_BADGES.length}
          </Badge>
        }
      />
      <ul className="grid grid-cols-2 gap-2 px-5 pb-5 sm:grid-cols-3 xl:grid-cols-4">
        {ALL_BADGES.map((b) => {
          const on = held.has(b.id)
          const s = TIER_STYLE[b.tier]
          return (
            <li
              key={b.id}
              className={cn(
                'rounded-xl border p-3 transition-opacity',
                on ? 'border-line bg-surface-2/60' : 'border-line/60 opacity-55',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1',
                  on ? `${s.bg} ${s.text} ${s.ring}` : 'bg-surface-2 text-ink-3 ring-line',
                )}
              >
                {on ? <Award size={16} /> : <Lock size={14} />}
              </span>
              <p className="mt-2 text-[12.5px] font-semibold leading-tight text-ink">{b.name}</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-ink-3">{b.description}</p>
              <p className={cn('mt-1.5 text-[10.5px] font-medium uppercase tracking-[0.06em]', on ? s.text : 'text-ink-3')}>
                {b.tier}
              </p>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
