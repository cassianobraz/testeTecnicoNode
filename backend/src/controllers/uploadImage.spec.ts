import request from 'supertest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from '../app'
import { PrismaClient } from '@prisma/client'
import { GoogleAIFileManager } from '@google/generative-ai/server'
import { analyzeImageWithGoogleGemini } from '../services/googleGeminiService'

// Mocks
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      reading: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    })),
  }
})

vi.mock('@google/generative-ai/server', () => {
  return {
    GoogleAIFileManager: vi.fn().mockImplementation(() => ({
      uploadFile: vi.fn(),
    })),
  }
})

vi.mock('../services/googleGeminiService', () => ({
  analyzeImageWithGoogleGemini: vi.fn(),
}))

describe('Upload Image API', () => {
  let prisma: PrismaClient
  let fileManager: GoogleAIFileManager

  beforeEach(() => {
    prisma = new PrismaClient()
    fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY)

    fileManager.uploadFile.mockResolvedValue({
      file: { uri: 'https://example.com/image.jpg' },
    })

    analyzeImageWithGoogleGemini.mockResolvedValue({ numericValue: 50 })
  })

  it('should be able to return 400 if required fields are missing', async () => {
    const response = await request(app).post('/upload').send({})
    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error_code', 'INVALID_DATA')
  })

  it.skip('should be able to return 409 if there is already a reading for the month', async () => {
    prisma.reading.findFirst.mockResolvedValueOnce({ id: 1 })

    const response = await request(app).post('/upload').send({
      image: 'data:image/jpeg;base64,/9j/4AAQSk...',
      customer_code: '123456',
      measure_datetime: '2024-08-29T10:00:00Z',
      measure_type: 'WATER',
    })

    expect(response.status).toBe(409)
    expect(response.body).toHaveProperty('error_code', 'DOUBLE_REPORT')
  })

  it('should be able to return 500 if image upload fails', async () => {
    prisma.reading.findFirst.mockResolvedValueOnce(null)
    fileManager.uploadFile.mockResolvedValueOnce({ file: { uri: null } })

    const response = await request(app).post('/upload').send({
      image: 'data:image/jpeg;base64,/9j/4AAQSk...',
      customer_code: '123456',
      measure_datetime: '2024-08-29T10:00:00Z',
      measure_type: 'WATER',
    })

    expect(response.status).toBe(500)
    expect(response.body).toHaveProperty('error_code', 'SERVER_ERROR')
  })

  it.skip('should be able to return 200 and create a new reading', async () => {
    prisma.reading.findFirst.mockResolvedValueOnce(null)
    fileManager.uploadFile.mockResolvedValueOnce({
      file: { uri: 'https://example.com/image.jpg' },
    })
    analyzeImageWithGoogleGemini.mockResolvedValueOnce({ numericValue: 50 })

    const response = await request(app).post('/upload').send({
      image: 'data:image/jpeg;base64,/9j/4AAQSk...',
      customer_code: '123456',
      measure_datetime: '2024-08-29T10:00:00Z',
      measure_type: 'WATER',
    })

    console.log('Response Status:', response.status)
    console.log('Response Body:', response.body)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty(
      'image_url',
      'https://example.com/image.jpg',
    )
    expect(response.body).toHaveProperty('measure_value', 50)
    expect(response.body).toHaveProperty('measure_uuid')
  })
})
