import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_ANALYZE_URL =
  'https://gemini.googleapis.com/v1/models/gemini:analyze'

export const analyzeImageWithGoogleGemini = async (
  imageUri: string,
): Promise<{ numericValue: number } | null> => {
  if (!imageUri) {
    throw new Error('Image URI is required.')
  }

  try {
    const response = await axios.post(
      GEMINI_ANALYZE_URL,
      {
        imageUri,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GEMINI_API_KEY}`,
        },
      },
    )

    // Supondo que o endpoint retorne o valor numérico no formato JSON
    const result = response.data
    return { numericValue: result.numericValue }
  } catch (error) {
    console.error(
      'Error analyzing image with Google Gemini:',
      error.response?.data || error.message,
    )
    throw new Error('Failed to analyze image with Google Gemini.')
  }
}
