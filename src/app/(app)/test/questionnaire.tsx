'use client'

import { useState, useCallback } from 'react'
import { QUESTIONS } from './questions'
import type { Option } from './questions'

// ── Types ──────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'questions' | 'analyzing' | 'results'

type Answer = {
  questionId: string
  questionText: string
  answerLabel: string
  value: number
  section: string
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

// ── Static data ────────────────────────────────────────────────────────────

const DIMENSION_BARS = [
  { key: 'openness',             label: 'Openness',               low: 'Conventional',  high: 'Open',       group: 'Big Five' },
  { key: 'conscientiousness',    label: 'Conscientiousness',      low: 'Spontaneous',   high: 'Structured', group: 'Big Five' },
  { key: 'extraversion',         label: 'Extraversion',           low: 'Introverted',   high: 'Extraverted',group: 'Big Five' },
  { key: 'agreeableness',        label: 'Harmony',                low: 'Direct',        high: 'Harmonious', group: 'Big Five' },
  { key: 'neuroticism',          label: 'Emotional Reactivity',   low: 'Stable',        high: 'Reactive',   group: 'Big Five' },
  { key: 'attachment_anxiety',   label: 'Attachment Anxiety',     low: 'Low',           high: 'High',       group: 'Attachment' },
  { key: 'attachment_avoidance', label: 'Attachment Avoidance',   low: 'Seeking',       high: 'Avoidant',   group: 'Attachment' },
] as const

const SECTION_ACCENT: Record<string, string> = {
  'CORE PERSONALITY': '#4A4580',
  'HOW YOU ATTACH':   '#C4714A',
  'WHAT YOU VALUE':   '#5A8A5A',
  'IN RELATIONSHIPS': '#9B9693',
}

const RESOURCES = [
  { label: 'Big Five Personality Traits', url: 'https://en.wikipedia.org/wiki/Big_Five_personality_traits', note: 'The academic framework behind Core Personality' },
  { label: 'Attachment Theory', url: 'https://en.wikipedia.org/wiki/Attachment_theory', note: 'The science behind your attachment patterns' },
  { label: "Schwartz's Theory of Basic Values", url: 'https://en.wikipedia.org/wiki/Theory_of_basic_human_values', note: 'The framework behind the Values section' },
  { label: 'Self-Determination Theory', url: 'https://en.wikipedia.org/wiki/Self-determination_theory', note: 'Why intrinsic motivation and growth matter' },
]

const REFLECTION_QUESTIONS = [
  {
    id: 'r1',
    text: 'How accurately does this analysis describe you?',
    options: ['Not at all', 'Somewhat', 'Mostly', 'Very accurately', 'Perfectly'],
  },
  {
    id: 'r2',
    text: 'Did you encounter a trait or pattern you hadn\'t considered before, but are open to exploring?',
    options: ['Yes, definitely', 'Somewhat', 'Not really — I knew all of this'],
  },
  {
    id: 'r3',
    text: 'How likely are you to continue answering questions to build a fuller profile?',
    options: ['Very unlikely', 'Unlikely', 'Maybe', 'Likely', 'Definitely'],
  },
]

// ── Sub-screens ────────────────────────────────────────────────────────────

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12" style={{ background: 'var(--obsidian)' }}>
      <div className="w-full max-w-sm mx-auto">
        <p className="text-xs font-semibold tracking-widest uppercase mb-8" style={{ color: 'var(--stone)' }}>
          Substrata · UX Test
        </p>
        <h1 className="text-3xl font-semibold leading-tight mb-4" style={{ color: 'var(--parchment)' }}>
          Know yourself.
        </h1>
        <p className="text-base leading-relaxed mb-2" style={{ color: 'var(--sand)' }}>
          38 questions. Three areas: core personality, attachment patterns, and values.
        </p>
        <p className="text-base leading-relaxed mb-10" style={{ color: 'var(--sand)' }}>
          No right answers. Select an option, then tap Continue. You can go back at any point.
        </p>
        <div className="mb-10">
          {[
            { label: 'Core Personality', count: 13 },
            { label: 'Attachment Style', count: 13 },
            { label: 'Values', count: 12 },
          ].map(s => (
            <div key={s.label} className="flex justify-between py-3 border-b" style={{ borderColor: '#2E2B27' }}>
              <span className="text-sm" style={{ color: 'var(--sand)' }}>{s.label}</span>
              <span className="text-xs" style={{ color: 'var(--stone)' }}>{s.count} questions</span>
            </div>
          ))}
        </div>
        <button onClick={onStart} className="w-full py-4 rounded-xl font-semibold text-sm"
          style={{ background: 'var(--indigo)', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Begin
        </button>
      </div>
    </div>
  )
}

function AnalyzingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--obsidian)' }}>
      <div className="text-center max-w-xs">
        <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-6"
          style={{ borderColor: 'var(--indigo)', borderTopColor: 'transparent' }} />
        <p className="text-base mb-2" style={{ color: 'var(--parchment)' }}>Analyzing your responses…</p>
        <p className="text-sm" style={{ color: 'var(--stone)' }}>This takes about 15 seconds.</p>
      </div>
    </div>
  )
}

