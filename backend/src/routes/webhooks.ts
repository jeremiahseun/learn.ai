import { Hono } from 'hono'
import { paymentController } from '../controllers/paymentController'
import { HonoEnv } from '../types'

const webhookRouter = new Hono<HonoEnv>()

// Webhooks do not use the standard auth middleware.
// They use signature verification inside the controller.
webhookRouter.post('/dodo', (c) => paymentController.handleWebhook(c))

export default webhookRouter
