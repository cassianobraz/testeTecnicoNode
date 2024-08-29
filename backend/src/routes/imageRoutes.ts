import { Router } from 'express'
import { uploadImage } from '../controllers/uploadImage'
import { confirmImage } from '../controllers/confirmImage'
import { listCustom } from '../controllers/listCustom'

export const router = Router()

router.post('/upload', uploadImage)

router.patch('/confirm', confirmImage)

router.get('/:customerCode/list', listCustom)
