import { Context } from 'hono'
import { streamSSE } from 'hono/streaming'
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
  },

  /**
   * Proxies a streaming request to the Gemini API.
   * Ensures the API Key is kept secret on the server.
   */
  async generateStreamResponse(c: Context<HonoEnv>) {
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

      // Use alt=sse to get a streaming response from Gemini
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent?key=${c.env.GEMINI_API_KEY}&alt=sse`

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      })

      if (!geminiResponse.ok || !geminiResponse.body) {
        const err = await geminiResponse.text()
        console.error('Gemini API Error:', err)
        return c.json({ error: 'Upstream Provider Error' }, 502)
      }

      return streamSSE(c, async (stream) => {
        // Pipe the response from Gemini directly to the client
        await stream.pipe(geminiResponse.body)

        // The stream automatically closes when the source is exhausted
      })

    } catch (e: any) {
      console.error('Chat Controller Error:', e)
      return c.json({ error: 'Internal Server Error' }, 500)
    }
  }
}
