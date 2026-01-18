import { Router } from 'express'
import * as syncController from '../controllers/sync.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.post('/', syncController.sync)
router.get('/status', syncController.getStatus)

export default router
