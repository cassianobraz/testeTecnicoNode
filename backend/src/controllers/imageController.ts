import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { validateBase64 } from '../utils/validateBase64'
import { checkExistingReadings } from '../services/readingsService'
import { extractValueFromImage } from '../services/gemineService'
import { storeImage } from '../services/googleCloudStorage'

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { base64Image, readingType } = req.body

    if (!base64Image || !validateBase64(base64Image)) {
      return res.status(400).json({ error: 'Invalid or missing base64 image.' })
    }

    if (!readingType) {
      return res.status(400).json({ error: 'Missing reading type.' })
    }

    const alreadyExists = await checkExistingReadings(readingType)
    if (alreadyExists) {
      return res
        .status(400)
        .json({ error: 'Reading already exists for this month.' })
    }

    const extractedValue = await extractValueFromImage(base64Image)

    const imageLink = await storeImage(base64Image)

    const guid = uuidv4()

    res.status(200).json({
      imageLink,
      guid,
      extractedValue,
    })
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}
