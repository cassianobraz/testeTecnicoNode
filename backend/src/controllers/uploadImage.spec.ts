import { describe, it, expect, vi, afterEach } from 'vitest'
import request from 'supertest'
import { app } from '../app'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

// Mocks
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

describe('POST /upload', () => {
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

  it('should be able to upload an image and process it successfully', async () => {
    vi.spyOn(prisma.reading, 'findFirst').mockResolvedValueOnce(null)

    const randomCustomerCode = `customer-${uuidv4()}`
    const imageBase64 =
      'data:image/jpeg;base64,' + Buffer.from('test').toString('base64')
    const response = await request(app).post('/upload').send({
      image: imageBase64,
      customer_code: randomCustomerCode,
      measure_datetime: new Date().toISOString(),
      measure_type: 'WATER',
    })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('image_url')
    expect(response.body).toHaveProperty('measure_value')
    expect(response.body).toHaveProperty('measure_uuid')

    savedMeasureUUID = response.body.measure_uuid

    const savedReading = await prisma.reading.findUnique({
      where: { uuid: savedMeasureUUID },
    })

    expect(savedReading).not.toBeNull()
    expect(savedReading?.customerCode).toBe(randomCustomerCode)
    expect(savedReading?.type).toBe('WATER')
    expect(savedReading?.imageUrl).toBe(response.body.image_url)
  })

  it('should return 400 if the request data is invalid', async () => {
    const response = await request(app).post('/upload').send({
      image: 'invalid_base64',
      customer_code: '',
      measure_datetime: 'invalid_date',
      measure_type: 'INVALID_TYPE',
    })

    expect(response.status).toBe(400)
    expect(response.body.error_code).toBe('INVALID_DATA')
  })

  it('should return 409 if a reading already exists for the month', async () => {
    vi.spyOn(prisma.reading, 'findFirst').mockResolvedValueOnce({
      uuid: 'existing-uuid',
      customerCode: 'customer123',
      measureDatetime: new Date(),
      type: 'WATER',
      value: 50,
      imageUrl: 'http://example.com/old.jpg',
      confirmedValue: null,
    } as any)

    const imageBase64 =
      'data:image/jpeg;base64,' + Buffer.from('test').toString('base64')
    const response = await request(app).post('/upload').send({
      image: imageBase64,
      customer_code: 'customer123',
      measure_datetime: new Date().toISOString(),
      measure_type: 'WATER',
    })

    expect(response.status).toBe(409)
    expect(response.body.error_code).toBe('DOUBLE_REPORT')
  })
})
