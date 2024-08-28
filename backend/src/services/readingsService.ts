import { getMonthlyReadings } from './databaseService'

export const checkExistingReadings = async (
  readingType: string,
): Promise<boolean> => {
  const currentMonthReadings = await getMonthlyReadings(new Date(), readingType)
  return currentMonthReadings.length > 0
}
