import { createClient } from '@supabase/supabase-js'
import { Bindings } from '../types'

export const getSupabaseClient = (env: Bindings) => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_KEY)
}

export const getUserFromToken = async (env: Bindings, token: string) => {
  const supabase = getSupabaseClient(env)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error) {
    console.error('Auth Error:', error.message)
    return null
  }
  return user
}
