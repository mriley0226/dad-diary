'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from './lib/supabase'
import { useRouter } from 'next/navigation'

const P = {
  bg: '#FBF6EE', card: '#FFFDF8', ink: '#1A1108', inkMid: '#4A3728',
  inkLight: '#8A7A6E', inkFaint: '#C5B8AC', walnut: '#2E1A0E', walnutMid: '#4A2C18',
  amber: '#D4854A', amberLight: '#F0B07A', amberPale: '#FFF3E8',
  green: '#6A9E6A', border: '#EAE2D8', shadow: 'rgba(44,28,10,0.09)',
}

const EMOJIS = ['❤️','😂','😭','🥹','👏','🙏']
const RELATIONS = ['Mom','Dad','Grandma','Grandpa','Nana','Papa','Abuela','Abuelo',
  'Son','Daughter','My Child','Husband','Wife','Partner','Brother','Sister','Uncle','Aunt','Someone else']

function todayStr() { return new Date().toISOString().split('T')[0] }
function fmt(d, opts={ month:'long', day:'numeric', year:'numeric' }) {
  return new Date(d+'T12:00:00').toLocaleDateString('en-US', opts)
}
function sameMonthDay(a, b) { return a.slice(5) === b.slice(5) }
function yearsAgo(d) { return new Date().getFullYear() - new Date(d+'T12:00:00').getFullYear() }

function Stars({ value, onChange, size=16 }) {
  const [hov, setHov] = useState(0)
  return (
    <span style={{ display:'inline-flex', gap:1 }}>
      {[1,2,3,4,5].map(s => (
        <button key={s} onClick={() => onChange?.(s)}
          onMouseEnter={() => setHov(s)} onMouseLeave={() => setHov(0)}
          style={{ fontSize:size, color:s<=(hov||value)?P.amber:P.inkFaint,
            background:'none', border:'none', cursor:onChange?'pointer':'default',
            padding:'0 1px', lineHeight:1 }}>★</button>
      ))}
    </span>
  )
}

