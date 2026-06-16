import { createClient } from '@/lib/supabase/server'

const ALLOWED_EMAIL = 'hect0rchicas@hotmail.com'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ALLOWED_EMAIL) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const uid = user.id

  // Delete in dependency order — cascade handles question_responses + session_reports
  await supabase.schema('substrata').from('highlights').delete().eq('user_id', uid)
  await supabase.schema('substrata').from('section_annotations').delete().eq('user_id', uid)
  await supabase.schema('substrata').from('test_sessions').delete().eq('user_id', uid)

  return Response.json({ ok: true })
}
