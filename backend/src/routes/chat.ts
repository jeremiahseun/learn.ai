import { Hono } from 'hono'
import { chatController } from '../controllers/chatController'
import { authMiddleware } from '../middleware/authMiddleware'
import { HonoEnv } from '../types'

const chatRouter = new Hono<HonoEnv>()

// Apply authentication to all chat routes
chatRouter.use('*', authMiddleware)

chatRouter.post('/', (c) => chatController.generateResponse(c))
chatRouter.post('/stream', (c) => chatController.generateStreamResponse(c))

export default chatRouter
