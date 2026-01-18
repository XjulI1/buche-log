import { Router } from 'express'
import * as consumptionsController from '../controllers/consumptions.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', consumptionsController.getAll)
router.get('/:id', consumptionsController.getById)
router.post('/', consumptionsController.create)
router.put('/:id', consumptionsController.update)
router.delete('/:id', consumptionsController.remove)

export default router
