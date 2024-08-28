import { Router } from 'express'
import { uploadImage } from '../controllers/imageController'

export const router = Router()

router.post('/upload', uploadImage)

router.patch('/confirm')

router.get('/:id/list')
