import { describe, it, expect, vi, afterEach } from 'vitest'
import request from 'supertest'
import { app } from '../app'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

vi.mock('@google/generative-ai/server', () => ({
  GoogleAIFileManager: vi.fn().mockImplementation(() => ({
    uploadFile: vi.fn().mockResolvedValue({
      file: { uri: 'http://example.com/image.jpg' },
    }),
  })),
}))

vi.mock('../src/services/googleGeminiService', () => ({
  analyzeImageWithGoogleGemini: vi.fn().mockResolvedValue({
    numericValue: 42,
  }),
}))

describe('POST /upload and PATCH /confirm integration', () => {
  let savedMeasureUUID: string | null = null

  afterEach(async () => {
    if (savedMeasureUUID) {
      try {
        await prisma.reading.delete({
          where: { uuid: savedMeasureUUID },
        })
      } catch (error) {
        console.warn(
          `Failed to delete measure with UUID: ${savedMeasureUUID}`,
          error,
        )
      } finally {
        savedMeasureUUID = null
      }
    }
  })

  it('should be able to upload an image and confirm it successfully', async () => {
    const randomCustomerCode = `customer-${uuidv4()}`
    const imageBase64 =
      'data:image/jpeg;base64,' + Buffer.from('test').toString('base64')

    const uploadResponse = await request(app).post('/upload').send({
      image: imageBase64,
      customer_code: randomCustomerCode,
      measure_datetime: new Date().toISOString(),
      measure_type: 'WATER',
    })

    expect(uploadResponse.status).toBe(200)
    expect(uploadResponse.body).toHaveProperty('image_url')
    expect(uploadResponse.body).toHaveProperty('measure_value')
    expect(uploadResponse.body).toHaveProperty('measure_uuid')

    savedMeasureUUID = uploadResponse.body.measure_uuid

    const savedReading = await prisma.reading.findUnique({
      where: { uuid: savedMeasureUUID },
    })

    expect(savedReading).not.toBeNull()
    expect(savedReading?.customerCode).toBe(randomCustomerCode)
    expect(savedReading?.type).toBe('WATER')
    expect(savedReading?.imageUrl).toBe(uploadResponse.body.image_url)

    const confirmResponse = await request(app).patch('/confirm').send({
      measure_uuid: savedMeasureUUID,
      confirmed_value: 100,
    })

    expect(confirmResponse.status).toBe(200)
    expect(confirmResponse.body).toHaveProperty('success', true)

    const confirmedReading = await prisma.reading.findUnique({
      where: { uuid: savedMeasureUUID },
    })

    expect(confirmedReading).not.toBeNull()
    expect(confirmedReading?.confirmedValue).toBe(100)
  })

  it('should be able to return 400 if the request data is invalid', async () => {
    const response = await request(app).patch('/confirm').send({
      measure_uuid: 'invalid-uuid',
      confirmed_value: -10,
    })

    expect(response.status).toBe(400)
    expect(response.body.error_code).toBe('INVALID_DATA')
  })

  it('should be able to return 404 if the reading is not found', async () => {
    const response = await request(app).patch('/confirm').send({
      measure_uuid: uuidv4(),
      confirmed_value: 100,
    })

    expect(response.status).toBe(404)
    expect(response.body.error_code).toBe('MEASURE_NOT_FOUND')
  })

  it('should be able to return 409 if the reading is already confirmed', async () => {
    const randomCustomerCode = `customer-${uuidv4()}`
    const imageBase64 =
      'data:image/jpeg;base64,' + Buffer.from('test').toString('base64')

    const uploadResponse = await request(app).post('/upload').send({
      image: imageBase64,
      customer_code: randomCustomerCode,
      measure_datetime: new Date().toISOString(),
      measure_type: 'WATER',
    })

    expect(uploadResponse.status).toBe(200)
    expect(uploadResponse.body).toHaveProperty('measure_uuid')

    savedMeasureUUID = uploadResponse.body.measure_uuid

    const confirmResponse = await request(app).patch('/confirm').send({
      measure_uuid: savedMeasureUUID,
      confirmed_value: 100,
    })

    expect(confirmResponse.status).toBe(200)
    expect(confirmResponse.body).toHaveProperty('success', true)

    const secondConfirmResponse = await request(app).patch('/confirm').send({
      measure_uuid: savedMeasureUUID,
      confirmed_value: 200,
    })

    expect(secondConfirmResponse.status).toBe(409)
    expect(secondConfirmResponse.body.error_code).toBe('CONFIRMATION_DUPLICATE')
  })
})
