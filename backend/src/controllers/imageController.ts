import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { uploadImageToGoogleCloud } from '../services/googleCloudStorage'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { base64Image, readingType } = req.body

    // Validação dos parâmetros
    if (
      !base64Image ||
      typeof base64Image !== 'string' ||
      !/^data:image\/\w+;base64,/.test(base64Image)
    ) {
      return res.status(400).json({ error: 'Invalid base64 image format.' })
    }

    if (!readingType || typeof readingType !== 'string') {
      return res.status(400).json({ error: 'Invalid reading type.' })
    }

    // Verificar se já existe uma leitura no mês para o tipo de leitura
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    )
    const existingReading = await prisma.reading.findFirst({
      where: {
        type: readingType,
        createdAt: {
          gte: startOfMonth,
        },
      },
    })

    if (existingReading) {
      return res
        .status(400)
        .json({ error: 'Reading already exists for this month.' })
    }

    // Chamada para o Google Gemini ou API de LLM
    const { numericValue, imageLink } =
      await uploadImageToGoogleCloud(base64Image)

    // Salvar a nova leitura no banco de dados
    const newReading = await prisma.reading.create({
      data: {
        type: readingType,
        value: numericValue,
      },
    })

    // Responder com os dados requeridos
    res.status(200).json({
      imageLink,
      guid: uuidv4(),
      numericValue,
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    res
      .status(500)
      .json({ error: 'Failed to upload image and process reading.' })
  }
}
