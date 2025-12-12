import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import chatRouter from './routes/chat'
import webhookRouter from './routes/webhooks'
import { HonoEnv } from './types'

const app = new Hono<HonoEnv>()

// --- Global Middleware ---
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors())

// --- Routes ---
app.get('/', (c) => c.json({ 
  status: 'ok', 
  service: 'Learn.ai Backend',
  version: '1.0.0' 
}))

// Mount sub-routers
app.route('/api/chat', chatRouter)
app.route('/api/webhooks', webhookRouter)

// --- Global Error Handler ---
app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({
    error: 'Internal Server Error',
    message: err.message
  }, 500)
})

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

export default app
