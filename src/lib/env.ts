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
	supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
	supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
	googleMapsBrowserKey: import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY ?? "",
} as const

/** Call when client env must be present (e.g. after Supabase init). */
export function requireClientEnv() {
	return {
		supabaseUrl: required("VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL),
		supabaseAnonKey: required(
			"VITE_SUPABASE_ANON_KEY",
			import.meta.env.VITE_SUPABASE_ANON_KEY,
		),
		googleMapsBrowserKey: required(
			"VITE_GOOGLE_MAPS_BROWSER_KEY",
			import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY,
		),
	}
}