function Avatar({ name, size=32 }) {
  const init = name.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const hue = [...name].reduce((a,c)=>a+c.charCodeAt(0),0)%360
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`hsl(${hue},35%,52%)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontSize:size*.38, fontWeight:700, flexShrink:0 }}>{init}</div>
  )
}

const MAX_BYTES = 100 * 1024 * 1024
function isVideo(url) { return /\.(mp4|mov|webm|m4v)$/i.test(url || '') }

function MediaBtn({ onMedia }) {
  const ref = useRef()
  return (
    <>
      <input ref={ref} type="file" accept="image/*,video/*" style={{ display:'none' }}
        onChange={e => {
          const f = e.target.files[0]; if (!f) return
          if (f.size > MAX_BYTES) { alert('File is too large (max 100 MB).'); return }
          const r = new FileReader(); r.onload = ev => onMedia(ev.target.result, f); r.readAsDataURL(f)
        }} />
      <button onClick={() => ref.current.click()} style={{
        display:'flex', alignItems:'center', gap:6, background:'none',
        border:`1.5px dashed ${P.inkFaint}`, borderRadius:8,
        padding:'7px 14px', fontSize:13, color:P.inkLight, cursor:'pointer' }}>
        <span style={{fontSize:15}}>📷</span> Add photo/video
      </button>
    </>
  )
}

function MediaThumb({ url, height=200, opacity=1 }) {
  if (!url) return null
  return isVideo(url)
    ? <video src={url} muted playsInline style={{ width:'100%', height, objectFit:'cover', display:'block', opacity }} />
    : <img src={url} alt="" style={{ width:'100%', height, objectFit:'cover', display:'block', opacity }} />
}

function OnThisDay({ memories }) {
  const today = todayStr()
  const past = memories
    .filter(m => m.date !== today && sameMonthDay(m.date, today) && yearsAgo(m.date) > 0)
    .sort((a,b) => new Date(a.date)-new Date(b.date))
  if (!past.length) return null
  const m = past[0]; const yrs = yearsAgo(m.date)
  return (
    <div style={{ borderRadius:18, overflow:'hidden', marginBottom:28,
      boxShadow:'0 6px 32px rgba(46,26,14,.22)', background:P.walnut }}>
      {m.photo_url && <MediaThumb url={m.photo_url} height={200} opacity={0.55} />}
      <div style={{ padding:'18px 22px 22px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <span style={{fontSize:16}}>🕰️</span>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:1.8, color:P.amberLight, textTransform:'uppercase' }}>
            On this day · {yrs} year{yrs!==1?'s':''} ago
          </span>
        </div>
        <p style={{ margin:'0 0 14px', fontSize:18, lineHeight:1.65, color:'#FFF8F0',
          fontFamily:'Georgia,serif', fontStyle:'italic' }}>"{m.text}"</p>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Stars value={m.rating} size={14} />
          <span style={{ fontSize:12, color:P.amberLight }}>{fmt(m.date)}</span>
        </div>
      </div>
    </div>
  )
}

function MemoryCard({ m, onRate, onDelete, onAddMedia, reactions, comments, onReact, onComment, readOnly }) {
  const myReact = reactions.find(r => r.memory_id === m.id && r.is_me)?.emoji
  const totalC = comments.filter(c => c.memory_id === m.id).length
  const mediaRef = useRef()
  return (
    <article className="mem-card" style={{ background:P.card, border:`1px solid ${P.border}`,
      borderRadius:16, overflow:'hidden', marginBottom:14, boxShadow:`0 2px 14px ${P.shadow}` }}>
      {m.photo_url && <MediaThumb url={m.photo_url} height={260} />}
      {!m.photo_url && !readOnly && (
        <>
          <input ref={mediaRef} type="file" accept="image/*,video/*" style={{ display:'none' }}
            onChange={e => { const f = e.target.files[0]; if (!f) return; if (f.size > MAX_BYTES) { alert('File too large (max 100 MB).'); return } onAddMedia(m.id, f) }} />
          <button onClick={() => mediaRef.current.click()} style={{
            display:'block', width:'100%', padding:'10px', background:'none',
            border:'none', borderBottom:`1px solid ${P.border}`, fontSize:12,
            color:P.inkFaint, cursor:'pointer', textAlign:'center' }}>📷 Add photo or video</button>
        </>
      )}
      <div style={{ padding:'18px 20px' }}>
        <p style={{ margin:'0 0 12px', fontSize:15.5, lineHeight:1.7, color:P.ink, fontFamily:'Georgia,serif' }}>
          "{m.text}"
        </p>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <Stars value={m.rating} onChange={readOnly ? null : v => onRate(m.id, v)} size={15} />
            <span style={{ fontSize:12, color:P.inkLight }}>{fmt(m.date, {month:'short',day:'numeric',year:'numeric'})}</span>
            {(m.tags||[]).map(t => (
              <span key={t} style={{ fontSize:11, fontWeight:600, background:P.amberPale,
                color:P.walnutMid, padding:'2px 8px', borderRadius:4 }}>#{t}</span>
            ))}
          </div>
          {!readOnly && <button onClick={() => { if (window.confirm('Remove this memory? This cannot be undone.')) onDelete(m.id) }} style={{ background:'none', border:'none', fontSize:11, color:P.inkFaint, cursor:'pointer' }}>Remove</button>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', paddingTop:10, borderTop:`1px solid ${P.border}` }}>
          {EMOJIS.map(e => {
            const cnt = reactions.filter(r => r.memory_id === m.id && r.emoji === e).length
            const active = myReact === e
            return (
              <button key={e} onClick={() => onReact(m.id, e)} style={{
                background:active?P.amberPale:'transparent',
                border:`1px solid ${active?P.amber:P.border}`,
                borderRadius:20, padding:'3px 9px', fontSize:13, cursor:'pointer',
                display:'flex', alignItems:'center', gap:3 }}>
                {e}{cnt>0 && <span style={{fontSize:10,color:P.inkLight,fontWeight:700}}>{cnt}</span>}
              </button>
            )
          })}
          <button onClick={() => onComment(m.id)} style={{ marginLeft:'auto', background:'none',
            border:`1px solid ${P.border}`, borderRadius:20, padding:'3px 12px',
            fontSize:12, color:P.inkLight, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
            💬 {totalC > 0 ? totalC : 'Comment'}
          </button>
        </div>
      </div>
    </article>
  )
}

function AddForm({ onAdd }) {
  const [text, setText] = useState('')
  const [rating, setRating] = useState(3)
  const [date, setDate] = useState(todayStr())
  const [media, setMedia] = useState(null)
  const [mediaFile, setMediaFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState(false)

  const submit = async () => {
    if (!text.trim()) return
    setSaving(true)
    await onAdd({ text: text.trim(), rating, date, tags: [], mediaFile })
    setText(''); setRating(3); setDate(todayStr()); setMedia(null); setMediaFile(null)
    setSaving(false); setFlash(true); setTimeout(() => setFlash(false), 2200)
  }

  return (
    <div style={{ background:P.card, border:`1px solid ${P.border}`, borderRadius:18,
      padding:'22px 22px', marginBottom:24, boxShadow:`0 2px 14px ${P.shadow}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background:P.amber }} />
        <span style={{ fontSize:12, fontWeight:700, letterSpacing:1.2, color:P.inkMid, textTransform:'uppercase' }}>New memory</span>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
        placeholder="What happened today? A phrase, a moment, something worth keeping…"
        style={{ width:'100%', border:`1.5px solid ${text?P.amber:P.border}`, borderRadius:12,
          padding:'12px 14px', fontSize:15, fontFamily:'Georgia,serif', background:'#FFFEFA',
          color:P.ink, resize:'vertical', outline:'none', lineHeight:1.65 }} />
      {media && (
        <div style={{ position:'relative', marginTop:10 }}>
          {mediaFile?.type?.startsWith('video/')
            ? <video src={media} controls style={{ width:'100%', maxHeight:200, borderRadius:10 }} />
            : <img src={media} alt="" style={{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:10 }} />}
          <button onClick={() => { setMedia(null); setMediaFile(null) }} style={{
            position:'absolute', top:8, right:8, background:'rgba(0,0,0,.55)',
            color:'#fff', border:'none', borderRadius:20, padding:'3px 10px', fontSize:12, cursor:'pointer' }}>✕</button>
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <Stars value={rating} onChange={setRating} size={22} />
          <input type="date" value={date} max={todayStr()} onChange={e => setDate(e.target.value)}
            style={{ border:`1px solid ${P.border}`, borderRadius:8, padding:'6px 10px',
              fontSize:13, color:P.inkMid, background:'#FFFEFA', outline:'none', cursor:'pointer' }} />
          <MediaBtn onMedia={(preview, file) => { setMedia(preview); setMediaFile(file) }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {flash && <span style={{ fontSize:13, color:P.green, fontWeight:600 }}>✓ Saved</span>}
          <button onClick={submit} disabled={!text.trim() || saving} style={{
            background: text.trim() ? P.walnut : P.inkFaint, color:'#fff',
            border:'none', borderRadius:10, padding:'10px 22px',
            fontSize:14, fontWeight:700, cursor: text.trim() ? 'pointer' : 'default' }}>
            {saving ? 'Saving…' : 'Save memory'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SearchBar({ value, onChange, dateFrom, dateTo, onDateFrom, onDateTo }) {
  const hasFilter = dateFrom || dateTo
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:14, color:P.inkFaint }}>🔍</span>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="Search memories…"
          style={{ width:'100%', background:P.card, border:`1px solid ${P.border}`, borderRadius:10,
            padding:'10px 14px 10px 40px', fontSize:14, color:P.ink, outline:'none' }} />
        {value && <button onClick={() => onChange('')} style={{ position:'absolute', right:12, top:'50%',
          transform:'translateY(-50%)', background:'none', border:'none', fontSize:15, cursor:'pointer', color:P.inkFaint }}>✕</button>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, flexWrap:'wrap' }}>
        <span style={{ fontSize:12, color:P.inkLight }}>From</span>
        <input type="date" value={dateFrom} onChange={e => onDateFrom(e.target.value)}
          style={{ border:`1px solid ${P.border}`, borderRadius:8, padding:'5px 8px',
            fontSize:12, color:P.inkMid, background:P.card, outline:'none' }} />
        <span style={{ fontSize:12, color:P.inkLight }}>to</span>
        <input type="date" value={dateTo} onChange={e => onDateTo(e.target.value)}
          style={{ border:`1px solid ${P.border}`, borderRadius:8, padding:'5px 8px',
            fontSize:12, color:P.inkMid, background:P.card, outline:'none' }} />
        {hasFilter && <button onClick={() => { onDateFrom(''); onDateTo('') }} style={{
          background:'none', border:'none', fontSize:12, color:P.inkFaint, cursor:'pointer' }}>Clear dates</button>}
      </div>
    </div>
  )
}

