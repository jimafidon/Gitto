import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load the backend .env so MONGODB_URI, JWT_SECRET etc. are available
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') })

process.env.NODE_ENV = 'test'

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI)
})

// Clean up test data between tests
afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

afterAll(async () => {
  await mongoose.disconnect()
})
