import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const confirmImage = async (req: Request, res: Response) => {
  const { measureUuid, confirmedValue } = req.body

  if (typeof measureUuid !== 'string' || typeof confirmedValue !== 'number') {
    return res.status(400).json({
      error_code: 'INVALID_DATA',
      error_description: 'Invalid data format.',
    })
  }

  try {
    const reading = await prisma.reading.findUnique({
      where: { uuid: measureUuid },
    })

    if (!reading) {
      return res.status(404).json({
        error_code: 'MEASURE_NOT_FOUND',
        error_description: 'Leitura não encontrada',
      })
    }

    if (reading.confirmedValue !== null) {
      return res.status(409).json({
        error_code: 'CONFIRMATION_DUPLICATE',
        error_description: 'Leitura já confirmada',
      })
    }

    await prisma.reading.update({
      where: { uuid: measureUuid },
      data: { confirmedValue },
    })

    res.status(200).json({ success: true })
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