function CommentsDrawer({ memId, memory, comments, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const endRef = useRef()
  const list = comments.filter(c => c.memory_id === memId)

  const post = async () => {
    if (!text.trim() || !name.trim()) return
    setSaving(true)
    await onAdd(memId, { name: name.trim(), text: text.trim() })
    setText(''); setSaving(false)
    setTimeout(() => endRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex' }} onClick={onClose}>
      <div style={{ flex:1 }} />
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:460, background:P.card,
        height:'100%', display:'flex', flexDirection:'column', boxShadow:'-8px 0 40px rgba(0,0,0,.15)' }}>
        <div style={{ padding:'20px 22px 16px', borderBottom:`1px solid ${P.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontWeight:700, fontSize:16, color:P.ink }}>Comments</span>
            <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:P.inkLight }}>✕</button>
          </div>
          <p style={{ margin:0, fontSize:13.5, fontFamily:'Georgia,serif', color:P.inkMid, lineHeight:1.5, fontStyle:'italic' }}>
            "{memory?.text?.slice(0,100)}{memory?.text?.length>100?'…':''}"
          </p>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'16px 22px' }}>
          {list.length === 0 && <div style={{ textAlign:'center', color:P.inkFaint, padding:'40px 0', fontSize:14 }}>No comments yet.</div>}
          {list.map((c,i) => (
            <div key={i} style={{ display:'flex', gap:12, marginBottom:18 }}>
              <Avatar name={c.name} size={36} />
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:P.ink }}>{c.name}</span>
                  <span style={{ fontSize:11, color:P.inkFaint }}>{new Date(c.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                </div>
                <p style={{ margin:0, fontSize:14, color:P.inkMid, lineHeight:1.55 }}>{c.text}</p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div style={{ padding:'14px 22px 22px', borderTop:`1px solid ${P.border}` }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
            style={{ width:'100%', border:`1px solid ${P.border}`, borderRadius:8,
              padding:'9px 12px', fontSize:13.5, marginBottom:8, background:'#FFFDF8', color:P.ink, outline:'none' }} />
          <div style={{ display:'flex', gap:8 }}>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Leave a thought…" rows={2}
              style={{ flex:1, border:`1px solid ${P.border}`, borderRadius:8, padding:'9px 12px',
                fontSize:13.5, background:'#FFFDF8', color:P.ink, resize:'none', outline:'none' }} />
            <button onClick={post} disabled={!text.trim()||!name.trim()||saving} style={{
              background: text.trim()&&name.trim() ? P.walnut : P.inkFaint,
              color:'#fff', border:'none', borderRadius:8, padding:'0 16px',
              fontSize:13, fontWeight:700, cursor:'pointer', alignSelf:'stretch' }}>{saving?'…':'Post'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const JOURNAL_TYPES = [
  { id:'family',    emoji:'👨‍👩‍👧‍👦', label:'Family',           desc:'Shared moments, milestones, and memories for the whole family.' },
  { id:'loved-one', emoji:'🤍',       label:'Loved one',       desc:'A private journal dedicated to one person — a parent, child, or partner.' },
  { id:'difficult', emoji:'🌧️',       label:'Difficult moments', desc:'A space to process hard times, grief, and things worth remembering anyway.' },
  { id:'capsule',   emoji:'📸',       label:'Time capsule',    desc:'Photo and video-centric. Capture a period of life in vivid detail.' },
  { id:'self',      emoji:'✍️',       label:'Self-journal',    desc:'Just for you. Thoughts, reflections, and moments you want to hold onto.' },
]

function Welcome({ onDone }) {
  const [name, setName] = useState('')
  const [step, setStep] = useState(0)
  const [type, setType] = useState(null)

  const base = { minHeight:'100vh', background:'linear-gradient(160deg,#2E1A0E,#1a0a02)',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 28px' }

  if (step === 0) return (
    <div style={base}>
      <div style={{ textAlign:'center', maxWidth:380, width:'100%' }}>
        <div style={{ fontSize:56, marginBottom:24 }}>📓</div>
        <h1 style={{ fontFamily:'Georgia,serif', color:'#FFF8F0', fontSize:32,
          fontWeight:700, marginBottom:10, letterSpacing:'-.5px', lineHeight:1.2 }}>
          Some moments<br/>deserve to be kept.
        </h1>
        <p style={{ margin:'0 0 36px', fontSize:16, color:'rgba(255,240,220,.55)', lineHeight:1.7 }}>
          A private journal for the little things — the phrases, the quirks, the moments you never want to forget.
        </p>
        <p style={{ margin:'0 0 16px', fontSize:13, fontWeight:700, letterSpacing:1.2,
          color:P.amberLight, textTransform:'uppercase' }}>What kind of journal is this?</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
          {JOURNAL_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              background: type===t.id ? 'rgba(212,133,74,.25)' : 'rgba(255,255,255,.06)',
              border: `1.5px solid ${type===t.id ? P.amber : 'rgba(255,255,255,.15)'}`,
              borderRadius:14, padding:'14px 16px', cursor:'pointer', textAlign:'left',
              display:'flex', alignItems:'center', gap:14 }}>
              <span style={{ fontSize:24 }}>{t.emoji}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:'#FFF8F0', marginBottom:2 }}>{t.label}</div>
                <div style={{ fontSize:12, color:'rgba(255,240,220,.5)', lineHeight:1.4 }}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => type && setStep(1)} disabled={!type} style={{
          width:'100%', background: type ? P.amber : 'rgba(255,255,255,.1)',
          color:'#fff', border:'none', borderRadius:12, padding:'14px 0',
          fontSize:15, fontWeight:700, cursor: type ? 'pointer' : 'default' }}>Continue →</button>
      </div>
    </div>
  )

  if (step === 1) {
    const selectedType = JOURNAL_TYPES.find(t => t.id === type)
    const isLovdOne = type === 'loved-one'
    return (
      <div style={base}>
        <div style={{ textAlign:'center', maxWidth:380, width:'100%' }}>
          <div style={{ fontSize:40, marginBottom:20 }}>{selectedType.emoji}</div>
          <h2 style={{ fontFamily:'Georgia,serif', color:'#FFF8F0', fontSize:26,
            fontWeight:700, marginBottom:8, lineHeight:1.3 }}>
            {isLovdOne ? 'Who is this journal for?' : 'Give your journal a name.'}
          </h2>
          <p style={{ margin:'0 0 28px', fontSize:15, color:'rgba(255,240,220,.5)', lineHeight:1.6 }}>
            {isLovdOne ? 'Enter the name of the person this journal is about.' : 'You can always change this later.'}
          </p>
          <div style={{ display:'flex', gap:8, marginBottom:24 }}>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key==='Enter' && name.trim() && (isLovdOne ? setStep(2) : onDone(name.trim(), type))}
              placeholder={isLovdOne ? 'Their name…' : 'Journal name…'}
              style={{ flex:1, background:'rgba(255,255,255,.1)', border:'1.5px solid rgba(255,255,255,.2)',
                borderRadius:12, padding:'14px 16px', fontSize:16, color:'#FFF8F0', outline:'none',
                fontFamily:'Georgia,serif' }} />
            <button onClick={() => name.trim() && (isLovdOne ? setStep(2) : onDone(name.trim(), type))}
              disabled={!name.trim()} style={{
                background: name.trim() ? P.amber : 'rgba(255,255,255,.1)',
                color:'#fff', border:'none', borderRadius:12, padding:'0 22px',
                fontSize:20, cursor: name.trim() ? 'pointer' : 'default' }}>→</button>
          </div>
          <button onClick={() => setStep(0)} style={{ background:'none', border:'none',
            color:'rgba(255,255,255,.3)', fontSize:12, cursor:'pointer' }}>← Back</button>
        </div>
      </div>
    )
  }

  // Step 2: relation picker (loved-one type only)
  return (
    <div style={base}>
      <div style={{ textAlign:'center', maxWidth:380, width:'100%' }}>
        <div style={{ fontSize:40, marginBottom:20 }}>🤍</div>
        <h2 style={{ fontFamily:'Georgia,serif', color:'#FFF8F0', fontSize:26,
          fontWeight:700, marginBottom:8, lineHeight:1.3 }}>
          {name} sounds like<br/>someone worth remembering.
        </h2>
        <p style={{ margin:'0 0 32px', fontSize:15, color:'rgba(255,240,220,.5)', lineHeight:1.6 }}>
          What do you call them?
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {RELATIONS.map(r => (
            <button key={r} onClick={() => onDone(name.trim(), type)} style={{
              background:'rgba(255,255,255,.08)', border:'1.5px solid rgba(255,255,255,.15)',
              borderRadius:12, padding:'12px 8px', fontSize:14, color:'#FFF8F0',
              cursor:'pointer', fontWeight:600,
              gridColumn: r==='Someone else' ? 'span 3' : undefined,
            }}>{r}</button>
          ))}
        </div>
        <button onClick={() => setStep(1)} style={{ marginTop:20, background:'none', border:'none',
          color:'rgba(255,255,255,.3)', fontSize:12, cursor:'pointer' }}>← Back</button>
      </div>
    </div>
  )
}

function NavBtns({ slide, total, go, onClose }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:16, justifyContent:'center' }}>
      {slide > 0 && <button onClick={() => go(-1)} style={{ background:'rgba(255,255,255,.12)', border:'none',
        borderRadius:50, padding:'10px 20px', color:'rgba(255,255,255,.7)', fontSize:14, cursor:'pointer' }}>← Back</button>}
      <div style={{ display:'flex', gap:5 }}>
        {Array.from({length:total}).map((_,i) => (
          <div key={i} style={{ width:i===slide?18:6, height:6, borderRadius:3,
            background:i===slide?'#fff':'rgba(255,255,255,.25)', transition:'width .2s' }} />
        ))}
      </div>
      {slide < total-1 && <button onClick={() => go(1)} style={{ background:'rgba(255,255,255,.12)', border:'none',
        borderRadius:50, padding:'10px 20px', color:'rgba(255,255,255,.7)', fontSize:14, cursor:'pointer' }}>Next →</button>}
      <button onClick={onClose} style={{ position:'fixed', top:20, right:20, background:'rgba(255,255,255,.12)',
        border:'none', borderRadius:20, padding:'6px 14px', color:'rgba(255,255,255,.6)', fontSize:13, cursor:'pointer' }}>✕ Close</button>
    </div>
  )
}

function YearRecap({ memories, journalName, onClose }) {
  const [slide, setSlide] = useState(0)
  const [fading, setFading] = useState(false)
  const year = new Date().getFullYear() - 1
  const yearMems = memories.filter(m => new Date(m.date+'T12:00:00').getFullYear() === year)
    .sort((a,b) => b.rating - a.rating)
  const topMems = yearMems.slice(0,6)
  const totalCount = yearMems.length
  const avgRating = totalCount ? (yearMems.reduce((a,m)=>a+m.rating,0)/totalCount).toFixed(1) : 0
  const withPhotos = yearMems.filter(m=>m.photo_url).length
  const topTag = (() => {
    const c={}; yearMems.forEach(m=>(m.tags||[]).forEach(t=>c[t]=(c[t]||0)+1))
    return Object.entries(c).sort((a,b)=>b[1]-a[1])[0]?.[0]
  })()
  const slides = [{type:'cover'},...(totalCount>0?[{type:'stats'}]:[]),...topMems.map((m,i)=>({type:'memory',m,rank:i+1})),{type:'end'}]
  const go = dir => { setFading(true); setTimeout(()=>{ setSlide(s=>Math.max(0,Math.min(slides.length-1,s+dir))); setFading(false) },300) }
  const cur = slides[slide]
  const base = { position:'fixed', inset:0, zIndex:300, display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center', transition:'opacity .3s ease', opacity:fading?0:1 }

  if (cur.type==='cover') return (
    <div style={{...base, background:'linear-gradient(160deg,#1a0a02 0%,#2e1a0e 50%,#1a0a02 100%)'}}>
      <div style={{ textAlign:'center', padding:'0 32px', maxWidth:420 }}>
        <div style={{ fontSize:52, marginBottom:20 }}>📓</div>
        <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:700, letterSpacing:2.5, color:P.amberLight, textTransform:'uppercase' }}>Your {year} in memories</p>
        <h1 style={{ margin:'0 0 16px', fontSize:42, fontWeight:700, fontFamily:'Georgia,serif', color:'#FFF8F0', lineHeight:1.15 }}>{journalName}</h1>
        <p style={{ margin:'0 0 48px', fontSize:16, color:'rgba(255,240,220,.55)', lineHeight:1.6 }}>
          Every little thing you noticed.<br/>Every moment you didn't want to forget.
        </p>
        <button onClick={() => go(1)} style={{ background:P.amber, color:'#fff', border:'none',
          borderRadius:50, padding:'14px 36px', fontSize:15, fontWeight:700, cursor:'pointer' }}>See your year →</button>
      </div>
      <button onClick={onClose} style={{ position:'absolute', top:20, right:20, background:'rgba(255,255,255,.12)',
        border:'none', borderRadius:20, padding:'6px 14px', color:'rgba(255,255,255,.6)', fontSize:13, cursor:'pointer' }}>✕ Close</button>
    </div>
  )

  if (cur.type==='stats') return (
    <div style={{...base, background:'linear-gradient(160deg,#1a0a02,#3a1e08)'}}>
      <div style={{ textAlign:'center', padding:'0 32px', maxWidth:400 }}>
        <p style={{ margin:'0 0 32px', fontSize:12, fontWeight:700, letterSpacing:2, color:P.amberLight, textTransform:'uppercase' }}>Your year at a glance</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:40 }}>
          {[{n:totalCount,label:'memories captured'},{n:`${avgRating}★`,label:'average love rating'},
            {n:withPhotos,label:'with photos'},{n:topTag?`#${topTag}`:'—',label:'most common tag'}]
            .map((s,i) => (
              <div key={i} style={{ background:'rgba(255,255,255,.07)', borderRadius:16, padding:'20px 14px' }}>
                <div style={{ fontSize:i===3?22:36, fontWeight:700, color:'#FFF8F0', fontFamily:'Georgia,serif', lineHeight:1 }}>{s.n}</div>
                <div style={{ fontSize:12, color:'rgba(255,240,220,.5)', marginTop:8, lineHeight:1.4 }}>{s.label}</div>
              </div>
            ))}
        </div>
        <p style={{ margin:'0 0 40px', fontSize:17, color:'rgba(255,240,220,.7)', fontFamily:'Georgia,serif', fontStyle:'italic', lineHeight:1.6 }}>
          {totalCount>=10?'You showed up. Every week, something worth keeping.':totalCount>=5?'Every one of these is a gift.':'Even a few memories is a treasure chest.'}
        </p>
        <NavBtns slide={slide} total={slides.length} go={go} onClose={onClose} />
      </div>
    </div>
  )

  if (cur.type==='memory') {
    const {m, rank} = cur
    const bg = m.photo_url ? 'linear-gradient(to bottom,rgba(26,10,2,.2) 0%,rgba(26,10,2,.92) 60%)' :
      rank===1 ? 'linear-gradient(160deg,#2e1a0e,#1a0a02)' :
      rank===2 ? 'linear-gradient(160deg,#1a1a2e,#0a0a1a)' : 'linear-gradient(160deg,#1a1a0a,#0a0a02)'
    return (
      <div style={{...base, background:m.photo_url?'#000':undefined}}>
        {m.photo_url && (isVideo(m.photo_url)
          ? <video src={m.photo_url} muted playsInline style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:.35 }} />
          : <img src={m.photo_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:.35 }} />)}
        <div style={{ position:'absolute', inset:0, background:bg }} />
        <div style={{ position:'relative', zIndex:1, padding:'0 28px', maxWidth:440, width:'100%', textAlign:'center' }}>
          {rank===1 && <div style={{ fontSize:36, marginBottom:12 }}>🥇</div>}
          <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:700, letterSpacing:2, color:P.amberLight, textTransform:'uppercase' }}>
            {rank===1?'Your most cherished memory':rank===2?'A close second':rank===3?'Top 3':`Memory #${rank}`} · {fmt(m.date,{month:'long',year:'numeric'})}
          </p>
          <p style={{ margin:'0 0 20px', fontSize:rank<=2?22:19, lineHeight:1.65, color:'#FFF8F0',
            fontFamily:'Georgia,serif', fontStyle:'italic' }}>"{m.text}"</p>
          <Stars value={m.rating} size={20} />
          <div style={{ marginTop:40 }}><NavBtns slide={slide} total={slides.length} go={go} onClose={onClose} /></div>
        </div>
      </div>
    )
  }

  return (
    <div style={{...base, background:'linear-gradient(160deg,#1a0a02,#2e1a0e)'}}>
      <div style={{ textAlign:'center', padding:'0 32px', maxWidth:400 }}>
        <div style={{ fontSize:48, marginBottom:20 }}>🤍</div>
        <p style={{ margin:'0 0 12px', fontSize:12, fontWeight:700, letterSpacing:2, color:P.amberLight, textTransform:'uppercase' }}>That was {year}</p>
        <h2 style={{ margin:'0 0 18px', fontSize:30, fontFamily:'Georgia,serif', color:'#FFF8F0', fontWeight:700, lineHeight:1.25 }}>Keep writing it down.</h2>
        <p style={{ margin:'0 0 44px', fontSize:16, color:'rgba(255,240,220,.6)', lineHeight:1.7, fontFamily:'Georgia,serif', fontStyle:'italic' }}>
          Someday this journal will be the most important thing you ever made.
        </p>
        <button onClick={onClose} style={{ background:P.amber, color:'#fff', border:'none',
          borderRadius:50, padding:'14px 36px', fontSize:15, fontWeight:700, cursor:'pointer' }}>Back to journal</button>
      </div>
    </div>
  )
}

