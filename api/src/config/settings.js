import "dotenv/config"

const HOST = "127.0.0.1"
const PORT = process.env.PORT
const FRONTEND_URL = process.env.FRONTEND_URL
const DATABASE_URL = process.env.DATABASE_URL
const JWT_SECRET = process.env.JWT_SECRET

export const settings = {
  HOST,
  PORT,
  FRONTEND_URL,
  JWT_SECRET,
  DATABASE_URL,
}
