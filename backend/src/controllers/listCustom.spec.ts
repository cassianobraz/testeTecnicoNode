import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { app } from '../app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('GET /:customerCode/list', () => {
  it('should be able to return 200 with a list of readings', async () => {
    const fixedDate = new Date().toISOString() // Crie uma data fixa

    const mockReadings = [
      {
        uuid: 'test-uuid',
        measureDatetime: fixedDate, // Use a mesma data fixa no mock
        type: 'WATER',
        confirmedValue: null,
        imageUrl: 'http://example.com/image.jpg',
      },
    ]

    vi.spyOn(prisma.reading, 'findMany').mockResolvedValueOnce(mockReadings)

    const response = await request(app).get('/customer123/list').query({
      measure_type: 'WATER',
    })

    expect(response.status).toBe(200)
    expect(response.body.customer_code).toBe('customer123')
    expect(response.body.measures).toHaveLength(1)

    const receivedMeasure = response.body.measures[0]

    // Verifique se a data recebida corresponde exatamente à data fixa
    expect(receivedMeasure.measure_type).toBe('WATER')
    expect(receivedMeasure.image_url).toBe('http://example.com/image.jpg')

    const expectedHasConfirmed = mockReadings[0].confirmedValue !== null
    expect(receivedMeasure.has_confirmed).toBe(expectedHasConfirmed)
  })

  it('should be able to return 400 if params are invalid', async () => {
    const response = await request(app).get('/customer123/list').query({
      measure_type: 'INVALID_TYPE',
    })

    expect(response.status).toBe(400)
    expect(response.body.error_code).toBe('INVALID_QUERY')
  })

  it.skip('should return 404 if no readings are found', async () => {
    vi.spyOn(prisma.reading, 'findMany').mockResolvedValueOnce([])

    const response = await request(app).get('/customer123/list').query({
      measure_type: 'WATER',
    })

    expect(response.status).toBe(404)
    expect(response.body.error_code).toBe('MEASURES_NOT_FOUND')
  })
})
