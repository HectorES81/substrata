import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QUESTIONS, DAY_QUESTIONS, DAY_ANALYSIS_HEADERS } from '../../questions'
import DayQuestionnaire from './day-questionnaire'

const ALLOWED_EMAIL = 'hect0rchicas@hotmail.com'
const TOTAL_DAYS = 8

export default async function TestDayPage({ params }: { params: { n: string } }) {
  const dayNumber = parseInt(params.n, 10)
  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > TOTAL_DAYS) notFound()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ALLOWED_EMAIL) redirect('/dashboard')

  // Check previous day is complete before unlocking this one
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

  // If completed, fetch saved report and all cumulative answered IDs
  let existingReport: string | null = null
  let existingScores: Record<string, number> | null = null
  let allAnsweredIds: string[] = []

  if (session?.completed_at) {
    const [reportRes, answeredRes] = await Promise.all([
      supabase
        .schema('substrata')
        .from('session_reports')
        .select('report_text, scores')
        .eq('session_id', session.id)
        .maybeSingle(),
      supabase
        .schema('substrata')
        .from('question_responses')
        .select('question_id')
        .eq('user_id', user.id),
    ])

    existingReport = reportRes.data?.report_text ?? null
    existingScores = reportRes.data?.scores ?? null
    allAnsweredIds = (answeredRes.data ?? []).map((r: { question_id: string }) => r.question_id)
  }

  const dayQuestionIds = DAY_QUESTIONS[dayNumber]
  const dayQuestions = QUESTIONS.filter(q => dayQuestionIds.includes(q.id))
  const analysisSections = DAY_ANALYSIS_HEADERS[dayNumber]

  return (
    <DayQuestionnaire
      dayNumber={dayNumber}
      userId={user.id}
      questions={dayQuestions}
      analysisSections={analysisSections}
      existingReport={existingReport}
      existingScores={existingScores}
      allAnsweredIds={allAnsweredIds}
    />
  )
}
