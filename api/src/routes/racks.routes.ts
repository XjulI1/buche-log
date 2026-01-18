import { Router } from 'express'
import * as racksController from '../controllers/racks.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', racksController.getAll)
router.get('/:id', racksController.getById)
router.post('/', racksController.create)
router.put('/:id', racksController.update)
router.delete('/:id', racksController.remove)

export default router
