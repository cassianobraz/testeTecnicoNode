import { describe, it, expect, vi } from 'vitest'
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { listCustom } from './listCustom'

const prisma = new PrismaClient()

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    reading: {
      findMany: vi.fn(),
    },
  })),
}))

describe('listCustom', () => {
  it('should return 400 if measure_type is invalid', async () => {
    const req = {
      params: { customerCode: '123' },
      query: { measure_type: 'INVALID' },
    } as unknown as Request
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response

    await listCustom(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error_code: 'INVALID_TYPE',
      error_description: 'Tipo de medição não permitida',
    })
  })

  it.skip('should return 404 if no readings are found', async () => {
    const req = {
      params: { customerCode: '123' },
      query: { measure_type: 'GAS' },
    } as unknown as Request
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response

    const prismaClient = prisma as any as {
      reading: { findMany: (params: any) => Promise<any[]> }
    }
    prismaClient.reading.findMany.mockResolvedValue([])

    await listCustom(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      error_code: 'MEASURES_NOT_FOUND',
      error_description: 'Nenhuma leitura encontrada',
    })
  })

  it.skip('should return 200 and a list of readings', async () => {
    const req = {
      params: { customerCode: '123' },
      query: { measure_type: 'WATER' },
    } as unknown as Request
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response

    const prismaClient = prisma as any as {
      reading: { findMany: (params: any) => Promise<any[]> }
    }
    prismaClient.reading.findMany.mockResolvedValue([
      {
        uuid: 'uuid-1',
        measureDatetime: new Date(),
        type: 'WATER',
        confirmedValue: true,
        imageUrl: 'http://example.com/image1.jpg',
      },
    ])

    await listCustom(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      customer_code: '123',
      measures: [
        {
          measure_uuid: 'uuid-1',
          measure_datetime: expect.any(String),
          measure_type: 'WATER',
          has_confirmed: true,
          image_url: 'http://example.com/image1.jpg',
        },
      ],
    })
  })

  it.skip('should return 500 if an error occurs', async () => {
    const req = {
      params: { customerCode: '123' },
      query: { measure_type: 'GAS' },
    } as unknown as Request
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response

    const prismaClient = prisma as any as {
      reading: { findMany: (params: any) => Promise<any[]> }
    }
    prismaClient.reading.findMany.mockImplementation(() => {
      throw new Error('Database error')
    })

    await listCustom(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error_code: 'SERVER_ERROR',
      error_description: 'An unexpected server error occurred.',
    })
  })
})
