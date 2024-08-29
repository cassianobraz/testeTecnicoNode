import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const bodySchema = z.object({
  measure_uuid: z.string().uuid('O UUID da medição deve ser um UUID válido'),
  confirmed_value: z
    .number()
    .min(0, 'O valor confirmado deve ser um número positivo'),
})

export const confirmImage = async (req: Request, res: Response) => {
  const bodyValidation = bodySchema.safeParse(req.body)
  if (!bodyValidation.success) {
    return res.status(400).json({
      error_code: 'INVALID_DATA',
      error_description: bodyValidation.error.errors
        .map((err) => err.message)
        .join(', '),
    })
  }

  const { measure_uuid, confirmed_value } = bodyValidation.data

  try {
    const reading = await prisma.reading.findUnique({
      where: { uuid: measure_uuid },
    })

    if (!reading) {
      return res.status(404).json({
        error_code: 'MEASURE_NOT_FOUND',
        error_description: 'Leitura não encontrada.',
      })
    }

    if (reading.confirmedValue !== null) {
      return res.status(409).json({
        error_code: 'CONFIRMATION_DUPLICATE',
        error_description: 'Leitura já confirmada.',
      })
    }

    await prisma.reading.update({
      where: { uuid: measure_uuid },
      data: { confirmedValue: confirmed_value },
    })

    res.status(200).json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        error_code: 'SERVER_ERROR',
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
