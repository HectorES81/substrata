'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DevResetButton() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleReset() {
    setBusy(true)
    await fetch('/api/admin/reset-test', { method: 'POST' })
    router.refresh()
    setBusy(false)
    setConfirming(false)
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs"
        style={{ background: 'none', border: 'none', color: '#5A4A4A', cursor: 'pointer', textDecoration: 'underline' }}
      >
        Reset test data
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs" style={{ color: 'var(--stone)' }}>Wipe all sessions?</span>
      <button
        onClick={handleReset}
        disabled={busy}
        className="text-xs px-3 py-1 rounded-lg"
        style={{ background: '#5A2E2E', color: '#E08080', border: 'none', cursor: 'pointer' }}
      >
        {busy ? 'Resetting…' : 'Yes, reset'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-xs"
        style={{ background: 'none', border: 'none', color: 'var(--stone)', cursor: 'pointer' }}
      >
        Cancel
      </button>
    </div>
  )
}
