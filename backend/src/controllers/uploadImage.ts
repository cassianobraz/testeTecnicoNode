import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { analyzeImageWithGoogleGemini } from '../services/googleGeminiService'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

const isValidBase64Image = (image: unknown): boolean => {
  return typeof image === 'string' && /^data:image\/\w+;base64,/.test(image)
}

const isValidMeasureType = (type: unknown): boolean => {
  return ['WATER', 'GAS'].includes(type as string)
}

const isValidCustomerCode = (code: unknown): boolean => {
  return typeof code === 'string' && code.trim().length > 0
}

const isValidDateTime = (datetime: unknown): boolean => {
  return !isNaN(Date.parse(datetime as string))
}

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { image, customerCode, measureDatetime, measureType } = req.body

    if (!isValidBase64Image(image)) {
      return res.status(400).json({
        error_code: 'INVALID_DATA',
        error_description: 'Invalid base64 image format.',
      })
    }

    if (!isValidCustomerCode(customerCode)) {
      return res.status(400).json({
        error_code: 'INVALID_DATA',
        error_description: 'Invalid customer code.',
      })
    }

    if (!isValidDateTime(measureDatetime)) {
      return res.status(400).json({
        error_code: 'INVALID_DATA',
        error_description: 'Invalid measure datetime.',
      })
    }

    if (!isValidMeasureType(measureType)) {
      return res.status(400).json({
        error_code: 'INVALID_DATA',
        error_description: 'Invalid measure type.',
      })
    }

    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    )

    const existingReading = await prisma.reading.findFirst({
      where: {
        type: measureType,
        customerCode,
        createdAt: {
          gte: startOfMonth,
        },
      },
    })

    if (existingReading) {
      return res.status(409).json({
        error_code: 'DOUBLE_REPORT',
        error_description: 'Leitura do mês já realizada',
      })
    }

    const { numericValue, imageLink } =
      await analyzeImageWithGoogleGemini(image)

    const newReading = await prisma.reading.create({
      data: {
        uuid: uuidv4(),
        type: measureType,
        customerCode,
        value: numericValue,
        measureDatetime: new Date(measureDatetime),
        imageUrl: imageLink,
      },
    })

    res.status(200).json({
      image_url: newReading.imageUrl,
      measure_value: newReading.value,
      measure_uuid: newReading.uuid,
    })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        error_code: 'INVALID_DATA',
        error_description: error.message,
      })
    } else {
      res.status(500).json({
        error_code: 'SERVER_ERROR',
        error_description: 'An unexpected server error occurred.',
      })
    }
  }
}
