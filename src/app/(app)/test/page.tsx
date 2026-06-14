import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DAY_LABELS, CONFIDENCE_BY_DAY } from './questions'

const ALLOWED_EMAIL = 'hect0rchicas@hotmail.com'

type Session = { day_number: number; completed_at: string | null }

function confidenceScore(sessions: Session[]) {
  const completedDays = sessions.filter(s => s.completed_at).map(s => s.day_number)
  const maxDay = completedDays.length ? Math.max(...completedDays) : 0
  return CONFIDENCE_BY_DAY[maxDay] ?? 0
}

function DayCard({
  dayNumber,
  session,
  prevComplete,
}: {
  dayNumber: number
  session: Session | undefined
  prevComplete: boolean
}) {
  const info = DAY_LABELS[dayNumber]
  const isComplete = !!session?.completed_at
  const isUnlocked = dayNumber === 1 || prevComplete
  const dateStr = session?.completed_at
    ? new Date(session.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--charcoal)',
        border: `1.5px solid ${isComplete ? '#4A4580' : isUnlocked ? '#3D3A36' : '#2A2825'}`,
        opacity: isUnlocked ? 1 : 0.6,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: 'var(--stone)' }}>
            Day {dayNumber}
          </p>
          <p className="text-base font-semibold" style={{ color: 'var(--parchment)' }}>
            {info.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--stone)' }}>
            {info.subtitle}
          </p>
        </div>
        {isComplete && (
          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: '#1A2E1A', color: '#5A9A5A' }}>
            Complete
          </span>
        )}
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--stone)' }}>
        {info.count} questions
        {dateStr && ` · Completed ${dateStr}`}
      </p>

      {isComplete ? (
        <Link
          href={`/test/day/${dayNumber}`}
          className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-opacity"
          style={{ background: '#2E2B27', color: 'var(--sand)', textDecoration: 'none' }}
        >
          View results →
        </Link>
      ) : isUnlocked ? (
        <Link
          href={`/test/day/${dayNumber}`}
          className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center"
          style={{ background: 'var(--indigo)', color: '#fff', textDecoration: 'none' }}
        >
          {dayNumber === 1 ? 'Begin →' : 'Continue →'}
        </Link>
      ) : (
        <p className="text-xs text-center py-2.5" style={{ color: 'var(--stone)' }}>
          Unlocks after Day {dayNumber - 1}
        </p>
      )}
    </div>
  )
}

export default async function TestHubPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ALLOWED_EMAIL) redirect('/dashboard')

  const { data: rawSessions } = await supabase
    .schema('substrata')
    .from('test_sessions')
    .select('day_number, completed_at')
    .eq('user_id', user.id)
    .order('day_number')

  const sessions: Session[] = rawSessions ?? []
  const sessionByDay = Object.fromEntries(sessions.map(s => [s.day_number, s]))
  const confidence = confidenceScore(sessions)

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: 'var(--obsidian)' }}>
      <div className="w-full max-w-sm mx-auto">
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--stone)' }}>
          Substrata · Profile
        </p>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--parchment)' }}>
          Your layers.
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--stone)' }}>
          Each session reveals more. Complete all three to unlock your full profile.
        </p>

        {/* Confidence bar */}
        <div className="mb-8 p-4 rounded-xl" style={{ background: 'var(--charcoal)' }}>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--stone)' }}>
              Profile confidence
            </span>
            <span className="text-sm font-semibold" style={{ color: confidence >= 50 ? 'var(--indigo)' : 'var(--stone)' }}>
              {confidence}%
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: '#2E2B27' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${confidence}%`, background: 'var(--indigo)' }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--stone)' }}>
            {confidence === 0 && 'Complete Day 1 to begin building your profile.'}
            {confidence > 0 && confidence < 55 && 'Day 2 will unlock community features at 50%.'}
            {confidence >= 55 && confidence < 75 && 'Complete Day 3 to reach your baseline profile.'}
            {confidence >= 75 && 'Baseline complete. More sections coming soon.'}
          </p>
        </div>

        {/* Day cards */}
        <div className="space-y-4">
          {[1, 2, 3].map(day => (
            <DayCard
              key={day}
              dayNumber={day}
              session={sessionByDay[day]}
              prevComplete={!!sessionByDay[day - 1]?.completed_at}
            />
          ))}
        </div>

        <p className="mt-8 text-xs text-center leading-relaxed" style={{ color: 'var(--stone)' }}>
          These 3 sessions cover personality, attachment, and values — 3 of 8 planned sections.
          More dimensions arrive as Substrata grows.
        </p>
      </div>
    </div>
  )
}
