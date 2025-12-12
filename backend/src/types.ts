import { User } from '@supabase/supabase-js'

export type Bindings = {
  SUPABASE_URL: string
  SUPABASE_KEY: string
  GEMINI_API_KEY: string
  DODO_PAYMENTS_WEBHOOK_KEY: string
}

export type Variables = {
  user: User | null
}

export type HonoEnv = {
  Bindings: Bindings
  Variables: Variables
}
