/**
 * Client-safe environment variables (`VITE_` prefix).
 * Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_MAPS_SERVER_KEY`)
 * must only be read inside server functions — never import them here.
 */
function required(name: string, value: string | undefined): string {
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`)
	}
	return value
}

/** Vars needed at runtime on the client. Optional until Supabase/Maps epics. */
export const clientEnv = {
	supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
	supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
	googleMapsBrowserKey:
		import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY?.trim() ||
		import.meta.env.VITE_GOOGLE_MAPS_DEMO_KEY?.trim() ||
		'',
} as const

/** Browser Maps key with demo fallback — returns empty string when unset. */
export function getGoogleMapsBrowserKey(): string {
	return clientEnv.googleMapsBrowserKey
}

/** Supabase client env — required for auth and data fetching. */
export function requireSupabaseEnv() {
	return {
		supabaseUrl: required(
			'VITE_SUPABASE_URL',
			import.meta.env.VITE_SUPABASE_URL,
		),
		supabaseAnonKey: required(
			'VITE_SUPABASE_ANON_KEY',
			import.meta.env.VITE_SUPABASE_ANON_KEY,
		),
	}
}

/** Google Maps browser key — required only when rendering maps (Epic 6b). */
export function requireGoogleMapsEnv() {
	const key = getGoogleMapsBrowserKey()
	return {
		googleMapsBrowserKey: required(
			'VITE_GOOGLE_MAPS_BROWSER_KEY',
			key || undefined,
		),
	}
}

/** @deprecated Use requireSupabaseEnv or requireGoogleMapsEnv instead. */
export function requireClientEnv() {
	return {
		...requireSupabaseEnv(),
		...requireGoogleMapsEnv(),
	}
}
