'use client'
import { useState, useEffect } from 'react'
import { createClient } from './lib/supabase'
import { useRouter } from 'next/navigation'
import Landing from './components/Landing'

export default function Home() {
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setChecking(false); return }

      // Same expiry rule the journal enforces — an expired session is a
      // logged-out visitor, so they get the landing page, not a bounce loop.
      const expiry = localStorage.getItem('keeper_expiry')
      if (!expiry || Date.now() > Number(expiry)) {
        localStorage.removeItem('keeper_expiry')
        await supabase.auth.signOut()
        setChecking(false)
        return
      }

      router.replace('/journal')
    })
  }, [])

  if (checking) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #2E1A0E, #1a0a02)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 32, color: '#F0B07A' }}>📓</div>
    </div>
  )

  return <Landing />
}
