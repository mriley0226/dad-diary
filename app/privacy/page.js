export default function PrivacyPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#FBF6EE', padding:'60px 24px' }}>
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🔒</div>
        <h1 style={{ fontFamily:'Georgia,serif', fontSize:32, fontWeight:700,
          color:'#1A1108', marginBottom:8, letterSpacing:'-.5px' }}>Your privacy, plainly stated.</h1>
        <p style={{ fontSize:16, color:'#4A3728', lineHeight:1.8, marginBottom:40 }}>
          No legal jargon. Here's exactly what happens with your photos, videos, and memories.
        </p>

        <Section title="Who can see your journal?">
          Only you — and anyone you explicitly invite by email using the Share button.
          There is no public feed, no discovery, and no way for a stranger to find your journal.
          If you haven't shared it, nobody else can see it.
        </Section>

        <Section title="Where are your photos and videos stored?">
          All media is stored in a private, encrypted storage bucket hosted by Supabase,
          which runs on Amazon Web Services (AWS) — the same infrastructure used by hospitals,
          banks, and government agencies. Files are not publicly accessible by URL.
          Only authenticated members of your journal can view them.
        </Section>

        <Section title="Who owns your content?">
          You do. Always. We make no claim to your photos, videos, or writing.
          We will never sell your content, use it for advertising, or share it with third parties.
        </Section>

        <Section title="Is your content used for AI training?">
          No. Your memories, photos, and videos are never used to train AI models —
          by us or by any service we use.
        </Section>

        <Section title="Can you delete your data?">
          Yes. You can remove any memory at any time. If you want your entire journal
          and all associated media permanently deleted, contact us and we'll do it within 48 hours.
        </Section>

        <Section title="Who built this?">
          Keeper is an independent app built for families, not for scale.
          It is not backed by advertisers. It has no interest in your data beyond keeping it safe for you.
        </Section>

        <p style={{ marginTop:48, fontSize:13, color:'#8A7A6E' }}>
          Last updated: June 2026 · <a href="https://thekeepah.com" style={{ color:'#8A7A6E' }}>thekeepah.com</a>
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:32, paddingBottom:32, borderBottom:'1px solid #EAE2D8' }}>
      <h2 style={{ fontFamily:'Georgia,serif', fontSize:18, fontWeight:700,
        color:'#2E1A0E', marginBottom:10 }}>{title}</h2>
      <p style={{ fontSize:15, color:'#4A3728', lineHeight:1.8, margin:0 }}>{children}</p>
    </div>
  )
}
