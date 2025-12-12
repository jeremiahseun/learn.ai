import { Context, Next } from 'hono'
import { getUserFromToken } from '../services/supabaseService'
import { HonoEnv } from '../types'

export const authMiddleware = async (c: Context<HonoEnv>, next: Next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader) {
    return c.json({ error: 'Missing Authorization Header' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const user = await getUserFromToken(c.env, token)

  if (!user) {
    return c.json({ error: 'Invalid or Expired Token' }, 401)
  }

  // Attach user to context for downstream controllers
  c.set('user', user)
  
  await next()
}
