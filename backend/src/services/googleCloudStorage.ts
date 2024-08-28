import { Storage } from '@google-cloud/storage'

// Instancia o cliente do Google Cloud Storage
const storage = new Storage()

/**
 * Faz o upload de uma imagem para o Google Cloud Storage.
 * @param bucketName O nome do bucket onde a imagem será armazenada.
 * @param fileName O nome do arquivo a ser armazenado.
 * @param buffer O buffer da imagem em base64.
 * @returns Um link temporário para a imagem.
 */
export const uploadImageToGoogleCloud = async (
  bucketName: string,
  fileName: string,
  buffer: Buffer,
): Promise<string> => {
  try {
    // Obtém o bucket usando o nome passado como parâmetro
    const bucket = storage.bucket(bucketName)
    const file = bucket.file(fileName)

    // Faz o upload da imagem para o bucket
    await file.save(buffer, { resumable: false, contentType: 'image/jpeg' })

    // Gera um URL assinado para acesso temporário ao arquivo
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60, // URL expira em 1 hora
    })

    return url
  } catch (error) {
    console.error('Erro ao fazer upload da imagem para o Google Cloud:', error)
    throw new Error('Erro ao fazer upload da imagem')
  }
}