function SharePanel({ journal, supabase, onClose }) {
  const [email, setEmail] = useState('')
  const [members, setMembers] = useState([])
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    supabase.from('journal_members').select('*').eq('journal_id', journal.id)
      .then(({ data }) => setMembers(data || []))
  }, [journal.id])

  const invite = async () => {
    if (!email.trim()) return
    setSaving(true)
    const { error } = await supabase.from('journal_members')
      .insert({ journal_id: journal.id, email: email.trim().toLowerCase() })
    if (error) {
      setStatus(error.code === '23505' ? 'Already invited.' : 'Something went wrong.')
    } else {
      setStatus(`Invited! They'll see this journal when they sign in with ${email.trim()}.`)
      setEmail('')
      const { data } = await supabase.from('journal_members').select('*').eq('journal_id', journal.id)
      setMembers(data || [])
    }
    setSaving(false)
    setTimeout(() => setStatus(''), 4000)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.45)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'0 16px' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:P.card, borderRadius:20,
        padding:'28px 24px', width:'100%', maxWidth:400, boxShadow:'0 8px 40px rgba(0,0,0,.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <span style={{ fontWeight:700, fontSize:17, color:P.ink }}>Share journal</span>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:P.inkLight }}>✕</button>
        </div>
        <p style={{ margin:'0 0 16px', fontSize:13, color:P.inkMid, lineHeight:1.6 }}>
          Invite someone by email. They'll need to sign up with that same email address to view the journal.
        </p>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="their@email.com"
            type="email" onKeyDown={e => e.key==='Enter' && invite()}
            style={{ flex:1, border:`1px solid ${P.border}`, borderRadius:8, padding:'10px 12px',
              fontSize:14, color:P.ink, background:'#FFFEFA', outline:'none' }} />
          <button onClick={invite} disabled={!email.trim() || saving} style={{
            background: email.trim() ? P.walnut : P.inkFaint, color:'#fff', border:'none',
            borderRadius:8, padding:'0 18px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
            {saving ? '…' : 'Invite'}
          </button>
        </div>
        {status && <p style={{ margin:'0 0 12px', fontSize:13, color:P.green, fontWeight:600, lineHeight:1.5 }}>{status}</p>}
        {members.length > 0 && (
          <div style={{ borderTop:`1px solid ${P.border}`, paddingTop:16, marginTop:4 }}>
            <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:700, letterSpacing:1.2,
              color:P.inkLight, textTransform:'uppercase' }}>People with access</p>
            {members.map(m => (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <Avatar name={m.email} size={30} />
                <span style={{ fontSize:13, color:P.inkMid, flex:1 }}>{m.email}</span>
                <span style={{ fontSize:11, fontWeight:600, color: m.user_id ? P.green : P.inkFaint }}>
                  {m.user_id ? '● Active' : '○ Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LetterCompose({ onSave, onClose }) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [deliverAt, setDeliverAt] = useState('')
  const [saving, setSaving] = useState(false)
  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]
  const ready = to && subject && body && deliverAt

  const save = async () => {
    if (!ready) return
    setSaving(true)
    await onSave({ recipient_email: to, subject, body, deliver_at: deliverAt })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:P.bg, display:'flex', flexDirection:'column', overflowY:'auto' }}>
      <div style={{ background:P.walnut, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <span style={{ fontFamily:'Georgia,serif', color:'#FFF8F0', fontSize:18, fontWeight:700 }}>Write a letter</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,.5)', fontSize:20, cursor:'pointer' }}>✕</button>
      </div>
      <div style={{ flex:1, padding:'24px 20px', maxWidth:600, margin:'0 auto', width:'100%' }}>
        <p style={{ margin:'0 0 24px', fontSize:14, color:P.inkMid, lineHeight:1.7, fontStyle:'italic', fontFamily:'Georgia,serif' }}>
          Write something you want someone to read on a specific day — years from now, or sooner.
          They'll receive it by email exactly when you choose, even if they've never heard of Keeper.
        </p>
        {[
          { label:'To', el: <input value={to} onChange={e=>setTo(e.target.value)} type="email" placeholder="their@email.com"
              style={{ width:'100%', border:`1px solid ${P.border}`, borderRadius:10, padding:'11px 14px', fontSize:15, color:P.ink, background:'#FFFEFA', outline:'none' }} /> },
          { label:'Deliver on', el: <input value={deliverAt} onChange={e=>setDeliverAt(e.target.value)} type="date" min={minDateStr}
              style={{ border:`1px solid ${P.border}`, borderRadius:10, padding:'11px 14px', fontSize:15, color:P.ink, background:'#FFFEFA', outline:'none' }} /> },
          { label:'Subject', el: <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="A letter for you"
              style={{ width:'100%', border:`1px solid ${P.border}`, borderRadius:10, padding:'11px 14px', fontSize:15, color:P.ink, background:'#FFFEFA', outline:'none' }} /> },
        ].map(({label,el}) => (
          <label key={label} style={{ display:'block', marginBottom:16 }}>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, color:P.inkLight, textTransform:'uppercase', display:'block', marginBottom:6 }}>{label}</span>
            {el}
          </label>
        ))}
        <label style={{ display:'block', marginBottom:24 }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, color:P.inkLight, textTransform:'uppercase', display:'block', marginBottom:6 }}>Letter</span>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={14} placeholder="Dear ..."
            style={{ width:'100%', border:`1px solid ${body?P.amber:P.border}`, borderRadius:10, padding:'14px',
              fontSize:16, fontFamily:'Georgia,serif', color:P.ink, background:'#FFFEFA',
              outline:'none', lineHeight:1.8, resize:'vertical' }} />
        </label>
        <button onClick={save} disabled={!ready||saving} style={{
          width:'100%', background:ready?P.walnut:P.inkFaint, color:'#fff', border:'none',
          borderRadius:12, padding:'14px 0', fontSize:15, fontWeight:700,
          cursor:ready?'pointer':'default', marginBottom:40 }}>
          {saving ? 'Sealing…' : '✉️ Seal & Schedule'}
        </button>
      </div>
    </div>
  )
}

