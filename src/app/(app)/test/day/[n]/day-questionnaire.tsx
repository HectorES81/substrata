'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Question, Option } from '../../questions'

// ── Types ──────────────────────────────────────────────────────────────────

type Phase = 'questions' | 'analyzing' | 'results'

type Answer = {
  questionId: string
  questionText: string
  answerLabel: string
  value: number
  section: string
  dimension: string
}

type Scores = {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
  attachment_anxiety: number
  attachment_avoidance: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

function avg(...vals: number[]) {
  const v = vals.filter(x => x > 0)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0
}
function rev(val: number) { return val > 0 ? 6 - val : 0 }

function calculateScores(answers: Answer[]): Scores {
  const by: Record<string, number> = {}
  for (const a of answers) by[a.questionId] = a.value
  const g = (id: string) => by[id] ?? 0

  return {
    openness:              avg(g('p1'), g('p2')),
    conscientiousness:     avg(g('p3'), g('p4'), g('p5')),
    extraversion:          avg(g('p6'), g('p7')),
    agreeableness:         avg(g('p8'), g('p9')),
    neuroticism:           avg(g('p10'), g('p11'), g('p12')),
    attachment_anxiety:    avg(g('a1'), g('a2'), g('a3'), g('a4'), g('a5'), g('a11')),
    attachment_avoidance:  avg(g('a7'), g('a8'), g('a9'), g('a10'), rev(g('a6')), rev(g('a13'))),
  }
}

function detectInconsistency(answers: Answer[]): boolean {
  // Longstring: 5+ consecutive identical values
  let streak = 1
  for (let i = 1; i < answers.length; i++) {
    if (answers[i].value === answers[i - 1].value) {
      if (++streak >= 5) return true
    } else {
      streak = 1
    }
  }
  // Section with zero variance (all identical)
  const sections = ['personality', 'attachment', 'values']
  for (const section of sections) {
    const vals = answers.filter(a => a.section === section).map(a => a.value)
    if (vals.length >= 4 && new Set(vals).size === 1) return true
  }
  return false
}

const SECTION_HEADERS = ['CORE PERSONALITY', 'HOW YOU ATTACH', 'WHAT YOU VALUE', 'IN RELATIONSHIPS']

function parseAnalysis(text: string) {
  const result: { header: string; content: string }[] = []
  let currentHeader = ''
  let currentContent = ''
  for (const line of text.split('\n')) {
    if (SECTION_HEADERS.includes(line.trim())) {
      if (currentHeader) result.push({ header: currentHeader, content: currentContent.trim() })
      currentHeader = line.trim()
      currentContent = ''
    } else {
      currentContent += line + '\n'
    }
  }
  if (currentHeader) result.push({ header: currentHeader, content: currentContent.trim() })
  return result
}

// Render inline **bold** markdown
function renderParagraph(text: string, key: number) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return (
    <p key={key} className="text-base leading-relaxed mb-4" style={{ color: 'var(--parchment)' }}>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} style={{ color: '#fff', fontWeight: 600 }}>{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </p>
  )
}

// ── Static data ────────────────────────────────────────────────────────────

const DIMENSION_BARS = [
  { key: 'openness',             label: 'Openness',             low: 'Conventional',  high: 'Open',        group: 'Big Five',   qIds: ['p1','p2'] },
  { key: 'conscientiousness',    label: 'Conscientiousness',    low: 'Spontaneous',   high: 'Structured',  group: 'Big Five',   qIds: ['p3','p4','p5'] },
  { key: 'extraversion',         label: 'Extraversion',         low: 'Introverted',   high: 'Extraverted', group: 'Big Five',   qIds: ['p6','p7'] },
  { key: 'agreeableness',        label: 'Harmony',              low: 'Direct',        high: 'Harmonious',  group: 'Big Five',   qIds: ['p8','p9'] },
  { key: 'neuroticism',          label: 'Emotional Reactivity', low: 'Stable',        high: 'Reactive',    group: 'Big Five',   qIds: ['p10','p11','p12'] },
  { key: 'attachment_anxiety',   label: 'Attachment Anxiety',   low: 'Low',           high: 'High',        group: 'Attachment', qIds: ['a1','a2','a3','a4','a5','a11'] },
  { key: 'attachment_avoidance', label: 'Attachment Avoidance', low: 'Seeking',       high: 'Avoidant',    group: 'Attachment', qIds: ['a6','a7','a8','a9','a10','a13'] },
] as const

