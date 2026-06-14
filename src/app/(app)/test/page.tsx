import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Questionnaire from './questionnaire'

const ALLOWED_EMAIL = 'hect0rchicas@hotmail.com'

export default async function TestPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ALLOWED_EMAIL) {
    redirect('/dashboard')
  }

  return <Questionnaire />
}
