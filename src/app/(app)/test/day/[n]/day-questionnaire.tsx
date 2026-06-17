'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Question, Option } from '../../questions'

// ── Types ──────────────────────────────────────────────────────────────────

type Phase = 'questions' | 'analyzing' | 'results'
type LanguageMode = 'plain' | 'direct' | 'clinical'

const LANGUAGE_LABELS: Record<LanguageMode, { label: string; desc: string }> = {
  plain:    { label: 'Plain',    desc: 'Everyday language, no jargon' },
  direct:   { label: 'Direct',   desc: 'Clear and precise' },
  clinical: { label: 'Clinical', desc: 'Academic terminology' },
}

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
  let streak = 1
  for (let i = 1; i < answers.length; i++) {
    if (answers[i].value === answers[i - 1].value) {
      if (++streak >= 5) return true
    } else {
      streak = 1
    }
  }
  const sections = Array.from(new Set(answers.map(a => a.section)))
  for (const section of sections) {
    const vals = answers.filter(a => a.section === section).map(a => a.value)
    if (vals.length >= 4 && new Set(vals).size === 1) return true
  }
  return false
}

// Detect analysis section headers: all-caps, 2+ words, 8+ chars
function isAnalysisHeader(line: string): boolean {
  const t = line.trim()
  if (t.length < 8) return false
  if (!/^[A-Z][A-Z\s&]+$/.test(t)) return false
  return t.split(/\s+/).length >= 2
}

