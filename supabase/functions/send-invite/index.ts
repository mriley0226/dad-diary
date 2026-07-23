import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Notifies an invited person that they've been given access to a journal.
// The access grant itself is the journal_members row the client writes — this
// function only sends the heads-up email. It is called from the browser, so it
// must verify the caller is signed in AND owns the journal before sending;
// otherwise it would be an open relay for mail from thekeepah.com.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return json({ error: 'Not signed in.' }, 401)

    const { journal_id, email } = await req.json().catch(() => ({}))
    if (!journal_id || !email) return json({ error: 'Missing journal or email.' }, 400)

    const to = String(email).trim().toLowerCase()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Who is calling?
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !user) {
      console.error('auth failed:', userErr?.message ?? 'no user for token')
      return json({ error: 'Not signed in.' }, 401)
    }

    // Do they own the journal they're inviting to? Only the owner may send.
    const { data: journal } = await supabase
      .from('journals')
      .select('id, name, owner_id')
      .eq('id', journal_id)
      .single()

    if (!journal || journal.owner_id !== user.id) {
      console.error('ownership check failed:', { journal_id, caller: user.id, owner: journal?.owner_id ?? 'journal not found' })
      return json({ error: 'You can only invite people to your own journal.' }, 403)
    }

    const journalName = journal.name || 'a private journal'
    const resendKey = Deno.env.get('RESEND_API_KEY')!
    const fromAddress = Deno.env.get('FROM_EMAIL') || 'Keeper <letters@thekeepah.com>'
    const signInUrl = 'https://thekeepah.com/auth'

    const esc = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#FBF6EE;font-family:Georgia,serif;">
        <div style="max-width:580px;margin:0 auto;padding:48px 32px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8A7A6E;">
            You've been invited
          </p>
          <p style="margin:0 0 24px;font-size:20px;line-height:1.5;color:#1A1108;">
            You've been invited to <strong>${esc(journalName)}</strong> on Keeper.
          </p>
          <hr style="border:none;border-top:1px solid #EAE2D8;margin:24px 0;" />
          <p style="margin:0 0 24px;font-size:16px;line-height:1.8;color:#4A3728;">
            Keeper is a private journal for the moments that pass too quickly.
            To view this journal, sign up with <strong>this email address</strong>
            (${esc(to)}) — that's how you'll be recognized.
          </p>
          <a href="${signInUrl}" style="display:inline-block;background:#D4854A;color:#ffffff;text-decoration:none;font-family:system-ui,sans-serif;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;">
            Sign up to view
          </a>
          <hr style="border:none;border-top:1px solid #EAE2D8;margin:40px 0 24px;" />
          <p style="margin:0;font-size:12px;color:#C5B8AC;line-height:1.6;">
            If you weren't expecting this, you can safely ignore it — nothing is
            shared with you until you sign up with this email address.
          </p>
        </div>
      </body>
      </html>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to,
        subject: `You've been invited to ${journalName} on Keeper`,
        html,
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('resend rejected:', res.status, detail)
      return json({ error: 'Email failed to send.', detail }, 502)
    }

    console.log('invite emailed to', to, 'for journal', journal.id)

    return json({ ok: true })
  } catch (e) {
    console.error('unhandled:', String(e))
    return json({ error: String(e) }, 500)
  }
})
