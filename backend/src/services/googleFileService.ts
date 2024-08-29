import axios from 'axios'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables.')
}

export const uploadImageToGoogle = async (
  base64Image: string,
): Promise<{ uri: string } | null> => {
  if (!base64Image) {
    throw new Error('Base64 image data is required.')
  }

  try {
    const response = await axios.post(
      'https://gemini.googleapis.com/v1/models/gemini:analyze',
      {
        image: {
          content: base64Image,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GEMINI_API_KEY}`,
        },
      },
    )

    const imageLink = response.data.uri
    return { uri: imageLink }
  } catch (error) {
    console.error(
      'Error uploading image to Google:',
      error.response?.data || error.message,
    )
    throw new Error('Failed to upload image to Google.')
  }
}
