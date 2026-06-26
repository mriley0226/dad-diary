import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const today = new Date().toISOString().split('T')[0]

  const { data: letters, error } = await supabase
    .from('letters')
    .select('*, journals(name)')
    .lte('deliver_at', today)
    .is('delivered_at', null)

  if (error) return new Response(error.message, { status: 500 })
  if (!letters?.length) return new Response('No letters to deliver today.', { status: 200 })

  const resendKey = Deno.env.get('RESEND_API_KEY')!
  const fromAddress = Deno.env.get('FROM_EMAIL') || 'Keeper <letters@keeperjournal.app>'

  for (const letter of letters) {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#FBF6EE;font-family:Georgia,serif;">
        <div style="max-width:580px;margin:0 auto;padding:48px 32px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8A7A6E;">
            A letter from ${letter.journals?.name ?? 'someone who cares'}
          </p>
          <hr style="border:none;border-top:1px solid #EAE2D8;margin:24px 0;" />
          <div style="font-size:17px;line-height:1.9;color:#1A1108;white-space:pre-wrap;">${letter.body.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
          <hr style="border:none;border-top:1px solid #EAE2D8;margin:40px 0 24px;" />
          <p style="margin:0;font-size:12px;color:#C5B8AC;line-height:1.6;">
            This letter was written for you and scheduled to arrive today using Keeper —
            a private memory journal for families.
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
        to: letter.recipient_email,
        subject: letter.subject,
        html,
      }),
    })

    if (res.ok) {
      await supabase.from('letters')
        .update({ delivered_at: new Date().toISOString() })
        .eq('id', letter.id)
    }
  }

  return new Response(`Processed ${letters.length} letter(s).`, { status: 200 })
})
