import { createServerOnlyFn } from '@tanstack/react-start'

function requiredServerEnv(name: string, value: string | undefined): string {
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`)
	}
	return value
}

/** Server-only Google Maps key for geocoding + routes. Falls back to demo key in dev. */
export const getGoogleMapsServerKey = createServerOnlyFn((): string => {
	return (
		process.env.GOOGLE_MAPS_SERVER_KEY?.trim() ||
		process.env.GOOGLE_MAPS_DEMO_KEY?.trim() ||
		requiredServerEnv('GOOGLE_MAPS_SERVER_KEY', undefined)
	)
})
