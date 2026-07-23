'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Palette lifted directly from the app (the `P` object in page.js / auth)
const P = {
  bg: '#FBF6EE', card: '#FFFDF8', ink: '#1A1108', inkMid: '#4A3728',
  inkLight: '#8A7A6E', inkFaint: '#C5B8AC', walnut: '#2E1A0E', walnutMid: '#4A2C18',
  amber: '#D4854A', amberLight: '#F0B07A', amberPale: '#FFF3E8',
  green: '#6A9E6A', border: '#EAE2D8', shadow: 'rgba(44,28,10,0.09)',
}

export default function Landing() {
  const router = useRouter()
  const goAuth = () => router.push('/auth')

  // Live dates so the envelope always feels real
  const [written, setWritten] = useState('')
  const [opens, setOpens] = useState('')
  const [pmDate, setPmDate] = useState('')
  const envRef = useRef(null)
  const [sealed, setSealed] = useState(false)

  useEffect(() => {
    const now = new Date()
    setWritten(now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
    setPmDate(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase())
    const future = new Date(now); future.setFullYear(future.getFullYear() + 18)
    setOpens(future.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))

    if (typeof IntersectionObserver === 'undefined') { setSealed(true); return }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { setSealed(true); io.disconnect() } }),
      { threshold: 0.3 }
    )
    if (envRef.current) io.observe(envRef.current)
    return () => io.disconnect()
  }, [])

  const serif = 'Georgia, serif'

  return (
    <div style={{ background: P.bg, color: P.ink, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '22px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: '#FFF8F0',
            display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 20 }}>📓</span> Keeper
          </span>
          <button onClick={goAuth} style={{ background: 'none', color: '#FFF8F0',
            border: '1px solid rgba(255,248,240,.3)', borderRadius: 8, padding: '9px 18px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Sign in</button>
        </div>
      </nav>

      {/* ── HERO (dark walnut, matches /auth) ── */}
      <header style={{ background: 'linear-gradient(160deg, #2E1A0E, #1a0a02)', color: '#FFF8F0',
        padding: '140px 24px 110px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ margin: '0 0 26px', fontSize: 12, fontWeight: 700, letterSpacing: 2.4,
            color: P.amberLight, textTransform: 'uppercase' }}>A journal for the moments worth keeping</p>
          <h1 style={{ margin: '0 0 26px', fontFamily: serif, fontWeight: 700,
            fontSize: 'clamp(2.6rem, 6vw, 4.2rem)', lineHeight: 1.08, letterSpacing: '-.5px' }}>
            The small things<br />go first. <span style={{ color: P.amberLight }}>Keep them.</span>
          </h1>
          <p style={{ margin: '0 0 38px', fontSize: 19, lineHeight: 1.6,
            color: 'rgba(255,240,220,.7)', maxWidth: 520 }}>
            Keeper is a private journal for the moments that pass too quickly — and a way to
            write letters your kids will open years from now.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <button onClick={goAuth} style={{ background: P.amber, color: '#fff', border: 'none',
              borderRadius: 12, padding: '15px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Start your journal — free
            </button>
            <span style={{ fontSize: 13, color: 'rgba(255,240,220,.45)' }}>takes about a minute</span>
          </div>
        </div>
      </header>

      {/* ── FORGET (loss framing) ── */}
      <section style={{ background: P.bg, borderBottom: `1px solid ${P.border}`, padding: '96px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid',
          gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="kl-two">
          <div>
            <p style={{ margin: '0 0 20px', fontSize: 12, fontWeight: 700, letterSpacing: 1.8,
              color: P.amber, textTransform: 'uppercase' }}>Why Keeper</p>
            <h2 style={{ margin: '0 0 24px', fontFamily: serif, fontWeight: 700,
              fontSize: 'clamp(1.9rem, 4vw, 2.6rem)', lineHeight: 1.15, color: P.ink }}>
              You&apos;ll forget more than you&apos;d like to admit.
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 17, lineHeight: 1.7, color: P.inkMid, maxWidth: 430 }}>
              Your kids are changing faster than you can hold onto. The thing they said at breakfast.
              The way they say your name right now, before they say it correctly.
            </p>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.7, color: P.inkMid, maxWidth: 430 }}>
              You think you&apos;ll remember. You won&apos;t. Keeper gives you somewhere to put it —
              thirty seconds a day that gives you back years.
            </p>
          </div>
          <div style={{ borderLeft: `2px solid ${P.amber}`, paddingLeft: 26,
            display: 'flex', flexDirection: 'column', gap: 22 }}>
            {[
              ['The word she made up for strawberries.', 'gone by age 5'],
              ['How he needed the hall light on, exactly halfway.', 'gone by age 8'],
              ['The question she asked you about the moon.', 'gone by next week'],
            ].map(([line, tag]) => (
              <div key={tag} style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 20,
                lineHeight: 1.4, color: P.ink }}>
                {line}
                <span style={{ display: 'block', fontFamily: 'inherit', fontStyle: 'normal',
                  fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase',
                  color: P.inkLight, marginTop: 7 }}>{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LETTER (signature section) ── */}
      <section style={{ background: 'linear-gradient(160deg, #2E1A0E, #1a0a02)', color: '#FFF8F0',
        padding: '100px 24px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ maxWidth: 620, marginBottom: 56 }}>
            <p style={{ margin: '0 0 20px', fontSize: 12, fontWeight: 700, letterSpacing: 2.2,
              color: P.amberLight, textTransform: 'uppercase' }}>The Letter</p>
            <h2 style={{ margin: '0 0 20px', fontFamily: serif, fontWeight: 700,
              fontSize: 'clamp(1.9rem, 4vw, 2.7rem)', lineHeight: 1.15, color: '#FFF8F0' }}>
              Write now. <span style={{ color: P.amberLight, fontStyle: 'italic' }}>Delivered later.</span>
            </h2>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6, color: 'rgba(255,240,220,.7)', maxWidth: 520 }}>
              Write a letter to your child and choose when it arrives — their tenth birthday,
              their graduation, the day they move out. Then let it go and forget you wrote it.
            </p>
          </div>

          {/* Envelope */}
          <div ref={envRef} style={{ maxWidth: 600, margin: '0 auto', background: P.card, color: P.ink,
            borderRadius: 4, padding: '42px 44px', position: 'relative',
            boxShadow: '0 30px 60px -20px rgba(0,0,0,.55)',
            transform: sealed ? 'translateY(0)' : 'translateY(30px)',
            opacity: sealed ? 1 : 0, transition: 'transform .9s cubic-bezier(.2,.7,.2,1), opacity .9s' }}>
            {/* airmail stripe */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, borderRadius: '4px 4px 0 0',
              background: `repeating-linear-gradient(-45deg, ${P.amber} 0, ${P.amber} 10px, transparent 10px, transparent 20px, ${P.walnutMid} 20px, ${P.walnutMid} 30px, transparent 30px, transparent 40px)`,
              opacity: .9 }} />
            <div style={{ position: 'absolute', inset: 9, border: `1px solid ${P.border}`, borderRadius: 2, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 30 }} className="kl-env-row">
                <div>
                  <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: P.inkLight, marginBottom: 5 }}>To</div>
                  <div style={{ fontFamily: serif, fontSize: 17, color: P.ink }}>My daughter, on her 18th birthday</div>
                </div>
                <div style={{ width: 96, height: 96, border: `2px solid ${P.amber}`, borderRadius: '50%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', transform: 'rotate(-11deg)', flexShrink: 0, opacity: .9 }}>
                  <div style={{ fontSize: 8.5, letterSpacing: 1.4, textTransform: 'uppercase', color: P.amber, lineHeight: 1.3 }}>Keeper<br />Posted</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: P.amber, margin: '2px 0' }}>{pmDate}</div>
                  <div style={{ fontSize: 8.5, letterSpacing: 1.4, textTransform: 'uppercase', color: P.amber }}>Sealed</div>
                </div>
              </div>
              <div style={{ borderTop: `1px dashed ${P.border}`, paddingTop: 24 }}>
                <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 21, lineHeight: 1.5, color: P.ink, marginBottom: 22 }}>
                  &ldquo;You&apos;re asleep on my chest as I write this. You weigh nothing.
                  I want you to know exactly who you were tonight…&rdquo;
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap',
                  fontSize: 13, color: P.inkMid }}>
                  <span>Written <strong style={{ color: P.ink, fontWeight: 700 }}>{written}</strong></span>
                  <span style={{ color: P.amber, fontSize: 16 }}>→</span>
                  <span>Opens <strong style={{ color: P.ink, fontWeight: 700 }}>{opens}</strong></span>
                </div>
              </div>
            </div>
          </div>
          <p style={{ textAlign: 'center', marginTop: 40, fontSize: 14, color: 'rgba(255,240,220,.5)', fontStyle: 'italic', fontFamily: serif }}>
            They&apos;ll get the version of you that existed when they were small.
          </p>
        </div>
      </section>

      {/* ── PRIVACY ── */}
      <section style={{ background: P.bg, borderBottom: `1px solid ${P.border}`, padding: '96px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid',
          gridTemplateColumns: '1.1fr 1fr', gap: 60, alignItems: 'start' }} className="kl-two">
          <div>
            <p style={{ margin: '0 0 20px', fontSize: 12, fontWeight: 700, letterSpacing: 1.8,
              color: P.amber, textTransform: 'uppercase' }}>Privacy</p>
            <h2 style={{ margin: '0 0 22px', fontFamily: serif, fontWeight: 700,
              fontSize: 'clamp(1.9rem, 4vw, 2.6rem)', lineHeight: 1.15, color: P.ink }}>
              Yours by default.<br />Actually yours.
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: 18, color: P.ink, fontWeight: 600 }}>
              Every journal is private to the person who wrote it.
            </p>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: P.inkMid, maxWidth: 440 }}>
              Not &ldquo;private unless.&rdquo; Not &ldquo;private but our team can see it.&rdquo; Yours.
              If you ever want to share an entry — with a partner, with family — that&apos;s a choice
              you make, one entry at a time.
            </p>
          </div>
          <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 14, padding: 32 }}>
            <p style={{ margin: '0 0 20px', fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
              color: P.inkLight, textTransform: 'uppercase' }}>Who can see your entries</p>
            {[
              ['You', 'Everything. Always. It’s your journal.'],
              ['Everyone else', 'Nothing — unless you choose to share a specific entry.'],
              ['Us', 'We keep the lights on. We don’t read your letters.'],
            ].map(([k, v], i, arr) => (
              <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 14,
                padding: '15px 0', borderBottom: i < arr.length - 1 ? `1px solid ${P.border}` : 'none' }}>
                <span style={{ fontFamily: serif, fontSize: 16, color: P.ink, flexShrink: 0, width: 96 }}>{k}</span>
                <span style={{ fontSize: 14, color: P.inkMid }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SHARING ── */}
      <section style={{ background: P.bg, padding: '96px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ margin: '0 0 20px', fontSize: 12, fontWeight: 700, letterSpacing: 1.8,
            color: P.amber, textTransform: 'uppercase' }}>Sharing, if you want it</p>
          <h2 style={{ margin: '0 0 22px', fontFamily: serif, fontWeight: 700,
            fontSize: 'clamp(1.9rem, 4vw, 2.5rem)', lineHeight: 1.15, color: P.ink }}>
            Some memories are better with two people holding them.
          </h2>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.7, color: P.inkMid, maxWidth: 540 }}>
            Share individual entries with a partner or a family member, or keep everything to yourself.
            It&apos;s your call, every time — nothing leaves your journal unless you send it there.
          </p>
        </div>
      </section>

      {/* ── CLOSING ── */}
      <section style={{ background: 'linear-gradient(160deg, #2E1A0E, #1a0a02)', color: '#FFF8F0',
        textAlign: 'center', padding: '110px 24px' }}>
        <h2 style={{ margin: '0 0 18px', fontFamily: serif, fontWeight: 700,
          fontSize: 'clamp(2.1rem, 5vw, 3.2rem)', lineHeight: 1.15 }}>
          The moments <span style={{ color: P.amberLight, fontStyle: 'italic' }}>worth keeping.</span>
        </h2>
        <p style={{ margin: '0 0 36px', fontSize: 14, letterSpacing: .5, color: 'rgba(255,240,220,.55)' }}>
          start today · it takes about a minute
        </p>
        <button onClick={goAuth} style={{ background: P.amber, color: '#fff', border: 'none',
          borderRadius: 50, padding: '15px 40px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Create your free journal
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1a0a02', color: 'rgba(255,240,220,.4)', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 13 }}>
          <span style={{ fontFamily: serif, color: 'rgba(255,248,240,.7)' }}>Keeper</span>
          <span>Written today. Read for years.</span>
        </div>
      </footer>

      {/* responsive: collapse two-column grids on small screens */}
      <style>{`
        @media (max-width: 760px) {
          .kl-two { grid-template-columns: 1fr !important; gap: 40px !important; }
          .kl-env-row { flex-direction: column !important; align-items: flex-start !important; gap: 22px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; }
        }
      `}</style>
    </div>
  )
}
