'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type FormState = {
  relationship_status: string | null
  life_focus: string | null
  age_range: string | null
  gender_identity: string
  has_kids: boolean | null
}

const RELATIONSHIP_OPTIONS = [
  { value: 'single_looking',     label: 'Single and looking' },
  { value: 'single_not_looking', label: 'Single, not looking right now' },
  { value: 'partnered',          label: 'In a relationship' },
  { value: 'married',            label: 'Married' },
  { value: 'open',               label: 'Open relationship / ENM' },
  { value: 'complicated',        label: "It's complicated" },
  { value: 'prefer_not',         label: 'Prefer not to say' },
]

const FOCUS_OPTIONS = [
  { value: 'self_development',      label: 'Understanding myself better' },
  { value: 'finding_partner',       label: 'Finding the right person' },
  { value: 'relationship_growth',   label: 'Growing within my current relationship' },
  { value: 'career',                label: 'Career and personal goals' },
  { value: 'other',                 label: 'Something else' },
]

const AGE_OPTIONS = [
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55+',   label: '55+' },
]

function RadioGroup({
  label, options, value, onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string | null
  onChange: (v: string) => void
}) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--stone)' }}>
        {label}
      </p>
      <div className="space-y-2">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: value === opt.value ? 'var(--indigo)' : 'var(--charcoal)',
              color: value === opt.value ? '#fff' : 'var(--parchment)',
              border: `1.5px solid ${value === opt.value ? 'var(--indigo)' : '#3D3A36'}`,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SetupForm({
  userId,
  existing,
}: {
  userId: string
  existing: {
    relationship_status: string | null
    life_focus: string | null
    age_range: string | null
    gender_identity: string | null
    has_kids: boolean | null
  }
}) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState<FormState>({
    relationship_status: existing.relationship_status,
    life_focus: existing.life_focus,
    age_range: existing.age_range,
    gender_identity: existing.gender_identity ?? '',
    has_kids: existing.has_kids,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = !!form.relationship_status && !!form.life_focus

  async function handleSubmit() {
    if (!canSubmit) return
    setSaving(true)
    setError(null)

    const { error: err } = await supabase
      .schema('substrata')
      .from('profiles')
      .upsert({
        id: userId,
        relationship_status: form.relationship_status,
        life_focus: form.life_focus,
        age_range: form.age_range,
        gender_identity: form.gender_identity || null,
        has_kids: form.has_kids,
        context_set: true,
      }, { onConflict: 'id' })

    if (err) {
      setError('Could not save. Please try again.')
      setSaving(false)
      return
    }

    router.push('/test')
  }

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: 'var(--obsidian)' }}>
      <div className="max-w-sm mx-auto">
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--stone)' }}>
          Substrata · Setup
        </p>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--parchment)' }}>
          A few things first.
        </h1>
        <p className="text-sm mb-10 leading-relaxed" style={{ color: 'var(--stone)' }}>
          These don't change what the profile finds — they shape how it's framed. You can update this any time.
        </p>

        <RadioGroup
          label="Relationship status"
          options={RELATIONSHIP_OPTIONS}
          value={form.relationship_status}
          onChange={v => setForm(f => ({ ...f, relationship_status: v }))}
        />

        <RadioGroup
          label="What brings you here?"
          options={FOCUS_OPTIONS}
          value={form.life_focus}
          onChange={v => setForm(f => ({ ...f, life_focus: v }))}
        />

        {/* Age range */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--stone)' }}>
            Age range <span style={{ opacity: 0.5, textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>optional</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {AGE_OPTIONS.map(age => (
              <button
                key={age.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, age_range: f.age_range === age.value ? null : age.value }))}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: form.age_range === age.value ? 'var(--indigo)' : 'var(--charcoal)',
                  color: form.age_range === age.value ? '#fff' : 'var(--parchment)',
                  border: `1.5px solid ${form.age_range === age.value ? 'var(--indigo)' : '#3D3A36'}`,
                  cursor: 'pointer',
                }}
              >
                {age.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gender identity */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--stone)' }}>
            Gender identity <span style={{ opacity: 0.5, textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>optional</span>
          </p>
          <input
            type="text"
            value={form.gender_identity}
            onChange={e => setForm(f => ({ ...f, gender_identity: e.target.value }))}
            placeholder="Your words"
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'var(--charcoal)',
              color: 'var(--parchment)',
              border: '1.5px solid #3D3A36',
              outline: 'none',
            }}
          />
        </div>

        {/* Has kids */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--stone)' }}>
            Have kids? <span style={{ opacity: 0.5, textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>optional</span>
          </p>
          <div className="flex gap-2">
            {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(opt => (
              <button
                key={String(opt.v)}
                type="button"
                onClick={() => setForm(f => ({ ...f, has_kids: f.has_kids === opt.v ? null : opt.v }))}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: form.has_kids === opt.v ? 'var(--indigo)' : 'var(--charcoal)',
                  color: form.has_kids === opt.v ? '#fff' : 'var(--parchment)',
                  border: `1.5px solid ${form.has_kids === opt.v ? 'var(--indigo)' : '#3D3A36'}`,
                  cursor: 'pointer',
                }}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm" style={{ color: 'var(--terracotta)' }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="w-full py-3 rounded-xl text-sm font-semibold"
          style={{
            background: canSubmit ? 'var(--indigo)' : '#2E2B27',
            color: canSubmit ? '#fff' : 'var(--stone)',
            border: 'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Saving…' : 'Save and continue →'}
        </button>

        <p className="mt-6 text-xs text-center leading-relaxed" style={{ color: 'var(--stone)' }}>
          Two fields required — everything else is optional.
        </p>
      </div>
    </div>
  )
}
