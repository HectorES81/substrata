import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SetupForm from './setup-form'

export default async function SetupPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard')

  const { data: profile } = await supabase
    .schema('substrata')
    .from('profiles')
    .select('context_set, relationship_status, life_focus, age_range, gender_identity, has_kids')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <SetupForm
      userId={user.id}
      existing={{
        relationship_status: profile?.relationship_status ?? null,
        life_focus: profile?.life_focus ?? null,
        age_range: profile?.age_range ?? null,
        gender_identity: profile?.gender_identity ?? null,
        has_kids: profile?.has_kids ?? null,
      }}
    />
  )
}
