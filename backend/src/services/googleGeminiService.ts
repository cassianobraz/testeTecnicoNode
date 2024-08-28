import axios from 'axios'

const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY

if (!GOOGLE_GEMINI_API_KEY) {
  throw new Error(
    'GOOGLE_GEMINI_API_KEY is not defined in environment variables.',
  )
}

export const analyzeImageWithGoogleGemini = async (base64Image: string) => {
  try {
    const response = await axios.post(
      'https://vision.googleapis.com/v1/images:annotate',
      {
        requests: [
          {
            image: {
              content: base64Image.split(',')[ 1 ], // Remove 'data:image/png;base64,' prefix
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION', // Ou o tipo de detecção que você está usando
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          key: process.env.GOOGLE_GEMINI_API_KEY, // Certifique-se de que a chave está correta
        },
      },
    )

    return response.data
  } catch (error) {
    console.error(
      'Error analyzing image with Google Gemini:',
      error.response?.data || error.message,
    )
    throw new Error('Failed to analyze image with Google Gemini.')
  }
}
