import { describe, it, expect, afterEach } from 'vitest'
import request from 'supertest'
import { app } from '../app'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

describe('POST /upload and GET /:customerCode/list integration', () => {
  let savedMeasureUUID: string | null = null
  let randomCustomerCode: string | null = null

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
        randomCustomerCode = null
      }
    }
  })

  it('should be able to upload an image and then list it successfully', async () => {
    randomCustomerCode = `customer-${uuidv4()}`
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

    const listResponse = await request(app)
      .get(`/${randomCustomerCode}/list`)
      .query({ measure_type: 'WATER' })

    expect(listResponse.status).toBe(200)
    expect(listResponse.body.customer_code).toBe(randomCustomerCode)
    expect(listResponse.body.measures).toHaveLength(1)

    const receivedMeasure = listResponse.body.measures[0]

    expect(receivedMeasure.measure_uuid).toBe(savedMeasureUUID)
    expect(receivedMeasure.measure_type).toBe('WATER')
    expect(receivedMeasure.image_url).toBe(uploadResponse.body.image_url)

    expect(receivedMeasure.has_confirmed).toBe(false)
  })

  it('should be able to return 400 if params are invalid', async () => {
    const response = await request(app).get('/customer123/list').query({
      measure_type: 'INVALID_TYPE',
    })

    expect(response.status).toBe(400)
    expect(response.body.error_code).toBe('INVALID_QUERY')
  })

  it('should return 404 if no readings are found', async () => {
    const response = await request(app)
      .get(`/${randomCustomerCode}/list`)
      .query({
        measure_type: 'WATER',
      })

    expect(response.status).toBe(404)
    expect(response.body.error_code).toBe('MEASURES_NOT_FOUND')
  })
})
