'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const P = {
  walnut: '#2E1A0E', amber: '#D4854A', inkFaint: '#C5B8AC',
  border: '#EAE2D8', card: '#FFFDF8',
}

export default function ResetPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Supabase puts the session tokens in the URL hash after redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else router.push('/auth')
    })
  }, [])

  const submit = async () => {
    if (password !== confirm) { setError("Passwords don't match."); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError(''); setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    // The reset link creates a session but no expiry stamp — set one so the
    // journal's gate doesn't immediately sign them back out.
    localStorage.setItem('keeper_expiry', Date.now() + 8 * 60 * 60 * 1000)
    setTimeout(() => router.push('/journal'), 2000)
  }

  if (!ready) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #2E1A0E, #1a0a02)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 32, color: '#F0B07A' }}>📓</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #2E1A0E, #1a0a02)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📓</div>
        <h1 style={{ fontFamily: 'Georgia, serif', color: '#FFF8F0', fontSize: 28,
          fontWeight: 700, marginBottom: 32 }}>Set a new password</h1>
        <div style={{ background: P.card, borderRadius: 16, padding: '28px 24px' }}>
          {done ? (
            <p style={{ color: '#6A9E6A', fontWeight: 700, fontSize: 15 }}>Password updated! Taking you back…</p>
          ) : (
            <>
              <input value={password} onChange={e => setPassword(e.target.value)}
                placeholder="New password" type="password"
                style={{ width: '100%', border: `1px solid ${P.border}`, borderRadius: 10,
                  padding: '12px 14px', fontSize: 15, marginBottom: 10,
                  background: '#FFFEFA', color: '#1A1108', outline: 'none' }} />
              <input value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm password" type="password"
                onKeyDown={e => e.key === 'Enter' && submit()}
                style={{ width: '100%', border: `1px solid ${P.border}`, borderRadius: 10,
                  padding: '12px 14px', fontSize: 15, marginBottom: 16,
                  background: '#FFFEFA', color: '#1A1108', outline: 'none' }} />
              {error && <p style={{ color: '#C97070', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button onClick={submit} disabled={!password || !confirm || loading} style={{
                width: '100%', background: password && confirm ? P.walnut : P.inkFaint,
                color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0',
                fontSize: 15, fontWeight: 700, cursor: password && confirm ? 'pointer' : 'default',
              }}>{loading ? '…' : 'Update password'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
