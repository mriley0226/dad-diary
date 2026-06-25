'use client'
import { useState } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter } from 'next/navigation'

const P = {
  walnut: '#2E1A0E', amber: '#D4854A', amberLight: '#F0B07A',
  inkFaint: '#C5B8AC', border: '#EAE2D8', card: '#FFFDF8',
}

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const submit = async () => {
    setError('') 
    setLoading(true)
    let result
    if (mode === 'login') {
      result = await supabase.auth.signInWithPassword({ email, password })
    } else {
      result = await supabase.auth.signUp({ email, password })
    }
    setLoading(false)
    if (result.error) { setError(result.error.message); return }
    router.push('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, #2E1A0E, #1a0a02)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📓</div>
        <h1 style={{ fontFamily: 'Georgia, serif', color: '#FFF8F0', fontSize: 32,
          fontWeight: 700, marginBottom: 8, letterSpacing: '-.5px' }}>Keeper</h1>
        <p style={{ color: 'rgba(255,240,220,.5)', fontSize: 15, marginBottom: 36, lineHeight: 1.6 }}>
          A journal for the moments worth keeping.
        </p>
        <div style={{ background: P.card, borderRadius: 16, padding: '28px 24px' }}>
          <div style={{ display: 'flex', marginBottom: 24, background: '#F0EAE1', borderRadius: 10, padding: 4 }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px 0', fontSize: 14, fontWeight: 700,
                background: mode === m ? '#fff' : 'transparent',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                color: mode === m ? P.walnut : P.inkFaint,
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                transition: 'all .15s',
              }}>{m === 'login' ? 'Sign in' : 'Sign up'}</button>
            ))}
          </div>
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email address" type="email"
            style={{ width: '100%', border: `1px solid ${P.border}`, borderRadius: 10,
              padding: '12px 14px', fontSize: 15, marginBottom: 10,
              background: '#FFFEFA', color: '#1A1108', outline: 'none' }} />
          <input value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" type="password"
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{ width: '100%', border: `1px solid ${P.border}`, borderRadius: 10,
              padding: '12px 14px', fontSize: 15, marginBottom: 16,
              background: '#FFFEFA', color: '#1A1108', outline: 'none' }} />
          {error && <p style={{ color: '#C97070', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button onClick={submit} disabled={!email || !password || loading} style={{
            width: '100%', background: email && password ? P.walnut : P.inkFaint,
            color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0',
            fontSize: 15, fontWeight: 700, cursor: email && password ? 'pointer' : 'default',
          }}>{loading ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </div>
      </div>
    </div>
  )
}