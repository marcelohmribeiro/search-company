/// <reference types="vite/client" />
import { z } from 'zod'

const envSchema = z.object({
	APP_NAME: z.string().default('Search Company'),
	API_URL: z.string(),
})

const env = envSchema.parse({
	APP_NAME: import.meta.env.VITE_APP_NAME,
	API_URL: import.meta.env.VITE_API_URL,
})

export const settings = {
	...env,
	STORAGE_KEYS: {
		auth: 'search-company:auth',
		googleApiKey: 'search-company:google-api-key',
		theme: 'search-company:theme',
	},
} as const

export default settings
