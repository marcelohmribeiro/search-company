import "dotenv/config"

// Teto da cota grátis de Text Search Enterprise (1.000/mês) com margem. O .env só pode baixar esse valor.
const HARD_REQUEST_LIMIT = 990

function readNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallback
}

const HOST = "127.0.0.1"
const PORT = process.env.PORT
const FRONTEND_URL = process.env.FRONTEND_URL
const DATABASE_URL = process.env.DATABASE_URL
const JWT_SECRET = process.env.JWT_SECRET
const PLACES_API_URL = process.env.PLACES_API_URL || "https://places.googleapis.com/v1/places:searchText"
const MONTHLY_REQUEST_LIMIT = Math.min(readNumber(process.env.MONTHLY_REQUEST_LIMIT, HARD_REQUEST_LIMIT), HARD_REQUEST_LIMIT)
const REQUESTS_PER_MINUTE = readNumber(process.env.REQUESTS_PER_MINUTE, 10)
// A cota grátis do Google reinicia à meia-noite do dia 1 no horário do Pacífico.
const BILLING_TIME_ZONE = "America/Los_Angeles"

export const settings = {
  HOST,
  PORT,
  FRONTEND_URL,
  JWT_SECRET,
  DATABASE_URL,
  PLACES_API_URL,
  MONTHLY_REQUEST_LIMIT,
  REQUESTS_PER_MINUTE,
  BILLING_TIME_ZONE,
}
