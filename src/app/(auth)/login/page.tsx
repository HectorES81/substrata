'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setSent(true)
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

        {sent ? (
          <div className="text-center">
            <p style={{ color: 'var(--sand)' }}>Check your email for a login link.</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--charcoal)',
                border: '1.5px solid #3D3A36',
                color: 'var(--parchment)',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-opacity"
              style={{
                background: 'var(--indigo)',
                color: '#fff',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Sending…' : 'Send login link'}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs" style={{ color: 'var(--stone)' }}>
          Substrata reveals the layers of who you are.
        </p>
      </div>
    </div>
  )
}