function LettersTab({ letters, onWrite, isOwner }) {
  const pending = letters.filter(l => !l.delivered_at).sort((a,b) => new Date(a.deliver_at)-new Date(b.deliver_at))
  const delivered = letters.filter(l => l.delivered_at)
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <p style={{ margin:0, fontSize:11, fontWeight:700, letterSpacing:1.5, color:P.inkLight, textTransform:'uppercase' }}>
          {pending.length} scheduled · {delivered.length} delivered
        </p>
        {isOwner && (
          <button onClick={onWrite} style={{ background:P.walnut, color:'#fff', border:'none',
            borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            ✉️ Write a letter
          </button>
        )}
      </div>
      {pending.length===0 && delivered.length===0 && (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✉️</div>
          <p style={{ fontFamily:'Georgia,serif', fontSize:18, fontWeight:700, color:P.ink, marginBottom:8 }}>No letters yet.</p>
          <p style={{ fontSize:14, color:P.inkLight, lineHeight:1.7, maxWidth:280, margin:'0 auto' }}>
            Write something for someone to read years from now. It arrives in their inbox on the exact day you choose.
          </p>
        </div>
      )}
      {pending.map(l => (
        <div key={l.id} style={{ background:P.card, border:`1px solid ${P.border}`, borderRadius:14,
          padding:'18px 20px', marginBottom:12, boxShadow:`0 2px 10px ${P.shadow}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
            <div>
              <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:15, color:P.ink }}>{l.subject}</p>
              <p style={{ margin:'0 0 10px', fontSize:13, color:P.inkMid }}>To: {l.recipient_email}</p>
              <span style={{ fontSize:11, fontWeight:700, background:P.amberPale, color:P.walnutMid, padding:'3px 10px', borderRadius:20 }}>
                📅 Delivers {fmt(l.deliver_at, {month:'long', day:'numeric', year:'numeric'})}
              </span>
            </div>
            <span style={{ fontSize:28 }}>🔒</span>
          </div>
        </div>
      ))}
      {delivered.length > 0 && (
        <>
          <p style={{ margin:'28px 0 12px', fontSize:11, fontWeight:700, letterSpacing:1.5, color:P.inkLight, textTransform:'uppercase' }}>Delivered</p>
          {delivered.map(l => (
            <div key={l.id} style={{ background:P.card, border:`1px solid ${P.border}`, borderRadius:14,
              padding:'18px 20px', marginBottom:12, opacity:.65 }}>
              <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:15, color:P.ink }}>{l.subject}</p>
              <p style={{ margin:'0 0 4px', fontSize:13, color:P.inkMid }}>To: {l.recipient_email}</p>
              <p style={{ margin:0, fontSize:12, color:P.inkFaint }}>
                Delivered {fmt(l.delivered_at.split('T')[0], {month:'long', day:'numeric', year:'numeric'})}
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function Home() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [journal, setJournal] = useState(null)
  const [sharedJournals, setSharedJournals] = useState([])
  const [memories, setMemories] = useState([])
  const [reactions, setReactions] = useState([])
  const [comments, setComments] = useState([])
  const [tab, setTab] = useState('journal')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [commentMemId, setCommentMemId] = useState(null)
  const [showRecap, setShowRecap] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [letters, setLetters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth'); return }
      setUser(user)
      loadJournal(user.id, user.email)
    })
  }, [])

  const loadJournal = async (userId, userEmail) => {
    // Link this user to any pending invites matching their email
    await supabase.from('journal_members')
      .update({ user_id: userId })
      .eq('email', userEmail.toLowerCase())
      .is('user_id', null)

    // Load owned journal
    const { data: journals } = await supabase.from('journals').select('*').eq('owner_id', userId).limit(1)

    // Load shared journals (re-query after linking above)
    const { data: memberRows } = await supabase.from('journal_members').select('journal_id').eq('user_id', userId)
    if (memberRows?.length) {
      const ids = memberRows.map(r => r.journal_id)
      const { data: shared } = await supabase.from('journals').select('*').in('id', ids)
      setSharedJournals(shared || [])
    }

    if (!journals || journals.length === 0) {
      if (memberRows?.length) {
        // No owned journal — show first shared journal
        const ids = memberRows.map(r => r.journal_id)
        const { data: shared } = await supabase.from('journals').select('*').in('id', ids)
        if (shared?.length) { setJournal(shared[0]); await loadMemories(shared[0].id) }
      } else {
        // Check if invited by email but journal_members not yet updated (edge case)
        const { data: pendingInvite } = await supabase.from('journal_members')
          .select('journal_id').eq('email', userEmail.toLowerCase()).limit(1)
        if (pendingInvite?.length) {
          // They were just linked above — reload
          const { data: shared } = await supabase.from('journals').select('*').eq('id', pendingInvite[0].journal_id)
          if (shared?.length) { setJournal(shared[0]); await loadMemories(shared[0].id); setLoading(false); return }
        }
        setShowWelcome(true)
      }
      setLoading(false)
      return
    }
    const j = journals[0]
    setJournal(j)
    await Promise.all([loadMemories(j.id), loadLetters(j.id)])
    setLoading(false)
  }

  const loadLetters = async (journalId) => {
    const { data } = await supabase.from('letters').select('*').eq('journal_id', journalId).order('deliver_at')
    setLetters(data || [])
  }

  const saveLetter = async ({ recipient_email, subject, body, deliver_at }) => {
    const { data } = await supabase.from('letters').insert({
      journal_id: journal.id, user_id: user.id, recipient_email, subject, body, deliver_at
    }).select().single()
    if (data) setLetters(prev => [...prev, data])
  }

  const resolveMediaUrls = async (mems) => {
    const paths = (mems || []).filter(m => m.photo_url && !m.photo_url.startsWith('http')).map(m => m.photo_url)
    if (!paths.length) return mems
    const { data: signed } = await supabase.storage.from('keeper-photos').createSignedUrls(paths, 3600)
    const urlMap = Object.fromEntries((signed || []).map(s => [s.path, s.signedUrl]))
    return mems.map(m => m.photo_url && !m.photo_url.startsWith('http') ? { ...m, photo_url: urlMap[m.photo_url] || null } : m)
  }

  const loadMemories = async (journalId) => {
    const { data: mems } = await supabase.from('memories').select('*').eq('journal_id', journalId).order('date', { ascending: false })
    const ids = (mems || []).map(m => m.id)
    const [{ data: reacts }, { data: comms }] = await Promise.all([
      ids.length ? supabase.from('reactions').select('*').in('memory_id', ids) : { data: [] },
      ids.length ? supabase.from('comments').select('*').in('memory_id', ids) : { data: [] },
    ])
    const resolved = await resolveMediaUrls(mems || [])
    setMemories(resolved)
    setReactions(reacts || [])
    setComments(comms || [])
  }

  const finishWelcome = async (name, type) => {
    const { data: j } = await supabase.from('journals').insert({ owner_id: user.id, name, type, created_at: new Date().toISOString() }).select().single()
    setJournal(j)
    setShowWelcome(false)
    setMemories([])
  }

  const addMemory = async ({ text, rating, date, tags, mediaFile }) => {
    let photo_url = null
    if (mediaFile) {
      const ext = mediaFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      await supabase.storage.from('keeper-photos').upload(path, mediaFile)
      photo_url = path
    }
    const { data: m } = await supabase.from('memories').insert({
      journal_id: journal.id, owner_id: user.id, text, rating, date, tags, photo_url
    }).select().single()
    const [resolved] = await resolveMediaUrls([m])
    setMemories(prev => [resolved, ...prev])
  }

  const addMediaToMemory = async (id, file) => {
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    await supabase.storage.from('keeper-photos').upload(path, file)
    await supabase.from('memories').update({ photo_url: path }).eq('id', id)
    const [{ data: signed }] = [await supabase.storage.from('keeper-photos').createSignedUrls([path], 3600)]
    const signedUrl = signed?.[0]?.signedUrl || null
    setMemories(prev => prev.map(m => m.id === id ? { ...m, photo_url: signedUrl } : m))
  }

  const rateMemory = async (id, rating) => {
    await supabase.from('memories').update({ rating }).eq('id', id)
    setMemories(prev => prev.map(m => m.id===id ? {...m, rating} : m))
  }

  const deleteMemory = async (id) => {
    await supabase.from('memories').delete().eq('id', id)
    setMemories(prev => prev.filter(m => m.id !== id))
  }

  const handleReact = async (memId, emoji) => {
    const existing = reactions.find(r => r.memory_id===memId && r.is_me)
    if (existing?.emoji === emoji) {
      await supabase.from('reactions').delete().eq('id', existing.id)
      setReactions(prev => prev.filter(r => r.id !== existing.id))
    } else {
      if (existing) { await supabase.from('reactions').delete().eq('id', existing.id) }
      const { data: r } = await supabase.from('reactions').insert({
        memory_id: memId, user_id: user.id, name: user.email, emoji
      }).select().single()
      setReactions(prev => [...prev.filter(r=>!(r.memory_id===memId&&r.is_me)), {...r, is_me:true}])
    }
  }

  const addComment = async (memId, { name, text }) => {
    const { data: c } = await supabase.from('comments').insert({ memory_id: memId, name, text }).select().single()
    setComments(prev => [...prev, c])
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/auth') }

  const isOwner = journal?.owner_id === user?.id
  const sorted = [...memories].sort((a,b) => new Date(b.date)-new Date(a.date))
  const filtered = sorted.filter(m => {
    if (search && !m.text.toLowerCase().includes(search.toLowerCase())) return false
    if (dateFrom && m.date < dateFrom) return false
    if (dateTo && m.date > dateTo) return false
    return true
  })
  const top5 = [...memories].sort((a,b) => b.rating-a.rating).slice(0,5)
  const commentMem = commentMemId ? memories.find(m => m.id===commentMemId) : null

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#1a0a02', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:32, color:P.amberLight }}>📓</div>
    </div>
  )

  if (showWelcome) return <Welcome onDone={(name, type) => finishWelcome(name, type)} />

  return (
    <div style={{ minHeight:'100vh', background:P.bg }}>
      <div style={{ background:P.walnut, padding:'16px 20px 0', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:560, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <h1 style={{ margin:0, fontFamily:'Georgia,serif', color:'#FFF8F0', fontSize:22, fontWeight:700 }}>
                {journal?.name}
              </h1>
              <p style={{ margin:'2px 0 0', fontSize:12, color:P.amberLight }}>
                {JOURNAL_TYPES.find(t=>t.id===journal?.type)?.emoji} {memories.length} memories
                <a href="/privacy" target="_blank" style={{ marginLeft:8, color:'rgba(240,176,122,.6)',
                  fontSize:11, textDecoration:'none' }}>🔒 Private</a>
              </p>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {isOwner && (
                <button onClick={() => setShowShare(true)} style={{ background:'rgba(255,255,255,.1)',
                  border:'1px solid rgba(255,255,255,.15)', borderRadius:10, padding:'8px 14px',
                  color:'#FFF8F0', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  👥 Share
                </button>
              )}
              <button onClick={() => setShowRecap(true)} style={{ background:'rgba(255,255,255,.1)',
                border:'1px solid rgba(255,255,255,.15)', borderRadius:10, padding:'8px 14px',
                color:'#FFF8F0', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                ✨ {new Date().getFullYear()-1} Recap
              </button>
              <button onClick={signOut} style={{ background:'none', border:'none',
                color:'rgba(255,255,255,.4)', fontSize:12, cursor:'pointer' }}>Sign out</button>
            </div>
          </div>
          <div style={{ display:'flex' }}>
            {[['journal','Journal'],['top5','Best of'],['letters','Letters ✉️']].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ background:'none', border:'none', cursor:'pointer',
                padding:'8px 16px', fontSize:13, fontWeight:600,
                color: tab===id ? P.amber : '#7A5A3A',
                borderBottom: tab===id ? `2px solid ${P.amber}` : '2px solid transparent' }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'24px 14px 80px' }}>
        {sharedJournals.length > 0 && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
            {user && journal?.owner_id === user.id && (
              <button onClick={async () => { setJournal((await supabase.from('journals').select('*').eq('owner_id', user.id).single()).data); await loadMemories(journal.id) }}
                style={{ fontSize:12, padding:'5px 12px', borderRadius:20, border:`1px solid ${P.border}`,
                  background: journal?.owner_id===user?.id ? P.amber : P.card, color: journal?.owner_id===user?.id ? '#fff' : P.inkMid, cursor:'pointer' }}>
                My journal
              </button>
            )}
            {sharedJournals.map(j => (
              <button key={j.id} onClick={async () => { setJournal(j); await loadMemories(j.id) }}
                style={{ fontSize:12, padding:'5px 12px', borderRadius:20, border:`1px solid ${P.border}`,
                  background: journal?.id===j.id && journal?.owner_id!==user?.id ? P.amber : P.card,
                  color: journal?.id===j.id && journal?.owner_id!==user?.id ? '#fff' : P.inkMid, cursor:'pointer' }}>
                {j.name}
              </button>
            ))}
          </div>
        )}

        {tab==='journal' && <>
          <OnThisDay memories={memories} />
          {isOwner && <AddForm onAdd={addMemory} />}
          {!isOwner && (
            <div style={{ background:P.card, border:`1px solid ${P.border}`, borderRadius:14,
              padding:'14px 18px', marginBottom:20, fontSize:13, color:P.inkMid, textAlign:'center' }}>
              You're viewing this journal as a guest — you can react and comment, but only the owner can add memories.
            </div>
          )}
          <SearchBar value={search} onChange={setSearch}
            dateFrom={dateFrom} dateTo={dateTo} onDateFrom={setDateFrom} onDateTo={setDateTo} />
          {filtered.map(m => (
            <MemoryCard key={m.id} m={m} onRate={rateMemory} onDelete={deleteMemory} onAddMedia={addMediaToMemory}
              reactions={reactions} comments={comments} onReact={handleReact} onComment={setCommentMemId}
              readOnly={!isOwner} />
          ))}
          {memories.length===0 && (
            <div style={{ textAlign:'center', padding:'50px 20px' }}>
              <div style={{ fontSize:44, marginBottom:16 }}>✍️</div>
              <p style={{ color:P.ink, fontFamily:'Georgia,serif', fontSize:18, fontWeight:700, marginBottom:8 }}>Your journal is ready.</p>
              <p style={{ color:P.inkLight, fontSize:14, lineHeight:1.7, maxWidth:260, margin:'0 auto' }}>
                Write down the first thing that comes to mind — a phrase they said, something that made you laugh, a moment you don't want to forget.
              </p>
            </div>
          )}
        </>}

        {tab==='top5' && <>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:P.inkLight, textTransform:'uppercase', margin:'0 0 18px' }}>Highest rated · All time</p>
          {top5.length===0
            ? <div style={{ textAlign:'center', color:P.inkFaint, padding:'40px 0' }}>Rate memories to see your favorites here.</div>
            : top5.map((m,i) => (
              <div key={m.id} style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:4 }}>
                <span style={{ fontFamily:'Georgia,serif', fontWeight:700, fontSize:30,
                  color:i===0?P.amber:P.inkFaint, lineHeight:1, minWidth:30, paddingTop:18 }}>{i+1}</span>
                <div style={{ flex:1 }}>
                  <MemoryCard m={m} reactions={reactions} comments={comments} onReact={handleReact} onComment={setCommentMemId} onAddMedia={addMediaToMemory} readOnly={!isOwner} />
                </div>
              </div>
            ))
          }
        </>}

        {tab==='letters' && <LettersTab letters={letters} onWrite={() => setShowCompose(true)} isOwner={isOwner} />}
      </div>

      {commentMem && <CommentsDrawer memId={commentMemId} memory={commentMem} comments={comments}
        onClose={() => setCommentMemId(null)} onAdd={addComment} />}
      {showRecap && journal && <YearRecap memories={memories} journalName={journal.name} onClose={() => setShowRecap(false)} />}
      {showShare && journal && <SharePanel journal={journal} supabase={supabase} onClose={() => setShowShare(false)} />}
      {showCompose && <LetterCompose onSave={saveLetter} onClose={() => setShowCompose(false)} />}
    </div>
  )
}