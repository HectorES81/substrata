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

  // Fetch profile preferences and demographic context
  const { data: profile } = await supabase
    .schema('substrata')
    .from('profiles')
    .select('language_mode, relationship_status, life_focus, age_range, gender_identity, has_kids')
    .eq('id', user.id)
    .maybeSingle()

  const dayQuestionIds = DAY_QUESTIONS[dayNumber]
  const dayQuestions = QUESTIONS.filter(q => dayQuestionIds.includes(q.id))
  const analysisSections = DAY_ANALYSIS_HEADERS[dayNumber]

  // Build demographic context string for AI prompt
  const userContext = profile ? buildUserContext(profile) : null

  return (
    <DayQuestionnaire
      dayNumber={dayNumber}
      userId={user.id}
      questions={dayQuestions}
      analysisSections={analysisSections}
      existingReport={existingReport}
      existingScores={existingScores}
      allAnsweredIds={allAnsweredIds}
      languageMode={(profile?.language_mode as 'plain' | 'direct' | 'clinical') ?? 'direct'}
      userContext={userContext}
    />
  )
}

function buildUserContext(profile: {
  relationship_status?: string | null
  life_focus?: string | null
  age_range?: string | null
  gender_identity?: string | null
  has_kids?: boolean | null
}): string | null {
  const lines: string[] = []

  const statusLabels: Record<string, string> = {
    single_looking:     'Single and looking for a partner',
    single_not_looking: 'Single, not currently looking',
    partnered:          'In a relationship',
    married:            'Married',
    open:               'In an open / ENM relationship',
    complicated:        'Relationship status: complicated',
    prefer_not:         'Relationship status: not specified',
  }
  const focusLabels: Record<string, string> = {
    self_development:    'self-understanding and personal growth',
    finding_partner:     'finding the right partner',
    relationship_growth: 'growing within their current relationship',
    career:              'career and personal goals',
    other:               'personal goals (unspecified)',
  }

  if (profile.relationship_status) lines.push(`Relationship status: ${statusLabels[profile.relationship_status] ?? profile.relationship_status}`)
  if (profile.life_focus)         lines.push(`Primary focus: ${focusLabels[profile.life_focus] ?? profile.life_focus}`)
  if (profile.age_range)          lines.push(`Age range: ${profile.age_range}`)
  if (profile.gender_identity)    lines.push(`Gender identity: ${profile.gender_identity}`)
  if (profile.has_kids != null)   lines.push(`Has children: ${profile.has_kids ? 'Yes' : 'No'}`)

  if (lines.length === 0) return null

  return lines.join('\n')
}
