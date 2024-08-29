import axios from 'axios'

export const downloadImageAsBase64 = async (
  imageUrl: string,
): Promise<string> => {
  if (!imageUrl) {
    throw new Error('Image URL is undefined or empty.')
  }

  try {
    // Faz o download da imagem
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })

    // Converte os dados da imagem para Base64
    const base64Image = Buffer.from(response.data, 'binary').toString('base64')

    return base64Image
  } catch (error) {
    console.error('Error downloading image as Base64:', error.message)
    throw new Error('Failed to download image as Base64.')
  }
}
