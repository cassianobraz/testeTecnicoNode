import axios from 'axios'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables.')
}

export const analyzeImageWithGoogleGemini = async (base64Image: string) => {
  try {
    const response = await axios.post(
      'https://vision.googleapis.com/v1/images:annotate',
      {
        requests: [
          {
            image: {
              content: base64Image.split(',')[ 1 ],
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
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
          key: process.env.GEMINI_API_KEY,
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
