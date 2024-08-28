import { Router } from 'express'
import { analyzeImage } from '../controllers/imageController'

export const router = Router()

router.get('/analyze', analyzeImage)
