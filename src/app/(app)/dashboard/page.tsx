import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sessions } = await supabase
    .schema('substrata')
    .from('test_sessions')
    .select('day_number, completed_at')
    .eq('user_id', user!.id)
    .order('day_number')

  const completedDays = (sessions ?? []).filter(s => s.completed_at).length
  const nextDay = completedDays + 1
  const allDone = completedDays >= 3

  return (
    <div className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <div className="max-w-sm mx-auto px-6 py-16">
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--stone)' }}>
          Substrata
        </p>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--parchment)' }}>
          {user?.email}
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--stone)' }}>
          {completedDays === 0 && 'Profile not started.'}
          {completedDays > 0 && !allDone && `${completedDays} of 3 sessions complete.`}
          {allDone && 'Baseline profile complete.'}
        </p>

        <Link
          href="/test"
          className="block w-full py-3 rounded-xl font-semibold text-sm text-center mb-4"
          style={{ background: 'var(--indigo)', color: '#fff', textDecoration: 'none' }}
        >
          {completedDays === 0 ? 'Start your profile →' : allDone ? 'View your profile →' : `Continue — Day ${nextDay} →`}
        </Link>

        <Link
          href="/test"
          className="block w-full text-sm text-center"
          style={{ color: 'var(--stone)', textDecoration: 'none' }}
        >
          All sessions
        </Link>
      </div>
    </div>
  )
}
