import { Context } from 'hono'
import { HonoEnv } from '../types'

export const chatController = {
  /**
   * Proxies a request to the Gemini API.
   * Ensures the API Key is kept secret on the server.
   */
  async generateResponse(c: Context<HonoEnv>) {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    // TODO: Here we can check the 'transactions' or 'users' table 
    // to see if they have enough credits or a Pro subscription.

    try {
      const body = await c.req.json()
      const { prompt } = body

      if (!prompt) {
        return c.json({ error: 'Prompt is required' }, 400)
      }

      // Call Gemini REST API directly
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.env.GEMINI_API_KEY}`
      
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      })

      if (!response.ok) {
        const err = await response.text()
        console.error('Gemini API Error:', err)
        return c.json({ error: 'Upstream Provider Error' }, 502)
      }

      const data = await response.json()
      return c.json(data)

    } catch (e: any) {
      console.error('Chat Controller Error:', e)
      return c.json({ error: 'Internal Server Error' }, 500)
    }
  }
}
