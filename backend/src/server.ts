import dotenv from 'dotenv'
import { app } from './app'

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
})

const PORT = process.env.PORT || 3333

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
