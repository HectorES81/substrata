import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QUESTIONS, DAY_QUESTIONS } from '../../questions'
import DayQuestionnaire from './day-questionnaire'

const ALLOWED_EMAIL = 'hect0rchicas@hotmail.com'
const TOTAL_DAYS = 3

export default async function TestDayPage({ params }: { params: { n: string } }) {
  const dayNumber = parseInt(params.n, 10)
  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > TOTAL_DAYS) notFound()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ALLOWED_EMAIL) redirect('/dashboard')

  // Check if previous day is complete (for days 2+)
  if (dayNumber > 1) {
    const { data: prevSession } = await supabase
      .schema('substrata')
      .from('test_sessions')
      .select('completed_at')
      .eq('user_id', user.id)
      .eq('day_number', dayNumber - 1)
      .maybeSingle()

    if (!prevSession?.completed_at) redirect('/test')
  }

  // Fetch this day's session (may not exist yet)
  const { data: session } = await supabase
    .schema('substrata')
    .from('test_sessions')
    .select('id, completed_at')
    .eq('user_id', user.id)
    .eq('day_number', dayNumber)
    .maybeSingle()

  // If completed, fetch the saved report
  let existingReport: string | null = null
  let existingScores: Record<string, number> | null = null
  if (session?.completed_at) {
    const { data: report } = await supabase
      .schema('substrata')
      .from('session_reports')
      .select('report_text, scores')
      .eq('session_id', session.id)
      .maybeSingle()
    existingReport = report?.report_text ?? null
    existingScores = report?.scores ?? null
  }

  const dayQuestionIds = DAY_QUESTIONS[dayNumber]
  const dayQuestions = QUESTIONS.filter(q => dayQuestionIds.includes(q.id))

  return (
    <DayQuestionnaire
      dayNumber={dayNumber}
      userId={user.id}
      questions={dayQuestions}
      existingReport={existingReport}
      existingScores={existingScores}
    />
  )
}
