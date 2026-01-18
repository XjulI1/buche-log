import { Router } from 'express'
import authRoutes from './auth.routes.js'
import racksRoutes from './racks.routes.js'
import consumptionsRoutes from './consumptions.routes.js'
import syncRoutes from './sync.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/racks', racksRoutes)
router.use('/consumptions', consumptionsRoutes)
router.use('/sync', syncRoutes)

export default router