function ScoreBars({ scores }: { scores: Scores }) {
  return (
    <div className="mb-12 p-5 rounded-2xl" style={{ background: 'var(--charcoal)' }}>
      <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: 'var(--stone)' }}>
        Dimension Summary
      </p>
      <div className="space-y-5">
        {DIMENSION_BARS.map(d => {
          const score = scores[d.key as keyof Scores]
          const pct = Math.round(((score - 1) / 4) * 100)
          return (
            <div key={d.key}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--parchment)' }}>{d.label}</span>
                <span className="text-xs" style={{ color: 'var(--stone)' }}>{d.group}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-20 text-right shrink-0" style={{ color: 'var(--stone)' }}>{d.low}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: '#3D3A36' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--indigo)' }} />
                </div>
                <span className="text-xs w-20 shrink-0" style={{ color: 'var(--stone)' }}>{d.high}</span>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs mt-5 leading-relaxed" style={{ color: 'var(--stone)' }}>
        * Based on {Object.keys(scores).length > 0 ? '38' : '—'} questions across 3 dimensions. These are directional estimates, not clinical assessments. If you are experiencing significant emotional distress, please consult a qualified mental health professional — not this app.
      </p>
    </div>
  )
}

function ReflectionQuestions() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const allAnswered = REFLECTION_QUESTIONS.every(q => answers[q.id])

  if (submitted) {
    return (
      <div className="mt-12 pt-8 border-t text-center" style={{ borderColor: '#2E2B27' }}>
        <p className="text-sm" style={{ color: 'var(--sand)' }}>Thank you. This feedback shapes the product.</p>
      </div>
    )
  }

  return (
    <div className="mt-12 pt-8 border-t" style={{ borderColor: '#2E2B27' }}>
      <p className="text-xs font-semibold tracking-widest uppercase mb-6" style={{ color: 'var(--stone)' }}>
        Your Reaction
      </p>
      <div className="space-y-8">
        {REFLECTION_QUESTIONS.map(q => (
          <div key={q.id}>
            <p className="text-sm mb-3" style={{ color: 'var(--parchment)' }}>{q.text}</p>
            <div className="flex flex-wrap gap-2">
              {q.options.map(opt => {
                const selected = answers[q.id] === opt
                return (
                  <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    className="px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      background: selected ? 'var(--indigo)' : 'var(--charcoal)',
                      color: selected ? '#fff' : 'var(--sand)',
                      border: `1.5px solid ${selected ? 'var(--indigo)' : '#3D3A36'}`,
                      cursor: 'pointer',
                    }}>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <button onClick={() => setSubmitted(true)} disabled={!allAnswered}
          className="w-full py-3 rounded-xl font-semibold text-sm"
          style={{
            background: allAnswered ? 'var(--indigo)' : '#2E2B27',
            color: allAnswered ? '#fff' : 'var(--stone)',
            border: 'none',
            cursor: allAnswered ? 'pointer' : 'not-allowed',
          }}>
          Submit feedback
        </button>
      </div>
    </div>
  )
}

function ResultsScreen({ analysis, scores }: { analysis: string; scores: Scores }) {
  const sections = parseAnalysis(analysis)
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())

  const toggleBookmark = (header: string) =>
    setBookmarked(prev => {
      const next = new Set(prev)
      next.has(header) ? next.delete(header) : next.add(header)
      return next
    })

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: 'var(--obsidian)' }}>
      <div className="max-w-prose mx-auto">
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--stone)' }}>
          Substrata · Your Profile
        </p>
        <h1 className="text-2xl font-semibold mb-10" style={{ color: 'var(--parchment)' }}>
          Here's what your answers reveal.
        </h1>

        {/* Dimension score bars */}
        <ScoreBars scores={scores} />

        {/* AI analysis */}
        {sections.length === 0 ? (
          <p className="text-base leading-relaxed" style={{ color: 'var(--parchment)', whiteSpace: 'pre-wrap' }}>
            {analysis}
          </p>
        ) : (
          sections.map(({ header, content }) => (
            <div key={header} className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 rounded-full" style={{ background: SECTION_ACCENT[header] ?? 'var(--indigo)' }} />
                  <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: SECTION_ACCENT[header] ?? 'var(--indigo)' }}>
                    {header}
                  </h2>
                </div>
                <button
                  onClick={() => toggleBookmark(header)}
                  title={bookmarked.has(header) ? 'Remove from focus areas' : 'Mark as area to work on'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, opacity: bookmarked.has(header) ? 1 : 0.35 }}>
                  {bookmarked.has(header) ? '★' : '☆'}
                </button>
              </div>
              {bookmarked.has(header) && (
                <div className="mb-4 px-4 py-3 rounded-lg text-xs" style={{ background: '#2E2B27', color: 'var(--sand)' }}>
                  Marked as a focus area. Future sessions will include more questions in this dimension.
                </div>
              )}
              {content.split('\n\n').filter(p => p.trim()).map((para, i) => (
                <p key={i} className="text-base leading-relaxed mb-4" style={{ color: 'var(--parchment)' }}>
                  {para.trim()}
                </p>
              ))}
            </div>
          ))
        )}

        {/* Learn more */}
        {analysis.length > 100 && (
          <div className="mt-8 mb-10 pt-8 border-t" style={{ borderColor: '#2E2B27' }}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--stone)' }}>
              The Science Behind This
            </p>
            <div className="space-y-3">
              {RESOURCES.map(r => (
                <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-xl transition-colors"
                  style={{ background: 'var(--charcoal)', textDecoration: 'none' }}>
                  <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--indigo)' }}>{r.label}</p>
                  <p className="text-xs" style={{ color: 'var(--stone)' }}>{r.note}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Reflection questions */}
        {analysis.length > 100 && <ReflectionQuestions />}

        {/* Footer note */}
        <div className="mt-10 pt-8 border-t" style={{ borderColor: '#2E2B27' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--stone)' }}>
            This is a first-pass snapshot based on 38 questions across 3 dimensions. A full Substrata profile covers 8 dimensions over 5+ sessions across 6 weeks, with a confidence score that grows as patterns stabilize over time.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function Questionnaire() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const [analysis, setAnalysis] = useState('')
  const [scores, setScores] = useState<Scores>({ openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0, attachment_anxiety: 0, attachment_avoidance: 0 })
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = QUESTIONS[currentIdx]
  const progress = (currentIdx / QUESTIONS.length) * 100
  const prevQuestion = currentIdx > 0 ? QUESTIONS[currentIdx - 1] : null
  const isSectionStart = !prevQuestion || prevQuestion.section !== currentQuestion.section

  const submitAnalysis = useCallback(async (finalAnswers: Answer[]) => {
    const computed = calculateScores(finalAnswers)
    setScores(computed)
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
        body: JSON.stringify({ responses }),
      })

      if (!res.ok || !res.body) throw new Error()
      setPhase('results')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setAnalysis(text)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setPhase('questions')
    }
  }, [])

  const handleContinue = useCallback(() => {
    if (!selectedOption) return

    const answer: Answer = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      answerLabel: selectedOption.label,
      value: selectedOption.value,
      section: currentQuestion.section,
    }

    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)
    setSelectedOption(null)

    if (currentIdx === QUESTIONS.length - 1) {
      submitAnalysis(newAnswers)
    } else {
      setCurrentIdx(currentIdx + 1)
    }
  }, [selectedOption, currentIdx, currentQuestion, answers, submitAnalysis])

  const handleBack = useCallback(() => {
    setError(null)
    if (currentIdx === 0) {
      setPhase('intro')
      setSelectedOption(null)
      return
    }
    // Restore the previous answer as the selected state so user can see and change it
    const prevAnswer = answers[answers.length - 1]
    const prevOption = prevAnswer
      ? QUESTIONS[currentIdx - 1].options.find(o => o.label === prevAnswer.answerLabel) ?? null
      : null
    setAnswers(prev => prev.slice(0, -1))
    setCurrentIdx(prev => prev - 1)
    setSelectedOption(prevOption)
  }, [currentIdx, answers])

  if (phase === 'intro') return <IntroScreen onStart={() => setPhase('questions')} />
  if (phase === 'analyzing') return <AnalyzingScreen />
  if (phase === 'results') return <ResultsScreen analysis={analysis} scores={scores} />

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
          {currentIdx + 1} / {QUESTIONS.length}
        </span>
      </div>

      {/* Question */}
      <div className="flex-1 px-6 pt-8 pb-4 flex flex-col">
        <p className="text-xl font-medium leading-snug mb-8" style={{ color: 'var(--parchment)', maxWidth: 480 }}>
          {currentQuestion.text}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map(option => {
            const isSelected = selectedOption?.label === option.label
            return (
              <button key={option.label} onClick={() => setSelectedOption(option)}
                className="w-full text-left rounded-xl font-medium text-sm transition-colors duration-150"
                style={{
                  background: isSelected ? 'var(--indigo)' : 'var(--charcoal)',
                  color: isSelected ? '#fff' : 'var(--parchment)',
                  border: `1.5px solid ${isSelected ? 'var(--indigo)' : '#3D3A36'}`,
                  padding: '14px 20px',
                  minHeight: 56,
                  cursor: 'pointer',
                }}>
                {option.label}
              </button>
            )
          })}
        </div>

        {error && <p className="mt-5 text-sm" style={{ color: 'var(--terracotta)' }}>{error}</p>}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 pt-2 flex items-center justify-between gap-4">
        <button onClick={handleBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', fontSize: 14, padding: '8px 0' }}>
          ← Back
        </button>
        <button onClick={handleContinue} disabled={!selectedOption}
          className="flex-1 py-3 rounded-xl font-semibold text-sm transition-opacity"
          style={{
            background: selectedOption ? 'var(--indigo)' : '#2E2B27',
            color: selectedOption ? '#fff' : 'var(--stone)',
            border: 'none',
            cursor: selectedOption ? 'pointer' : 'not-allowed',
            maxWidth: 240,
            marginLeft: 'auto',
          }}>
          {currentIdx === QUESTIONS.length - 1 ? 'See my results →' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
