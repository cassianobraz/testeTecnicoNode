import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app'
import { PrismaClient } from '@prisma/client'

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      reading: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    })),
  }
})

describe('Confirm Image API', () => {
  let prisma: PrismaClient

  beforeEach(() => {
    prisma = new PrismaClient()
    vi.clearAllMocks()
  })

  it('should return 400 if required fields are missing or invalid', async () => {
    const response = await request(app).patch('/confirm').send({})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error_code', 'INVALID_DATA')
  })

  it.skip('should return 404 if the reading is not found', async () => {
    prisma.reading.findUnique.mockResolvedValueOnce(null)

    const response = await request(app).patch('/confirm').send({
      measure_uuid: 'invalid-uuid',
      confirmed_value: 100,
    })

    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('error_code', 'MEASURE_NOT_FOUND')
  })

  it.skip('should return 409 if the reading is already confirmed', async () => {
    prisma.reading.findUnique.mockResolvedValueOnce({
      uuid: 'valid-uuid',
      confirmedValue: 50,
    })

    const response = await request(app).patch('/confirm').send({
      measure_uuid: 'valid-uuid',
      confirmed_value: 100,
    })

    expect(response.status).toBe(409)
    expect(response.body).toHaveProperty('error_code', 'CONFIRMATION_DUPLICATE')
  })

  it.skip('should return 200 and update the confirmed value if everything is valid', async () => {
    prisma.reading.findUnique.mockResolvedValueOnce({
      uuid: 'valid-uuid',
      confirmedValue: null,
    })

    const response = await request(app).patch('/confirm').send({
      measure_uuid: 'valid-uuid',
      confirmed_value: 100,
    })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('success', true)
    expect(prisma.reading.update).toHaveBeenCalledWith({
      where: { uuid: 'valid-uuid' },
      data: { confirmedValue: 100 },
    })
  })

  it.skip('should return 500 if there is an unexpected server error', async () => {
    prisma.reading.findUnique.mockRejectedValueOnce(new Error('Server error'))

    const response = await request(app).patch('/confirm').send({
      measure_uuid: 'valid-uuid',
      confirmed_value: 100,
    })

    expect(response.status).toBe(500)
    expect(response.body).toHaveProperty('error_code', 'SERVER_ERROR')
  })
})
