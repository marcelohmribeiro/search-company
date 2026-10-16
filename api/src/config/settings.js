import "dotenv/config"

const PORT = process.env.PORT
const FRONTEND_URL = process.env.FRONTEND_URL
const DATABASE_URL = process.env.DATABASE_URL
const JWT_SECRET = process.env.JWT_SECRET

export const settings = {
  PORT,
  FRONTEND_URL,
  JWT_SECRET,
  DATABASE_URL,
}
