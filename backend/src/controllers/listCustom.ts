import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const listCustom = async (req: Request, res: Response) => {
  const { customerCode } = req.params
  const { measureType } = req.query

  if (measureType && !['WATER', 'GAS'].includes(measureType as string)) {
    return res.status(400).json({
      error_code: 'INVALID_TYPE',
      error_description: 'Tipo de medição não permitida',
    })
  }

  try {
    const measures = await prisma.reading.findMany({
      where: {
        customerCode,
        ...(measureType ? { type: measureType as string } : {}),
      },
    })

    if (measures.length === 0) {
      return res.status(404).json({
        error_code: 'MEASURES_NOT_FOUND',
        error_description: 'Nenhuma leitura encontrada',
      })
    }

    res.status(200).json({
      customer_code: customerCode,
      measures: measures.map((measure) => ({
        measure_uuid: measure.uuid,
        measure_datetime: measure.measureDatetime,
        measure_type: measure.type,
        has_confirmed: measure.confirmedValue !== null,
        image_url: measure.imageUrl,
      })),
    })
  } catch (error) {
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      error_description: 'An unexpected server error occurred.',
    })
  }
}
