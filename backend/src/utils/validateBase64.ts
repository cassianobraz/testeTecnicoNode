export const validateBase64 = (base64: string): boolean => {
  const base64Regex = /^data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+$/
  return base64Regex.test(base64)
}
