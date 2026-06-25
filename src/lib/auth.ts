import { createIsomorphicFn } from '@tanstack/react-start'

import { getBrowserSupabase } from '#/lib/supabase.ts'

/** Block open redirects — only allow same-origin relative paths. */
export function sanitizeRedirect(url: unknown): string {
	if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//')) {
		return '/'
	}
	return url
}

/** Read Supabase session from cookies (server) or browser client. */
export const getAuthSession = createIsomorphicFn()
	.server(async () => {
		const { createServerSupabase } = await import('#/lib/supabase.server.ts')
		const supabase = createServerSupabase()
		const {
			data: { session },
		} = await supabase.auth.getSession()
		return session
	})
	.client(async () => {
		const supabase = getBrowserSupabase()
		const {
			data: { session },
		} = await supabase.auth.getSession()
		return session
	})
