import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'resetea_auth_v1',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export function sanitize(str) {
  if (typeof str !== 'string') return str
  return str.trim().slice(0, 5000).replace(/[<>]/g, '')
}

export async function getAuthenticatedUserId() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('No autenticado')
  return user.id
}

export function logError(context, error) {
  if (import.meta.env.DEV) {
    console.error('[Resetea:' + context + ']', error?.message || error)
  }
}