function parseAnalysis(text: string) {
  const result: { header: string; content: string }[] = []
  let currentHeader = ''
  let currentContent = ''
  for (const line of text.split('\n')) {
    if (isAnalysisHeader(line)) {
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
  { key: 'openness',             label: 'Openness',             low: 'Conventional',  high: 'Open',        group: 'Big Five',   qIds: ['p1','p2'],                              colorLow: '#6B5E8A', colorHigh: '#4A4580' },
  { key: 'conscientiousness',    label: 'Conscientiousness',    low: 'Spontaneous',   high: 'Structured',  group: 'Big Five',   qIds: ['p3','p4','p5'],                         colorLow: '#7A6A5A', colorHigh: '#5A6A7A' },
  { key: 'extraversion',         label: 'Extraversion',         low: 'Introverted',   high: 'Extraverted', group: 'Big Five',   qIds: ['p6','p7'],                              colorLow: '#5A7A6A', colorHigh: '#C4714A' },
  { key: 'agreeableness',        label: 'Harmony',              low: 'Direct',        high: 'Harmonious',  group: 'Big Five',   qIds: ['p8','p9'],                              colorLow: '#8A5A5A', colorHigh: '#5A8A5A' },
  { key: 'neuroticism',          label: 'Emotional Reactivity', low: 'Stable',        high: 'Reactive',    group: 'Big Five',   qIds: ['p10','p11','p12'],                      colorLow: '#5A8A6A', colorHigh: '#A85C5C' },
  { key: 'attachment_anxiety',   label: 'Attachment Anxiety',   low: 'Secure',        high: 'Anxious',     group: 'Attachment', qIds: ['a1','a2','a3','a4','a5','a11'],         colorLow: '#5A8A6A', colorHigh: '#C4714A' },
  { key: 'attachment_avoidance', label: 'Attachment Avoidance', low: 'Seeking',       high: 'Avoidant',    group: 'Attachment', qIds: ['a6','a7','a8','a9','a10','a13'],        colorLow: '#5A7A9A', colorHigh: '#8A5A7A' },
] as const

// Color accent per analysis section header
const SECTION_ACCENT: Record<string, string> = {
  // Days 1–3
  'CORE PERSONALITY':             '#4A4580',
  'HOW YOU ATTACH':               '#C4714A',
  'WHAT YOU VALUE':               '#5A8A5A',
  'IN RELATIONSHIPS':             '#9B9693',
  // Day 4 – Conflict
  'HOW YOU HANDLE CONFLICT':      '#A85C5C',
  'UNDER PRESSURE':               '#C4714A',
  'REPAIR AND RECONNECTION':      '#5A8A7A',
  // Day 5 – EQ
  'YOUR EMOTIONAL WORLD':         '#7A5A9A',
  'EMOTIONAL REGULATION':         '#5A6A8A',
  'EMPATHY AND ATTUNEMENT':       '#9A7A5A',
  // Day 6 – Life
  'HOW YOU STRUCTURE YOUR LIFE':  '#5A6A7A',
  'WORK AND IDENTITY':            '#7A8A5A',
  'YOUR AMBITIONS':               '#4A7A6A',
  // Day 7 – Physical
  'YOUR BODY AND HEALTH':         '#5A8A6A',
  'PHYSICAL PATTERNS':            '#6A8A5A',
  'EMBODIMENT':                   '#8A7A5A',
  // Day 8 – Moral
  'YOUR MORAL FOUNDATIONS':       '#8A5A5A',
  'WHAT YOU STAND FOR':           '#5A7A5A',
  'ETHICS IN RELATIONSHIP':       '#5A6A7A',
}

// ── Score bars ─────────────────────────────────────────────────────────────

function ScoreBars({ scores, answeredIds }: { scores: Scores; answeredIds: Set<string> }) {
  return (
    <div className="mb-10 p-5 rounded-2xl" style={{ background: 'var(--charcoal)' }}>
      <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--stone)' }}>
        Personality Dimensions
      </p>
      <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--stone)', opacity: 0.7 }}>
        Marker position shows where you lean. Closer to either edge means stronger signal in that direction. Centre is neutral.
      </p>
      <div className="space-y-6">
        {DIMENSION_BARS.map(d => {
          const score = scores[d.key as keyof Scores]
          const hasData = d.qIds.some(id => answeredIds.has(id))
          // Score 1–5 → 0–100%. Score 3 = neutral = 50% (centre).
          const pct = hasData ? Math.round(((score - 1) / 4) * 100) : 50
          // Marker colour tracks which end it's closer to
          const markerColor = hasData
            ? (pct < 50 ? d.colorLow : d.colorHigh)
            : 'transparent'

          return (
            <div key={d.key} style={{ opacity: hasData ? 1 : 0.25 }}>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--parchment)' }}>{d.label}</span>
                <span className="text-xs" style={{ color: 'var(--stone)' }}>
                  {hasData ? d.group : `${d.group} · pending`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-20 text-right shrink-0" style={{ color: 'var(--stone)' }}>{d.low}</span>
                {/* Gradient bar: full colour at edges, neutral at centre */}
                <div className="flex-1 relative" style={{ height: 6 }}>
                  <div className="absolute inset-0 rounded-full" style={{
                    background: `linear-gradient(to right, ${d.colorLow}, rgba(61,58,54,0.3) 50%, ${d.colorHigh})`,
                  }} />
                  {/* Marker dot */}
                  {hasData && (
                    <div style={{
                      position: 'absolute',
                      left: `${pct}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: markerColor,
                      border: '2.5px solid var(--obsidian)',
                      boxShadow: `0 0 0 1.5px ${markerColor}`,
                      transition: 'left 0.5s ease',
                    }} />
                  )}
                </div>
                <span className="text-xs w-20 shrink-0" style={{ color: 'var(--stone)' }}>{d.high}</span>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs mt-6 leading-relaxed" style={{ color: 'var(--stone)', opacity: 0.6 }}>
        Big Five and Attachment update as you answer. Other frameworks (conflict style, values, moral foundations) appear in the written analysis.
      </p>
    </div>
  )
}

// ── Section annotation (Add context) ──────────────────────────────────────

function SectionAnnotation({
  header, dayNumber, userId, supabase,
}: {
  header: string
  dayNumber: number
  userId: string
  supabase: ReturnType<typeof createClient>
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .schema('substrata')
      .from('section_annotations')
      .select('annotation')
      .eq('user_id', userId)
      .eq('day_number', dayNumber)
      .eq('section', header)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.annotation) {
          setText(data.annotation)
          setSaved(true)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    if (!text.trim()) return
    setSaving(true)
    await supabase
      .schema('substrata')
      .from('section_annotations')
      .upsert(
        { user_id: userId, day_number: dayNumber, section: header, annotation: text.trim(), updated_at: new Date().toISOString() },
        { onConflict: 'user_id,day_number,section' }
      )
    setSaved(true)
    setSaving(false)
    setOpen(false)
  }

  return (
    <div className="mt-4 mb-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{
            background: saved ? '#1A2A1A' : '#1E1C2E',
            color: saved ? '#5A9A5A' : 'var(--stone)',
            border: `1px solid ${saved ? '#2E5A2E' : '#2E2A4E'}`,
            cursor: 'pointer',
          }}
        >
          {saved ? '✓ Context added' : '+ Add context'}
        </button>
      ) : (
        <div className="p-4 rounded-xl" style={{ background: '#1E1C2E', border: '1px solid #2E2A4E' }}>
          <p className="text-xs mb-2 leading-relaxed" style={{ color: 'var(--stone)' }}>
            The AI misread something here? Add context — it will inform future sessions.
          </p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="e.g. I answered that way because I got lucky — not by design. My situation is a net positive."
            rows={3}
            className="w-full text-sm rounded-lg px-3 py-2.5 mb-3 resize-none"
            style={{
              background: 'var(--charcoal)',
              color: 'var(--parchment)',
              border: '1px solid #3D3A36',
              outline: 'none',
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !text.trim()}
              className="px-4 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: text.trim() ? 'var(--indigo)' : '#2E2B27',
                color: text.trim() ? '#fff' : 'var(--stone)',
                border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-1.5 rounded-lg text-xs"
              style={{ background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Highlight system ───────────────────────────────────────────────────────

type ActiveSelection = { text: string; rect: DOMRect; section: string }

// Bottom-anchored action bar that appears on text selection.
// Fixed to the viewport bottom so it never conflicts with the browser's
// native context menu (which appears near the selection on mobile).
function HighlightPopover({
  selection, onSaveNote, onAddContext, onGoDeeper, onDismiss,
}: {
  selection: ActiveSelection
  onSaveNote: () => void
  onAddContext: () => void
  onGoDeeper: () => void
  onDismiss: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [onDismiss])

  const snippet = selection.text.length > 55
    ? selection.text.slice(0, 55) + '…'
    : selection.text

  const btn = (label: string, onClick: () => void, accent?: string) => (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      style={{
        flex: 1, background: 'none',
        border: '1px solid #3D3A5E', borderRadius: 10,
        cursor: 'pointer',
        color: accent ?? 'var(--parchment)',
        fontSize: 13, fontWeight: 500, padding: '10px 8px',
      }}
    >
      {label}
    </button>
  )

  return (
    <div ref={ref} style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: '#0E0C1A',
      borderTop: '1px solid #3D3A5E',
      padding: '12px 16px calc(20px + env(safe-area-inset-bottom, 0px))',
      boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{
        color: 'var(--stone)', fontSize: 11, marginBottom: 10,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontStyle: 'italic',
      }}>
        "{snippet}"
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        {btn('Save note', onSaveNote)}
        {btn('Add context', onAddContext)}
        {btn('Go deeper →', onGoDeeper, 'var(--indigo)')}
      </div>
    </div>
  )
}

// Modal for Save note / Add context actions
function HighlightModal({
  type, text, onSave, onClose,
}: {
  type: 'note' | 'context'
  text: string
  onSave: (value: string) => Promise<void>
  onClose: () => void
}) {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const isNote = type === 'note'

  async function handleSave() {
    if (!value.trim()) return
    setSaving(true)
    await onSave(value.trim())
    setSaving(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1001,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#0E0C1A', borderRadius: 16,
        border: '1px solid #3D3A5E',
        padding: 24, width: '100%', maxWidth: 440,
      }}>
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--stone)' }}>
          {isNote ? 'Save note' : 'Add context'}
        </p>
        {/* Quoted highlight */}
        <p className="text-xs leading-relaxed mb-4 px-3 py-2 rounded-lg" style={{
          color: 'var(--stone)', background: '#1A1830',
          borderLeft: '2px solid #4A4580', fontStyle: 'italic',
        }}>
          "{text.length > 140 ? text.slice(0, 140) + '…' : text}"
        </p>
        <p className="text-xs mb-3" style={{ color: 'var(--stone)' }}>
          {isNote
            ? 'Your personal reflection. Not shared with anyone.'
            : 'Tell the AI what it missed or misread. This will inform future sessions.'}
        </p>
        <textarea
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={isNote
            ? 'This resonated because…'
            : 'e.g. I answered that way because I got lucky — my situation is actually a net positive.'}
          rows={4}
          className="w-full text-sm rounded-lg px-3 py-2.5 mb-4 resize-none"
          style={{
            background: 'var(--charcoal)', color: 'var(--parchment)',
            border: '1px solid #3D3A36', outline: 'none',
          }}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !value.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: value.trim() ? 'var(--indigo)' : '#2E2B27',
              color: value.trim() ? '#fff' : 'var(--stone)',
              border: 'none', cursor: value.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm"
            style={{ background: 'none', border: '1px solid #3D3A36', color: 'var(--stone)', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Bottom panel for "Go deeper" concept exploration
function ConceptPanel({
  text, section, onClose,
}: {
  text: string
  section: string
  onClose: () => void
}) {
  const [concept, setConcept] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/highlight-concept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, section }),
    })
      .then(r => r.json())
      .then(data => {
        setConcept(data.concept)
        setExplanation(data.explanation)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [text, section])

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: '#0E0C1A', borderTop: '1px solid #3D3A5E',
      padding: '20px 24px 28px',
      maxHeight: '50vh', overflow: 'auto',
    }}>
      <div className="max-w-prose mx-auto">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--stone)' }}>
            Concept
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>
            ×
          </button>
        </div>
        {/* Quote */}
        <p className="text-xs leading-relaxed mb-4 px-3 py-2 rounded-lg" style={{
          color: 'var(--stone)', background: '#1A1830',
          borderLeft: '2px solid #4A4580', fontStyle: 'italic',
        }}>
          "{text.length > 120 ? text.slice(0, 120) + '…' : text}"
        </p>
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--indigo)', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: 'var(--stone)' }}>Identifying concept…</p>
          </div>
        )}
        {error && <p className="text-sm" style={{ color: 'var(--stone)' }}>Could not identify concept. Try again.</p>}
        {!loading && !error && (
          <>
            <p className="text-base font-semibold mb-2" style={{ color: 'var(--parchment)' }}>{concept}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--stone)' }}>{explanation}</p>
          </>
        )}
      </div>
    </div>
  )
}

// ── Results screen ─────────────────────────────────────────────────────────

function ResultsScreen({
  analysis, scores, answeredIds, dayNumber, isNewResult, savedToDb, saveError,
  languageMode, onLanguageModeChange, userId, supabase,
}: {
  analysis: string
  scores: Scores
  answeredIds: Set<string>
  dayNumber: number
  isNewResult: boolean
  savedToDb: boolean
  saveError: string | null
  languageMode: LanguageMode
  onLanguageModeChange: (mode: LanguageMode) => void
  userId: string
  supabase: ReturnType<typeof createClient>
}) {
  const sections = parseAnalysis(analysis)
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())

  // Highlight system state
  const [activeSelection, setActiveSelection] = useState<ActiveSelection | null>(null)
  const [highlightModal, setHighlightModal] = useState<{ type: 'note' | 'context'; selection: ActiveSelection } | null>(null)
  const [conceptPanel, setConceptPanel] = useState<{ text: string; section: string } | null>(null)

  function handleSectionMouseUp(header: string) {
    setTimeout(() => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) return
      const text = sel.toString().trim()
      if (text.length < 15) return
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setActiveSelection({ text, rect, section: header })
    }, 0)
  }

  async function saveHighlight(
    selection: ActiveSelection,
    fields: { note?: string; context?: string; concept_name?: string; concept_text?: string }
  ) {
    await supabase.schema('substrata').from('highlights').insert({
      user_id: userId,
      day_number: dayNumber,
      section: selection.section,
      text: selection.text,
      ...fields,
    })
  }

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
        <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--parchment)' }}>
          {isNewResult ? 'Here\'s what your answers reveal.' : `Your Day ${dayNumber} results.`}
        </h1>

        {/* Language mode selector */}
        <div className="mb-8 flex items-center gap-2">
          <span className="text-xs shrink-0" style={{ color: 'var(--stone)' }}>Reading mode</span>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--charcoal)' }}>
            {(Object.keys(LANGUAGE_LABELS) as LanguageMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => onLanguageModeChange(mode)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: languageMode === mode ? 'var(--indigo)' : 'transparent',
                  color: languageMode === mode ? '#fff' : 'var(--stone)',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title={LANGUAGE_LABELS[mode].desc}
              >
                {LANGUAGE_LABELS[mode].label}
              </button>
            ))}
          </div>
          {languageMode !== 'direct' && (
            <span className="text-xs" style={{ color: 'var(--stone)', opacity: 0.6 }}>
              Next session will use this mode
            </span>
          )}
        </div>

        {/* Save warning banner — only shown when DB write failed */}
        {!savedToDb && saveError && (
          <div className="mb-8 px-4 py-3 rounded-xl text-sm leading-relaxed"
            style={{ background: '#2E1A1A', color: '#C47A5A', border: '1px solid #5A2E2E' }}>
            <strong style={{ color: '#E08060' }}>Results not saved.</strong>{' '}
            {saveError}
          </div>
        )}

        <ScoreBars scores={scores} answeredIds={answeredIds} />

        {sections.length === 0 ? (
          <p className="text-base leading-relaxed" style={{ color: 'var(--parchment)', whiteSpace: 'pre-wrap' }}>
            {analysis}
          </p>
        ) : sections.map(({ header, content }) => {
          const accent = SECTION_ACCENT[header] ?? 'var(--indigo)'
          return (
            <div key={header} className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 rounded-full" style={{ background: accent }} />
                  <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: accent }}>
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
              {/* Selectable content area */}
              <div
                onMouseUp={() => handleSectionMouseUp(header)}
                onTouchEnd={() => handleSectionMouseUp(header)}
                style={{ cursor: 'text' }}
              >
                {content.split('\n\n').filter(p => p.trim()).map((para, i) => renderParagraph(para.trim(), i))}
              </div>
              <SectionAnnotation
                header={header}
                dayNumber={dayNumber}
                userId={userId}
                supabase={supabase}
              />
            </div>
          )
        })}

        {/* Learn more — science links */}
        {analysis.length > 100 && dayNumber <= 3 && (
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
                  className="block p-4 rounded-xl" style={{ background: 'var(--charcoal)', textDecoration: 'none' }}>
                  <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--indigo)' }}>{r.label}</p>
                  <p className="text-xs" style={{ color: 'var(--stone)' }}>{r.note}</p>
                </a>
              ))}
            </div>
          </div>
        )}
        {analysis.length > 100 && dayNumber === 4 && (
          <div className="mt-6 mb-10 pt-8 border-t" style={{ borderColor: '#2E2B27' }}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--stone)' }}>
              The Science Behind This
            </p>
            <a href="https://en.wikipedia.org/wiki/John_Gottman" target="_blank" rel="noopener noreferrer"
              className="block p-4 rounded-xl" style={{ background: 'var(--charcoal)', textDecoration: 'none' }}>
              <p className="text-sm font-medium mb-0.5" style={{ color: '#A85C5C' }}>Gottman's Four Horsemen</p>
              <p className="text-xs" style={{ color: 'var(--stone)' }}>The research framework behind conflict patterns and repair</p>
            </a>
          </div>
        )}
        {analysis.length > 100 && dayNumber === 8 && (
          <div className="mt-6 mb-10 pt-8 border-t" style={{ borderColor: '#2E2B27' }}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--stone)' }}>
              The Science Behind This
            </p>
            <a href="https://en.wikipedia.org/wiki/Moral_foundations_theory" target="_blank" rel="noopener noreferrer"
              className="block p-4 rounded-xl" style={{ background: 'var(--charcoal)', textDecoration: 'none' }}>
              <p className="text-sm font-medium mb-0.5" style={{ color: '#8A5A5A' }}>Moral Foundations Theory</p>
              <p className="text-xs" style={{ color: 'var(--stone)' }}>Haidt's framework for the six foundations of morality</p>
            </a>
          </div>
        )}

        {/* Next day CTA */}
        {dayNumber < 8 && (
          <div className="mt-8 pt-8 border-t" style={{ borderColor: '#2E2B27' }}>
            <p className="text-sm mb-4" style={{ color: 'var(--parchment)' }}>
              Day {dayNumber + 1} explores a new dimension without repeating what Day {dayNumber} already found.
            </p>
            {savedToDb ? (
              <Link href={`/test/day/${dayNumber + 1}`}
                className="block w-full py-3 rounded-xl text-sm font-semibold text-center"
                style={{ background: 'var(--indigo)', color: '#fff', textDecoration: 'none' }}>
                Continue to Day {dayNumber + 1} →
              </Link>
            ) : (
              <div className="w-full py-3 rounded-xl text-sm font-semibold text-center"
                style={{ background: '#2E2B27', color: 'var(--stone)', cursor: 'not-allowed' }}>
                Results must save before continuing
              </div>
            )}
          </div>
        )}
        {dayNumber === 8 && (
          <div className="mt-8 pt-8 border-t" style={{ borderColor: '#2E2B27' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--stone)' }}>
              You've completed all 8 sessions — 96 questions across every major dimension. This is your baseline profile. As Substrata grows, more question versions and sections will deepen the picture further.
            </p>
          </div>
        )}

        <div className="mt-8">
          <Link href="/test" className="text-sm" style={{ color: 'var(--stone)', textDecoration: 'none' }}>
            ← Back to all sessions
          </Link>
        </div>
      </div>

      {/* Highlight popover — appears on text selection */}
      {activeSelection && !highlightModal && !conceptPanel && (
        <HighlightPopover
          selection={activeSelection}
          onDismiss={() => setActiveSelection(null)}
          onSaveNote={() => setHighlightModal({ type: 'note', selection: activeSelection })}
          onAddContext={() => setHighlightModal({ type: 'context', selection: activeSelection })}
          onGoDeeper={() => {
            setConceptPanel({ text: activeSelection.text, section: activeSelection.section })
            setActiveSelection(null)
            window.getSelection()?.removeAllRanges()
          }}
        />
      )}

      {/* Save note / Add context modal */}
      {highlightModal && (
        <HighlightModal
          type={highlightModal.type}
          text={highlightModal.selection.text}
          onClose={() => { setHighlightModal(null); setActiveSelection(null) }}
          onSave={async value => {
            const field = highlightModal.type === 'note' ? { note: value } : { context: value }
            await saveHighlight(highlightModal.selection, field)
          }}
        />
      )}

      {/* Go deeper — concept panel */}
      {conceptPanel && (
        <ConceptPanel
          text={conceptPanel.text}
          section={conceptPanel.section}
          onClose={() => setConceptPanel(null)}
        />
      )}
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
          {dayNumber === 1 ? 'Analyzing your responses…' : `Building on Session ${dayNumber - 1}…`}
        </p>
        <p className="text-sm" style={{ color: 'var(--stone)' }}>About 15 seconds.</p>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function DayQuestionnaire({
  dayNumber,
  userId,
  questions,
  analysisSections,
  existingReport,
  existingScores,
  allAnsweredIds,
  languageMode: initialLanguageMode,
  userContext,
}: {
  dayNumber: number
  userId: string
  questions: Question[]
  analysisSections: string[]
  existingReport: string | null
  existingScores: Record<string, number> | null
  allAnsweredIds: string[]
  languageMode: LanguageMode
  userContext: string | null
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
  const [cumulativeIds, setCumulativeIds] = useState<Set<string>>(
    existingReport ? new Set(allAnsweredIds) : new Set<string>()
  )
  const [savedToDb, setSavedToDb] = useState(!!existingReport)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [languageMode, setLanguageMode] = useState<LanguageMode>(initialLanguageMode)

  const handleLanguageModeChange = useCallback(async (mode: LanguageMode) => {
    setLanguageMode(mode)
    // Upsert profile with new language mode
    await supabase
      .schema('substrata')
      .from('profiles')
      .upsert({ id: userId, language_mode: mode }, { onConflict: 'id' })
  }, [supabase, userId])

  const currentQuestion = questions[currentIdx]
  const progress = (currentIdx / questions.length) * 100
  const prevQuestion = currentIdx > 0 ? questions[currentIdx - 1] : null
  const isSectionStart = !prevQuestion || prevQuestion.section !== currentQuestion?.section

  const answeredIds = useMemo(
    () => phase === 'results' ? cumulativeIds : new Set(answers.map(a => a.questionId)),
    [phase, cumulativeIds, answers]
  )

  const submitAnalysis = useCallback(async (finalAnswers: Answer[], currentLanguageMode: LanguageMode = languageMode) => {
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
      const isMissing = sessionErr?.message?.includes('does not exist') || sessionErr?.code === '42P01'
      setSaveError(
        isMissing
          ? 'Database tables not set up yet. Run migration 002 in Supabase SQL Editor, then retry.'
          : 'Could not save session. Your analysis will appear below but results won\'t persist.'
      )
    }

    // 2. Save question responses (non-blocking — failures logged silently)
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

    // 3. Fetch all previous responses (for cumulative scores + tracked IDs)
    const { data: allPrevResponses } = await supabase
      .schema('substrata')
      .from('question_responses')
      .select('question_id, answer_value, section, dimension')
      .eq('user_id', userId)

    const allAnswersForScoring: Answer[] = [
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
          analysisSections,
          previousReports: prevReports?.map(r => ({ day: r.day_number, text: r.report_text })),
          languageMode: currentLanguageMode,
          userContext,
        }),
      })

      if (res.status === 402) throw new Error('token_limit')
      if (!res.ok || !res.body) throw new Error('Analysis request failed')
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

      // 6. Save report — marks savedToDb on success
      if (session) {
        const { error: reportErr } = await supabase.schema('substrata').from('session_reports').insert({
          session_id: session.id,
          user_id: userId,
          day_number: dayNumber,
          report_text: fullText,
          scores: computed,
        })
        if (!reportErr) setSavedToDb(true)
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'token_limit') {
        setError('Your free AI analysis allowance has been used up. Reach out to get more access.')
      } else {
        setError('Something went wrong generating your analysis. Please try again.')
      }
      setPhase('questions')
    }
  }, [supabase, userId, dayNumber, analysisSections, languageMode])

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
    setSelectedOption(null)
    if (currentIdx === questions.length - 1) {
      // Don't add to answers state before submitAnalysis — prevents duplicate answer on retry
      submitAnalysis([...answers, answer], languageMode)
    } else {
      setAnswers(prev => [...prev, answer])
      setCurrentIdx(prev => prev + 1)
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
    return <ResultsScreen
      analysis={analysis}
      scores={scores}
      answeredIds={answeredIds}
      dayNumber={dayNumber}
      isNewResult={!existingReport}
      savedToDb={savedToDb}
      saveError={saveError}
      languageMode={languageMode}
      onLanguageModeChange={handleLanguageModeChange}
      userId={userId}
      supabase={supabase}
    />
  }
  if (!currentQuestion) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--obsidian)', paddingBottom: 88 }}>
      <div className="w-full h-0.5" style={{ background: '#2E2B27' }}>
        <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--indigo)' }} />
      </div>

      <div className="px-6 pt-5 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: isSectionStart ? 'var(--indigo)' : 'var(--stone)' }}>
          {currentQuestion.sectionLabel}
        </span>
        <span className="text-xs tabular-nums" style={{ color: 'var(--stone)' }}>
          {currentIdx + 1} / {questions.length}
        </span>
      </div>
      <div className="px-6 pt-1">
        <span className="text-xs" style={{ color: 'var(--stone)' }}>Day {dayNumber}</span>
      </div>

      <div className="flex-1 px-6 pt-8 pb-4 flex flex-col">
        <p className="text-xl font-medium leading-snug mb-8" style={{ color: 'var(--parchment)', maxWidth: 480 }}>
          {currentQuestion.text}
        </p>

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
                  padding: '14px 20px', minHeight: 56, cursor: 'pointer',
                }}>
                {option.label}
              </button>
            )
          })}
        </div>

        {error && <p className="mt-5 text-sm" style={{ color: 'var(--terracotta)' }}>{error}</p>}
      </div>

      {/* Fixed bottom nav — always reachable without scrolling */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 16,
        padding: 'calc(12px + env(safe-area-inset-bottom, 0px)) 24px 24px',
        background: 'var(--obsidian)',
        borderTop: '1px solid #2E2B27',
      }}>
        <button onClick={handleBack} disabled={currentIdx === 0}
          style={{
            background: 'none', border: 'none',
            cursor: currentIdx === 0 ? 'default' : 'pointer',
            color: currentIdx === 0 ? 'transparent' : 'var(--stone)',
            fontSize: 14, padding: '8px 0', flexShrink: 0,
          }}>
          ← Back
        </button>
        <button onClick={handleContinue} disabled={!selectedOption}
          className="flex-1 py-3 rounded-xl font-semibold text-sm"
          style={{
            background: selectedOption ? 'var(--indigo)' : '#2E2B27',
            color: selectedOption ? '#fff' : 'var(--stone)',
            border: 'none',
            cursor: selectedOption ? 'pointer' : 'not-allowed',
          }}>
          {currentIdx === questions.length - 1 ? 'See results →' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
