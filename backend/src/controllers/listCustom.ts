import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const paramsSchema = z.object({
  customerCode: z.string().min(1, 'O código do cliente é obrigatório'),
})

const querySchema = z.object({
  measure_type: z
    .string()
    .optional()
    .refine(
      (value) => !value || ['WATER', 'GAS'].includes(value.toUpperCase()),
      'Tipo de medição não permitida',
    ),
})

export const listCustom = async (req: Request, res: Response) => {
  const paramsValidation = paramsSchema.safeParse(req.params)
  if (!paramsValidation.success) {
    return res.status(400).json({
      error_code: 'INVALID_PARAMS',
      error_description: paramsValidation.error.errors
        .map((err) => err.message)
        .join(', '),
    })
  }

  const { customerCode } = paramsValidation.data

  const queryValidation = querySchema.safeParse(req.query)
  if (!queryValidation.success) {
    return res.status(400).json({
      error_code: 'INVALID_QUERY',
      error_description: queryValidation.error.errors
        .map((err) => err.message)
        .join(', '),
    })
  }

  const { measure_type } = queryValidation.data

  try {
    const measures = await prisma.reading.findMany({
      where: {
        customerCode,
        ...(measure_type ? { type: measure_type.toUpperCase() } : {}),
      },
    })

    if (!Array.isArray(measures) || measures.length === 0) {
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
    console.error('Error listing measures:', error)
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      error_description: 'An unexpected server error occurred.',
    })
  }
}
