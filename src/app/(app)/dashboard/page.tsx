import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // TODO: Replace with real profile + session data
  // const { data: profile } = await supabase
  //   .schema(process.env.APP_SCHEMA!)
  //   .from('profiles')
  //   .select('*')
  //   .eq('id', user!.id)
  //   .single()

  return (
    <div className="min-h-screen" style={{ background: 'var(--obsidian)' }}>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--parchment)' }}>
          Welcome to Substrata
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--stone)' }}>
          Signed in as {user?.email}
        </p>
        <p style={{ color: 'var(--sand)' }}>
          Your personality profile is waiting to be discovered.
        </p>
      </div>
    </div>
  )
}
