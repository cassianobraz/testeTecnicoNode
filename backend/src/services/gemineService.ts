// services/geminiService.ts
import axios from 'axios'

export const extractValueFromImage = async (
  base64Image: string,
): Promise<number> => {
  const response = await axios.post('https://gemini-api-url.com/analyze', {
    image: base64Image,
  })
  return response.data.extractedValue
}
