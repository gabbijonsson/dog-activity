import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { createServerOnlyFn } from "@tanstack/react-start";
import { getCookies, setCookie } from "@tanstack/react-start/server";

import { requireSupabaseEnv } from "#/lib/env.ts";
import type { Database, TypedSupabaseClient } from "#/lib/supabase.ts";

function requiredServerEnv(name: string, value: string | undefined): string {
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

/** Server Supabase client scoped to the current request session (anon key + cookies). */
export const createServerSupabase = createServerOnlyFn(
	(): TypedSupabaseClient => {
		const { supabaseUrl, supabaseAnonKey } = requireSupabaseEnv();

		return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
			cookies: {
				getAll() {
					return Object.entries(getCookies()).map(([name, value]) => ({
						name,
						value,
					}));
				},
				setAll(cookiesToSet) {
					for (const { name, value, options } of cookiesToSet) {
						setCookie(name, value, options);
					}
				},
			},
		});
	},
);

/** Trusted server-only client for admin mutations (service role, no persisted session). */
export const createServiceRoleSupabase = createServerOnlyFn(
	(): TypedSupabaseClient => {
		const { supabaseUrl } = requireSupabaseEnv();
		const serviceRoleKey = requiredServerEnv(
			"SUPABASE_SERVICE_ROLE_KEY",
			process.env.SUPABASE_SERVICE_ROLE_KEY,
		);

		return createClient<Database>(supabaseUrl, serviceRoleKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});
	},
);
