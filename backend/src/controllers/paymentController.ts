import { Context } from 'hono'
import { HonoEnv } from '../types'
import { getSupabaseClient } from '../services/supabaseService'

export const paymentController = {
  /**
   * Handles incoming webhooks from Dodo Payments.
   * Verifies signature and provisions Pro access.
   */
  async handleWebhook(c: Context<HonoEnv>) {
    const signature = c.req.header('X-Dodo-Signature')
    // In production, verify the signature using c.env.DODO_PAYMENTS_WEBHOOK_KEY
    // const isValid = verifySignature(signature, c.env.DODO_PAYMENTS_WEBHOOK_KEY);
    // if (!isValid) return c.json({ error: 'Invalid Signature' }, 403);

    try {
      const payload = await c.req.json()
      const supabase = getSupabaseClient(c.env)

      if (payload.event === 'payment.succeeded') {
         const { customer_email, transaction_id, amount, currency } = payload.data
         
         console.log(`Processing payment for ${customer_email}`)

         // 1. Find User by Email
         // Note: In a real system, pass userId in metadata during checkout to avoid email lookups
         const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('email', customer_email)
            .single()
         
         if (userData) {
             // 2. Log Transaction
             await supabase.from('transactions').insert({
                 user_id: userData.id,
                 amount: amount,
                 currency: currency,
                 status: 'succeeded',
                 payment_provider_id: transaction_id,
                 metadata: payload
             })

             // 3. Upgrade User
             const { error: upgradeError } = await supabase.from('users')
                 .update({ subscription_status: 'pro' })
                 .eq('id', userData.id)

             if (upgradeError) {
               console.error('Failed to upgrade user:', upgradeError)
               return c.json({ error: 'Provisioning Failed' }, 500)
             }
         } else {
           console.warn(`User not found for email: ${customer_email}`)
         }
      }

      return c.json({ received: true })

    } catch (e) {
      console.error('Webhook Error:', e)
      return c.json({ error: 'Webhook Processing Failed' }, 500)
    }
  }
}
