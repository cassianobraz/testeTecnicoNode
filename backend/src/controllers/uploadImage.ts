import { Request, Response } from 'express'
import { analyzeImageWithGoogleGemini } from '../services/googleGeminiService'
import { uploadImageToGoogle } from '../services/googleFileService'
import { v4 as uuidv4 } from 'uuid'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const isValidMeasureType = (type: unknown): boolean => {
  return [ 'WATER', 'GAS' ].includes(type as string)
}

const isValidCustomerCode = (code: unknown): boolean => {
  return typeof code === 'string' && code.trim().length > 0
}

const isValidDateTime = (datetime: unknown): boolean => {
  return !isNaN(Date.parse(datetime as string))
}

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { imageBase64, customerCode, measureDatetime, measureType } = req.body

    // Verificar se a imagem base64 foi fornecida
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        error_code: 'INVALID_DATA',
        error_description: 'Base64 image data is required.',
      })
    }

    // Validar os parâmetros adicionais
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

    // Fazer o upload da imagem para o Google e obter o URI
    const uploadResponse = await uploadImageToGoogle(imageBase64)

    if (!uploadResponse || !uploadResponse.uri) {
      return res.status(500).json({
        error_code: 'SERVER_ERROR',
        error_description: 'Failed to upload image.',
      })
    }

    // Analisar a imagem com Google Gemini
    const analysisResult = await analyzeImageWithGoogleGemini(
      uploadResponse.uri,
    )

    if (!analysisResult || typeof analysisResult.numericValue !== 'number') {
      return res.status(500).json({
        error_code: 'SERVER_ERROR',
        error_description: 'Failed to analyze image.',
      })
    }

    const { numericValue } = analysisResult

    // Verificar se já existe uma leitura do mês
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
        error_description: 'Leitura do mês já realizada.',
      })
    }

    // Criar nova leitura
    const newReading = await prisma.reading.create({
      data: {
        uuid: uuidv4(),
        type: measureType,
        customerCode,
        value: numericValue,
        measureDatetime: new Date(measureDatetime),
        imageUrl: uploadResponse.uri,
      },
    })

    res.status(200).json({
      image_url: newReading.imageUrl,
      measure_value: newReading.value,
      measure_uuid: newReading.uuid,
    })
  } catch (error) {
    console.error('Error processing image:', error)

    res.status(500).json({
      error_code: 'SERVER_ERROR',
      error_description: 'An unexpected server error occurred.',
    })
  }
}
