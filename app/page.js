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

function PhotoBtn({ onPhoto }) {
  const ref = useRef()
  return (
    <>
      <input ref={ref} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e => {
          const f = e.target.files[0]; if (!f) return
          const r = new FileReader(); r.onload = ev => onPhoto(ev.target.result, f); r.readAsDataURL(f)
        }} />
      <button onClick={() => ref.current.click()} style={{
        display:'flex', alignItems:'center', gap:6, background:'none',
        border:`1.5px dashed ${P.inkFaint}`, borderRadius:8,
        padding:'7px 14px', fontSize:13, color:P.inkLight, cursor:'pointer' }}>
        <span style={{fontSize:15}}>📷</span> Add photo
      </button>
    </>
  )
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
      {m.photo_url && <img src={m.photo_url} alt="" style={{ width:'100%', height:200, objectFit:'cover', display:'block', opacity:.55 }} />}
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

function MemoryCard({ m, onRate, onDelete, reactions, comments, onReact, onComment, readOnly }) {
  const myReact = reactions.find(r => r.memory_id === m.id && r.is_me)?.emoji
  const totalC = comments.filter(c => c.memory_id === m.id).length
  return (
    <article className="mem-card" style={{ background:P.card, border:`1px solid ${P.border}`,
      borderRadius:16, overflow:'hidden', marginBottom:14, boxShadow:`0 2px 14px ${P.shadow}` }}>
      {m.photo_url && <img src={m.photo_url} alt="" style={{ width:'100%', maxHeight:260, objectFit:'cover', display:'block' }} />}
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
          {!readOnly && <button onClick={() => onDelete(m.id)} style={{ background:'none', border:'none', fontSize:11, color:P.inkFaint, cursor:'pointer' }}>Remove</button>}
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
  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState(false)

  const submit = async () => {
    if (!text.trim()) return
    setSaving(true)
    await onAdd({ text: text.trim(), rating, date: todayStr(), tags: [], photoFile })
    setText(''); setRating(3); setPhoto(null); setPhotoFile(null)
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
      {photo && (
        <div style={{ position:'relative', marginTop:10 }}>
          <img src={photo} alt="" style={{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:10 }} />
          <button onClick={() => { setPhoto(null); setPhotoFile(null) }} style={{
            position:'absolute', top:8, right:8, background:'rgba(0,0,0,.55)',
            color:'#fff', border:'none', borderRadius:20, padding:'3px 10px', fontSize:12, cursor:'pointer' }}>✕</button>
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Stars value={rating} onChange={setRating} size={22} />
          <PhotoBtn onPhoto={(preview, file) => { setPhoto(preview); setPhotoFile(file) }} />
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

function SearchBar({ value, onChange }) {
  return (
    <div style={{ position:'relative', marginBottom:20 }}>
      <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:14, color:P.inkFaint }}>🔍</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Search memories…"
        style={{ width:'100%', background:P.card, border:`1px solid ${P.border}`, borderRadius:10,
          padding:'10px 14px 10px 40px', fontSize:14, color:P.ink, outline:'none' }} />
      {value && <button onClick={() => onChange('')} style={{ position:'absolute', right:12, top:'50%',
        transform:'translateY(-50%)', background:'none', border:'none', fontSize:15, cursor:'pointer', color:P.inkFaint }}>✕</button>}
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

function Welcome({ onDone }) {
  const [name, setName] = useState('')
  const [step, setStep] = useState(0)

  const submitRelation = (r) => {
    onDone(r === 'Someone else' ? name.trim() : name.trim())
  }

  return step === 0 ? (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#2E1A0E,#1a0a02)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 28px' }}>
      <div style={{ textAlign:'center', maxWidth:380, width:'100%' }}>
        <div style={{ fontSize:56, marginBottom:24 }}>📓</div>
        <h1 style={{ fontFamily:'Georgia,serif', color:'#FFF8F0', fontSize:32,
          fontWeight:700, marginBottom:10, letterSpacing:'-.5px', lineHeight:1.2 }}>
          Some moments<br/>deserve to be kept.
        </h1>
        <p style={{ margin:'0 0 36px', fontSize:16, color:'rgba(255,240,220,.55)', lineHeight:1.7 }}>
          A private journal for the little things — the phrases, the quirks, the moments you never want to forget.
        </p>
        <p style={{ margin:'0 0 12px', fontSize:13, fontWeight:700, letterSpacing:1.2,
          color:P.amberLight, textTransform:'uppercase' }}>Who is this journal for?</p>
        <div style={{ display:'flex', gap:8 }}>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key==='Enter' && name.trim() && setStep(1)}
            placeholder="Their name…"
            style={{ flex:1, background:'rgba(255,255,255,.1)', border:'1.5px solid rgba(255,255,255,.2)',
              borderRadius:12, padding:'14px 16px', fontSize:16, color:'#FFF8F0', outline:'none',
              fontFamily:'Georgia,serif' }} />
          <button onClick={() => name.trim() && setStep(1)} disabled={!name.trim()} style={{
            background: name.trim() ? P.amber : 'rgba(255,255,255,.1)',
            color:'#fff', border:'none', borderRadius:12, padding:'0 22px',
            fontSize:20, cursor: name.trim() ? 'pointer' : 'default' }}>→</button>
        </div>
      </div>
    </div>
  ) : (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#2E1A0E,#1a0a02)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 28px' }}>
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
            <button key={r} onClick={() => submitRelation(r)} style={{
              background:'rgba(255,255,255,.08)', border:'1.5px solid rgba(255,255,255,.15)',
              borderRadius:12, padding:'12px 8px', fontSize:14, color:'#FFF8F0',
              cursor:'pointer', fontWeight:600,
              gridColumn: r==='Someone else' ? 'span 3' : undefined,
            }}>{r}</button>
          ))}
        </div>
        <button onClick={() => setStep(0)} style={{ marginTop:20, background:'none', border:'none',
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
        {m.photo_url && <img src={m.photo_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:.35 }} />}
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

export default function Home() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [journal, setJournal] = useState(null)
  const [memories, setMemories] = useState([])
  const [reactions, setReactions] = useState([])
  const [comments, setComments] = useState([])
  const [tab, setTab] = useState('journal')
  const [search, setSearch] = useState('')
  const [commentMemId, setCommentMemId] = useState(null)
  const [showRecap, setShowRecap] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth'); return }
      setUser(user)
      loadJournal(user.id)
    })
  }, [])

  const loadJournal = async (userId) => {
    const { data: journals } = await supabase.from('journals').select('*').eq('owner_id', userId).limit(1)
    if (!journals || journals.length === 0) { setShowWelcome(true); setLoading(false); return }
    const j = journals[0]
    setJournal(j)
    await loadMemories(j.id)
    setLoading(false)
  }

  const loadMemories = async (journalId) => {
    const { data: mems } = await supabase.from('memories').select('*').eq('journal_id', journalId).order('date', { ascending: false })
    const { data: reacts } = await supabase.from('reactions').select('*').eq('memory_id', mems?.map?.(m=>m.id) || [])
    const { data: comms } = await supabase.from('comments').select('*')
    setMemories(mems || [])
    setReactions(reacts || [])
    setComments(comms || [])
  }

  const finishWelcome = async (name) => {
    const { data: j } = await supabase.from('journals').insert({ owner_id: user.id, name, created_at: new Date().toISOString() }).select().single()
    setJournal(j)
    setShowWelcome(false)
    setMemories([])
  }

  const addMemory = async ({ text, rating, date, tags, photoFile }) => {
    let photo_url = null
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      await supabase.storage.from('keeper-photos').upload(path, photoFile)
      const { data: { publicUrl } } = supabase.storage.from('keeper-photos').getPublicUrl(path)
      photo_url = publicUrl
    }
    const { data: m } = await supabase.from('memories').insert({
      journal_id: journal.id, owner_id: user.id, text, rating, date, tags, photo_url
    }).select().single()
    setMemories(prev => [m, ...prev])
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

  const sorted = [...memories].sort((a,b) => new Date(b.date)-new Date(a.date))
  const filtered = search ? sorted.filter(m => m.text.toLowerCase().includes(search.toLowerCase())) : sorted
  const top5 = [...memories].sort((a,b) => b.rating-a.rating).slice(0,5)
  const commentMem = commentMemId ? memories.find(m => m.id===commentMemId) : null

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#1a0a02', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:32, color:P.amberLight }}>📓</div>
    </div>
  )

  if (showWelcome) return <Welcome onDone={finishWelcome} />

  return (
    <div style={{ minHeight:'100vh', background:P.bg }}>
      <div style={{ background:P.walnut, padding:'16px 20px 0', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:560, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <h1 style={{ margin:0, fontFamily:'Georgia,serif', color:'#FFF8F0', fontSize:22, fontWeight:700 }}>
                {journal?.name}
              </h1>
              <p style={{ margin:'2px 0 0', fontSize:12, color:P.amberLight }}>{memories.length} memories</p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
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
            {[['journal','Journal'],['top5','Best of']].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ background:'none', border:'none', cursor:'pointer',
                padding:'8px 16px', fontSize:13, fontWeight:600,
                color: tab===id ? P.amber : '#7A5A3A',
                borderBottom: tab===id ? `2px solid ${P.amber}` : '2px solid transparent' }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'24px 14px 80px' }}>
        {tab==='journal' && <>
          <OnThisDay memories={memories} />
          <AddForm onAdd={addMemory} />
          <SearchBar value={search} onChange={setSearch} />
          {filtered.map(m => (
            <MemoryCard key={m.id} m={m} onRate={rateMemory} onDelete={deleteMemory}
              reactions={reactions} comments={comments} onReact={handleReact} onComment={setCommentMemId} />
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
                  <MemoryCard m={m} reactions={reactions} comments={comments} onReact={handleReact} onComment={setCommentMemId} />
                </div>
              </div>
            ))
          }
        </>}
      </div>

      {commentMem && <CommentsDrawer memId={commentMemId} memory={commentMem} comments={comments}
        onClose={() => setCommentMemId(null)} onAdd={addComment} />}
      {showRecap && journal && <YearRecap memories={memories} journalName={journal.name} onClose={() => setShowRecap(false)} />}
    </div>
  )
}