const SECTION_ACCENT: Record<string, string> = {
  'CORE PERSONALITY': '#4A4580',
  'HOW YOU ATTACH':   '#C4714A',
  'WHAT YOU VALUE':   '#5A8A5A',
  'IN RELATIONSHIPS': '#9B9693',
}

// ── Score bars ─────────────────────────────────────────────────────────────

function ScoreBars({ scores, answeredIds }: { scores: Scores; answeredIds: Set<string> }) {
  return (
    <div className="mb-10 p-5 rounded-2xl" style={{ background: 'var(--charcoal)' }}>
      <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: 'var(--stone)' }}>
        Dimension Summary
      </p>
      <div className="space-y-5">
        {DIMENSION_BARS.map(d => {
          const score = scores[d.key as keyof Scores]
          const hasData = d.qIds.some(id => answeredIds.has(id))
          const pct = hasData ? Math.round(((score - 1) / 4) * 100) : 0
          return (
            <div key={d.key} style={{ opacity: hasData ? 1 : 0.35 }}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--parchment)' }}>{d.label}</span>
                <span className="text-xs" style={{ color: 'var(--stone)' }}>
                  {hasData ? d.group : `${d.group} · pending`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-20 text-right shrink-0" style={{ color: 'var(--stone)' }}>{d.low}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: '#3D3A36' }}>
                  {hasData && (
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--indigo)' }} />
                  )}
                </div>
                <span className="text-xs w-20 shrink-0" style={{ color: 'var(--stone)' }}>{d.high}</span>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs mt-5 leading-relaxed" style={{ color: 'var(--stone)' }}>
        Bars marked "pending" will fill in as you complete more sessions. These are directional estimates, not clinical assessments.
      </p>
    </div>
  )
}

// ── Results screen ─────────────────────────────────────────────────────────

function ResultsScreen({
  analysis,
  scores,
  answeredIds,
  dayNumber,
  isNewResult,
}: {
  analysis: string
  scores: Scores
  answeredIds: Set<string>
  dayNumber: number
  isNewResult: boolean
}) {
  const sections = parseAnalysis(analysis)
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())
  const hasNextDay = dayNumber < 3

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: 'var(--obsidian)' }}>
      <div className="max-w-prose mx-auto">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--stone)' }}>
            Substrata · Day {dayNumber}
          </p>
          <Link href="/test" className="text-xs" style={{ color: 'var(--stone)', textDecoration: 'none' }}>
            ← All sessions
          </Link>
        </div>
        <h1 className="text-2xl font-semibold mb-10" style={{ color: 'var(--parchment)' }}>
          {isNewResult ? 'Here\'s what your answers reveal.' : 'Your Day ' + dayNumber + ' results.'}
        </h1>

        <ScoreBars scores={scores} answeredIds={answeredIds} />

        {sections.length === 0 ? (
          <p className="text-base leading-relaxed" style={{ color: 'var(--parchment)', whiteSpace: 'pre-wrap' }}>
            {analysis}
          </p>
        ) : (
          sections.map(({ header, content }) => (
            <div key={header} className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 rounded-full" style={{ background: SECTION_ACCENT[header] ?? 'var(--indigo)' }} />
                  <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: SECTION_ACCENT[header] ?? 'var(--indigo)' }}>
                    {header}
                  </h2>
                </div>
                <button
                  onClick={() => setBookmarked(prev => {
                    const next = new Set(prev)
                    next.has(header) ? next.delete(header) : next.add(header)
                    return next
                  })}
                  title={bookmarked.has(header) ? 'Remove from focus' : 'Mark as area to work on'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, opacity: bookmarked.has(header) ? 1 : 0.3 }}
                >
                  {bookmarked.has(header) ? '★' : '☆'}
                </button>
              </div>
              {bookmarked.has(header) && (
                <div className="mb-4 px-4 py-3 rounded-lg text-xs" style={{ background: '#1E1C2E', color: 'var(--sand)', border: '1px solid #2E2A4E' }}>
                  Marked as a focus area. Future sessions will prioritise questions in this dimension.
                </div>
              )}
              {content.split('\n\n').filter(p => p.trim()).map((para, i) => renderParagraph(para.trim(), i))}
            </div>
          ))
        )}

        {/* Science references */}
        {analysis.length > 100 && (
          <div className="mt-6 mb-10 pt-8 border-t" style={{ borderColor: '#2E2B27' }}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--stone)' }}>
              The Science Behind This
            </p>
            <div className="space-y-3">
              {[
                { label: 'Big Five Personality Traits', url: 'https://en.wikipedia.org/wiki/Big_Five_personality_traits', note: 'The academic framework behind Core Personality' },
                { label: 'Attachment Theory (ECR-R)', url: 'https://en.wikipedia.org/wiki/Attachment_theory', note: 'The science behind attachment patterns' },
                { label: "Schwartz's Theory of Basic Values", url: 'https://en.wikipedia.org/wiki/Theory_of_basic_human_values', note: 'The framework behind the Values section' },
              ].map(r => (
                <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="block p-4 rounded-xl"
                  style={{ background: 'var(--charcoal)', textDecoration: 'none' }}>
                  <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--indigo)' }}>{r.label}</p>
                  <p className="text-xs" style={{ color: 'var(--stone)' }}>{r.note}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Next day CTA */}
        {hasNextDay && (
          <div className="mt-8 pt-8 border-t" style={{ borderColor: '#2E2B27' }}>
            <p className="text-sm mb-4" style={{ color: 'var(--parchment)' }}>
              Day {dayNumber + 1} adds {dayNumber === 1 ? 13 : 10} more questions, deepening the picture — without repeating what Day {dayNumber} already found.
            </p>
            <Link
              href={`/test/day/${dayNumber + 1}`}
              className="block w-full py-3 rounded-xl text-sm font-semibold text-center"
              style={{ background: 'var(--indigo)', color: '#fff', textDecoration: 'none' }}
            >
              Continue to Day {dayNumber + 1} →
            </Link>
          </div>
        )}

        {!hasNextDay && (
          <div className="mt-8 pt-8 border-t" style={{ borderColor: '#2E2B27' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--stone)' }}>
              You've completed the three-session baseline. These 3 sessions cover personality, attachment, and values — 3 of 8 planned dimensions. More sections arrive as Substrata grows.
            </p>
          </div>
        )}

        <div className="mt-8">
          <Link href="/test" className="text-sm" style={{ color: 'var(--stone)', textDecoration: 'none' }}>
            ← Back to all sessions
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Analyzing screen ───────────────────────────────────────────────────────

function AnalyzingScreen({ dayNumber }: { dayNumber: number }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--obsidian)' }}>
      <div className="text-center max-w-xs">
        <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-6"
          style={{ borderColor: 'var(--indigo)', borderTopColor: 'transparent' }} />
        <p className="text-base mb-2" style={{ color: 'var(--parchment)' }}>
          {dayNumber === 1 ? 'Analyzing your responses…' : `Building on what Day ${dayNumber - 1} found…`}
        </p>
        <p className="text-sm" style={{ color: 'var(--stone)' }}>This takes about 15 seconds.</p>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function DayQuestionnaire({
  dayNumber,
  userId,
  questions,
  existingReport,
  existingScores,
}: {
  dayNumber: number
  userId: string
  questions: Question[]
  existingReport: string | null
  existingScores: Record<string, number> | null
}) {
  const supabase = useMemo(() => createClient(), [])

  const [phase, setPhase] = useState<Phase>(existingReport ? 'results' : 'questions')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const [analysis, setAnalysis] = useState(existingReport ?? '')
  const [scores, setScores] = useState<Scores>(
    existingScores as Scores ?? {
      openness: 0, conscientiousness: 0, extraversion: 0,
      agreeableness: 0, neuroticism: 0, attachment_anxiety: 0, attachment_avoidance: 0,
    }
  )
  // Tracks all answered question IDs across all sessions (for cumulative score bars)
  const [cumulativeIds, setCumulativeIds] = useState<Set<string>>(
    existingReport
      ? new Set(questions.map(q => q.id))
      : new Set<string>()
  )
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const currentQuestion = questions[currentIdx]
  const progress = (currentIdx / questions.length) * 100
  const prevQuestion = currentIdx > 0 ? questions[currentIdx - 1] : null
  const isSectionStart = !prevQuestion || prevQuestion.section !== currentQuestion?.section

  const answeredIds = useMemo(
    () => phase === 'results' ? cumulativeIds : new Set(answers.map(a => a.questionId)),
    [phase, cumulativeIds, answers]
  )

  const submitAnalysis = useCallback(async (finalAnswers: Answer[]) => {
    setSaveError(null)

    // 1. Upsert session
    const { data: session, error: sessionErr } = await supabase
      .schema('substrata')
      .from('test_sessions')
      .upsert(
        {
          user_id: userId,
          day_number: dayNumber,
          question_ids: finalAnswers.map(a => a.questionId),
          completed_at: new Date().toISOString(),
          consistency_flagged: detectInconsistency(finalAnswers),
        },
        { onConflict: 'user_id,day_number' }
      )
      .select('id')
      .single()

    if (sessionErr || !session) {
      setSaveError('Could not save session. Your analysis will still run, but results won\'t be stored.')
    }

    // 2. Save responses (ignore if session save failed)
    if (session) {
      await supabase.schema('substrata').from('question_responses').insert(
        finalAnswers.map(a => ({
          session_id: session.id,
          user_id: userId,
          question_id: a.questionId,
          question_text: a.questionText,
          answer_value: a.value,
          answer_label: a.answerLabel,
          section: a.section,
          dimension: a.dimension,
        }))
      )
    }

    // 3. Fetch ALL responses across all sessions (for cumulative scores)
    const { data: allPrevResponses } = await supabase
      .schema('substrata')
      .from('question_responses')
      .select('question_id, answer_value, section, dimension')
      .eq('user_id', userId)

    const allAnswersForScoring: Answer[] = [
      // Previous sessions from DB (excludes just-inserted if session save failed)
      ...(allPrevResponses ?? [])
        .filter(r => !finalAnswers.find(a => a.questionId === r.question_id))
        .map(r => ({
          questionId: r.question_id,
          questionText: '',
          answerLabel: '',
          value: r.answer_value,
          section: r.section,
          dimension: r.dimension,
        })),
      ...finalAnswers,
    ]
    const computed = calculateScores(allAnswersForScoring)
    setScores(computed)
    setCumulativeIds(new Set(allAnswersForScoring.map(a => a.questionId)))

    // 4. Fetch previous session reports for progressive analysis
    const { data: prevReports } = await supabase
      .schema('substrata')
      .from('session_reports')
      .select('report_text, day_number')
      .eq('user_id', userId)
      .neq('day_number', dayNumber)
      .order('day_number')

    // 5. Stream analysis from Claude
    setPhase('analyzing')

    const responses = finalAnswers.map(a => ({
      questionText: a.questionText,
      answerLabel: a.answerLabel,
      section: a.section,
    }))

    try {
      const res = await fetch('/api/test-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          dayNumber,
          previousReports: prevReports?.map(r => ({ day: r.day_number, text: r.report_text })),
        }),
      })

      if (!res.ok || !res.body) throw new Error()
      setPhase('results')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setAnalysis(fullText)
      }

      // 6. Save report to DB
      if (session) {
        await supabase.schema('substrata').from('session_reports').insert({
          session_id: session.id,
          user_id: userId,
          day_number: dayNumber,
          report_text: fullText,
          scores: computed,
        })
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setPhase('questions')
    }
  }, [supabase, userId, dayNumber])

  const handleContinue = useCallback(() => {
    if (!selectedOption || !currentQuestion) return

    const answer: Answer = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      answerLabel: selectedOption.label,
      value: selectedOption.value,
      section: currentQuestion.section,
      dimension: currentQuestion.dimension,
    }

    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)
    setSelectedOption(null)

    if (currentIdx === questions.length - 1) {
      submitAnalysis(newAnswers)
    } else {
      setCurrentIdx(currentIdx + 1)
    }
  }, [selectedOption, currentIdx, currentQuestion, answers, questions, submitAnalysis])

  const handleBack = useCallback(() => {
    setError(null)
    if (currentIdx === 0) return
    const prevAnswer = answers[answers.length - 1]
    const prevOption = prevAnswer
      ? questions[currentIdx - 1].options.find(o => o.label === prevAnswer.answerLabel) ?? null
      : null
    setAnswers(prev => prev.slice(0, -1))
    setCurrentIdx(prev => prev - 1)
    setSelectedOption(prevOption)
  }, [currentIdx, answers, questions])

  if (phase === 'analyzing') return <AnalyzingScreen dayNumber={dayNumber} />

  if (phase === 'results') {
    return (
      <ResultsScreen
        analysis={analysis}
        scores={scores}
        answeredIds={answeredIds}
        dayNumber={dayNumber}
        isNewResult={!existingReport}
      />
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--obsidian)' }}>
      {/* Progress bar */}
      <div className="w-full h-0.5" style={{ background: '#2E2B27' }}>
        <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--indigo)' }} />
      </div>

      {/* Header */}
      <div className="px-6 pt-5 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: isSectionStart ? 'var(--indigo)' : 'var(--stone)' }}>
          {currentQuestion.sectionLabel}
        </span>
        <span className="text-xs tabular-nums" style={{ color: 'var(--stone)' }}>
          {currentIdx + 1} / {questions.length}
        </span>
      </div>

      {/* Day label */}
      <div className="px-6 pt-1">
        <span className="text-xs" style={{ color: 'var(--stone)' }}>Day {dayNumber}</span>
      </div>

      {/* Question */}
      <div className="flex-1 px-6 pt-8 pb-4 flex flex-col">
        <p className="text-xl font-medium leading-snug mb-8" style={{ color: 'var(--parchment)', maxWidth: 480 }}>
          {currentQuestion.text}
        </p>

        <div className="space-y-3">
          {currentQuestion.options.map(option => {
            const isSelected = selectedOption?.label === option.label
            return (
              <button
                key={option.label}
                onClick={() => setSelectedOption(option)}
                className="w-full text-left rounded-xl font-medium text-sm transition-colors duration-150"
                style={{
                  background: isSelected ? 'var(--indigo)' : 'var(--charcoal)',
                  color: isSelected ? '#fff' : 'var(--parchment)',
                  border: `1.5px solid ${isSelected ? 'var(--indigo)' : '#3D3A36'}`,
                  padding: '14px 20px',
                  minHeight: 56,
                  cursor: 'pointer',
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        {error && <p className="mt-5 text-sm" style={{ color: 'var(--terracotta)' }}>{error}</p>}
        {saveError && (
          <p className="mt-3 text-xs" style={{ color: 'var(--stone)' }}>{saveError}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 pt-2 flex items-center justify-between gap-4">
        <button
          onClick={handleBack}
          disabled={currentIdx === 0}
          style={{
            background: 'none', border: 'none', cursor: currentIdx === 0 ? 'default' : 'pointer',
            color: currentIdx === 0 ? 'transparent' : 'var(--stone)', fontSize: 14, padding: '8px 0',
          }}
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedOption}
          className="flex-1 py-3 rounded-xl font-semibold text-sm"
          style={{
            background: selectedOption ? 'var(--indigo)' : '#2E2B27',
            color: selectedOption ? '#fff' : 'var(--stone)',
            border: 'none',
            cursor: selectedOption ? 'pointer' : 'not-allowed',
            maxWidth: 240,
            marginLeft: 'auto',
          }}
        >
          {currentIdx === questions.length - 1 ? 'See results →' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
