'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
    } else {
      setStep('code')
    }
    setLoading(false)
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })
    if (error) {
      setError('Invalid or expired code. Try again.')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--obsidian)' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Image
            src="/substrata-logo/substrata-stacked-mono-white.svg"
            alt="Substrata"
            width={160}
            height={80}
            priority
          />
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendLink} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: 'var(--charcoal)', border: '1.5px solid #3D3A36', color: 'var(--parchment)' }}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-opacity"
              style={{ background: 'var(--indigo)', color: '#fff', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Sending…' : 'Send login code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-sm text-center mb-2" style={{ color: 'var(--sand)' }}>
              Check your email for a code and enter it below.
            </p>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              maxLength={8}
              required
              autoFocus
              className="w-full px-4 py-3 rounded-lg text-sm outline-none text-center tracking-widest"
              style={{ background: 'var(--charcoal)', border: '1.5px solid #3D3A36', color: 'var(--parchment)', fontSize: 22, letterSpacing: '0.3em' }}
            />
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-opacity"
              style={{ background: 'var(--indigo)', color: '#fff', opacity: (loading || code.length < 6) ? 0.6 : 1, cursor: (loading || code.length < 6) ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Verifying…' : 'Verify code'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError(null) }}
              className="w-full text-sm"
              style={{ color: 'var(--stone)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Use a different email
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 text-sm text-center" style={{ color: 'var(--terracotta)' }}>
            {error}
          </p>
        )}

        <p className="mt-8 text-center text-xs" style={{ color: 'var(--stone)' }}>
          Substrata reveals the layers of who you are.
        </p>
      </div>
    </div>
  )
}
