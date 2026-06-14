'use client'

import { useState, useCallback } from 'react'
import { QUESTIONS } from './questions'
import type { Option } from './questions'

type Phase = 'intro' | 'questions' | 'analyzing' | 'results'

type Answer = {
  questionId: string
  questionText: string
  answerLabel: string
  value: number
  section: string
}

const SECTION_HEADERS = ['CORE PERSONALITY', 'HOW YOU ATTACH', 'WHAT YOU VALUE', 'IN RELATIONSHIPS']

const SECTION_ACCENT: Record<string, string> = {
  'CORE PERSONALITY': '#4A4580',
  'HOW YOU ATTACH': '#C4714A',
  'WHAT YOU VALUE': '#5A8A5A',
  'IN RELATIONSHIPS': '#9B9693',
}

function parseAnalysis(text: string): { header: string; content: string }[] {
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

// ── Intro ──────────────────────────────────────────────────────────────────

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
          No right answers. Most people finish in 10–15 minutes.
        </p>

        <div className="space-y-2 mb-10">
          {[
            { label: 'Core Personality', count: 13 },
            { label: 'Attachment Style', count: 13 },
            { label: 'Values', count: 12 },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-3 border-b" style={{ borderColor: '#2E2B27' }}>
              <span className="text-sm" style={{ color: 'var(--sand)' }}>{s.label}</span>
              <span className="text-xs" style={{ color: 'var(--stone)' }}>{s.count} questions</span>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="w-full py-4 rounded-xl font-semibold text-sm"
          style={{ background: 'var(--indigo)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Begin
        </button>
      </div>
    </div>
  )
}

// ── Analyzing ──────────────────────────────────────────────────────────────

function AnalyzingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--obsidian)' }}>
      <div className="text-center max-w-xs">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-6"
          style={{ borderColor: 'var(--indigo)', borderTopColor: 'transparent' }}
        />
        <p className="text-base mb-2" style={{ color: 'var(--parchment)' }}>Analyzing your responses…</p>
        <p className="text-sm" style={{ color: 'var(--stone)' }}>This takes about 15 seconds.</p>
      </div>
    </div>
  )
}

// ── Results ────────────────────────────────────────────────────────────────

function ResultsScreen({ analysis }: { analysis: string }) {
  const sections = parseAnalysis(analysis)

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: 'var(--obsidian)' }}>
      <div className="max-w-prose mx-auto">
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--stone)' }}>
          Substrata · Your Profile
        </p>
        <h1 className="text-2xl font-semibold mb-10" style={{ color: 'var(--parchment)' }}>
          Here's what your answers reveal.
        </h1>

        {sections.length === 0 ? (
          <p className="text-base leading-relaxed" style={{ color: 'var(--parchment)', whiteSpace: 'pre-wrap' }}>
            {analysis}
          </p>
        ) : (
          sections.map(({ header, content }) => (
            <div key={header} className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-5 rounded-full" style={{ background: SECTION_ACCENT[header] ?? 'var(--indigo)' }} />
                <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: SECTION_ACCENT[header] ?? 'var(--indigo)' }}>
                  {header}
                </h2>
              </div>
              {content.split('\n\n').filter(p => p.trim()).map((para, i) => (
                <p key={i} className="text-base leading-relaxed mb-4" style={{ color: 'var(--parchment)' }}>
                  {para.trim()}
                </p>
              ))}
            </div>
          ))
        )}

        {analysis.length > 0 && (
          <div className="mt-8 pt-8 border-t" style={{ borderColor: '#2E2B27' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--stone)' }}>
              This is a first-pass snapshot based on 38 questions across 3 dimensions. A full Substrata profile covers 8 dimensions across 5+ sessions over 6 weeks, with a confidence score that grows as patterns stabilize over time.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main questionnaire ─────────────────────────────────────────────────────

export default function Questionnaire() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState('')
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = QUESTIONS[currentIdx]
  const progress = (currentIdx / QUESTIONS.length) * 100

  const submitAnalysis = async (finalAnswers: Answer[]) => {
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

      if (!res.ok || !res.body) throw new Error('Analysis request failed')

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
  }

  const handleSelectOption = useCallback((option: Option) => {
    if (selectedLabel !== null) return

    setSelectedLabel(option.label)

    setTimeout(() => {
      const answer: Answer = {
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        answerLabel: option.label,
        value: option.value,
        section: currentQuestion.section,
      }

      const newAnswers = [...answers, answer]
      setAnswers(newAnswers)
      setSelectedLabel(null)

      if (currentIdx === QUESTIONS.length - 1) {
        submitAnalysis(newAnswers)
      } else {
        setCurrentIdx(currentIdx + 1)
      }
    }, 320)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLabel, currentIdx, currentQuestion, answers])

  const handleBack = () => {
    if (currentIdx === 0) {
      setPhase('intro')
      return
    }
    setAnswers(prev => prev.slice(0, -1))
    setCurrentIdx(prev => prev - 1)
    setSelectedLabel(null)
    setError(null)
  }

  if (phase === 'intro') return <IntroScreen onStart={() => setPhase('questions')} />
  if (phase === 'analyzing') return <AnalyzingScreen />
  if (phase === 'results') return <ResultsScreen analysis={analysis} />

  // Section transition visual — show a subtle divider when crossing section
  const prevQuestion = currentIdx > 0 ? QUESTIONS[currentIdx - 1] : null
  const isSectionStart = !prevQuestion || prevQuestion.section !== currentQuestion.section

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--obsidian)' }}>

      {/* Progress bar */}
      <div className="w-full h-0.5" style={{ background: '#2E2B27' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: 'var(--indigo)' }}
        />
      </div>

      {/* Header */}
      <div className="px-6 pt-5 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: isSectionStart ? 'var(--indigo)' : 'var(--stone)' }}>
          {currentQuestion.sectionLabel}
        </span>
        <span className="text-xs tabular-nums" style={{ color: 'var(--stone)' }}>
          {currentIdx + 1} / {QUESTIONS.length}
        </span>
      </div>

      {/* Question + options */}
      <div className="flex-1 px-6 pt-8 pb-4 flex flex-col">
        <p className="text-xl font-medium leading-snug mb-8" style={{ color: 'var(--parchment)', maxWidth: 480 }}>
          {currentQuestion.text}
        </p>

        <div className="space-y-3 flex-1">
          {currentQuestion.options.map(option => {
            const isSelected = selectedLabel === option.label
            return (
              <button
                key={option.label}
                onClick={() => handleSelectOption(option)}
                disabled={selectedLabel !== null}
                className="w-full text-left px-5 rounded-xl font-medium text-sm transition-colors duration-150"
                style={{
                  background: isSelected ? 'var(--indigo)' : 'var(--charcoal)',
                  color: isSelected ? '#fff' : 'var(--parchment)',
                  border: `1.5px solid ${isSelected ? 'var(--indigo)' : '#3D3A36'}`,
                  minHeight: 56,
                  padding: '14px 20px',
                  cursor: selectedLabel !== null ? 'default' : 'pointer',
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        {error && (
          <p className="mt-5 text-sm" style={{ color: 'var(--terracotta)' }}>
            {error}
          </p>
        )}
      </div>

      {/* Back */}
      <div className="px-6 pb-8 pt-2">
        <button
          onClick={handleBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', fontSize: 14 }}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
