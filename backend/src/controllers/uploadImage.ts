import { Request, Response } from 'express'
import { GoogleAIFileManager } from '@google/generative-ai/server'
import { v4 as uuidv4 } from 'uuid'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import { analyzeImageWithGoogleGemini } from '../services/googleGeminiService'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { z } from 'zod'

dotenv.config()

const prisma = new PrismaClient()
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY)

const uploadImageSchema = z.object({
  image: z.string().refine((val) => val.startsWith('data:image'), {
    message: 'Base64 image data is required and must start with "data:image".',
  }),
  customer_code: z.string().nonempty('Valid customer code is required.'),
  measure_datetime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid measure datetime is required.',
  }),
  measure_type: z.enum(['WATER', 'GAS'], {
    errorMap: () => ({ message: 'Measure type must be either WATER or GAS.' }),
  }),
})

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const validatedData = uploadImageSchema.safeParse(req.body)

    if (!validatedData.success) {
      return res.status(400).json({
        error_code: 'INVALID_DATA',
        error_description: validatedData.error.errors
          .map((err) => err.message)
          .join(', '),
      })
    }

    const { image, customer_code, measure_datetime, measure_type } =
      validatedData.data

    const startOfMonth = new Date(new Date(measure_datetime).setDate(1))
    const endOfMonth = new Date(
      new Date(measure_datetime).setMonth(startOfMonth.getMonth() + 1),
    )

    const existingReading = await prisma.reading.findFirst({
      where: {
        customerCode: customer_code,
        type: measure_type,
        measureDatetime: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
    })

    if (existingReading) {
      return res.status(409).json({
        error_code: 'DOUBLE_REPORT',
        error_description: 'Leitura do mês já realizada',
      })
    }

    const imageBuffer = Buffer.from(image.split(',')[1], 'base64')

    const tempFilePath = path.join(os.tmpdir(), `upload-${uuidv4()}.jpg`)
    fs.writeFileSync(tempFilePath, imageBuffer)

    const uploadResponse = await fileManager.uploadFile(tempFilePath, {
      mimeType: 'image/jpeg',
      displayName: 'Uploaded Image',
    })

    fs.unlinkSync(tempFilePath)

    if (!uploadResponse || !uploadResponse.file.uri) {
      return res.status(500).json({
        error_code: 'SERVER_ERROR',
        error_description: 'Failed to upload image.',
      })
    }

    const fileUri = uploadResponse.file.uri

    const analysisResult = await analyzeImageWithGoogleGemini(fileUri)
    if (!analysisResult || typeof analysisResult.numericValue !== 'number') {
      return res.status(500).json({
        error_code: 'SERVER_ERROR',
        error_description: 'Failed to analyze image.',
      })
    }

    const measureUUID = uuidv4()
    const numericValue = analysisResult.numericValue

    await prisma.reading.create({
      data: {
        uuid: measureUUID,
        customerCode: customer_code,
        measureDatetime: new Date(measure_datetime),
        type: measure_type,
        value: numericValue,
        imageUrl: fileUri,
      },
    })

    res.status(200).json({
      image_url: fileUri,
      measure_value: numericValue,
      measure_uuid: measureUUID,
    })
  } catch (error) {
    console.error('Error processing image:', error)
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      error_description: 'An unexpected server error occurred.',
    })
  }
}
