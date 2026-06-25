import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "#/lib/database.types.ts";
import { requireSupabaseEnv } from "#/lib/env.ts";

export type { Database };
export type TypedSupabaseClient = SupabaseClient<Database>;

let browserClient: TypedSupabaseClient | undefined;

/** Browser Supabase client — singleton, cookie-backed session via @supabase/ssr. */
export function getBrowserSupabase(): TypedSupabaseClient {
	if (typeof window === "undefined") {
		throw new Error("getBrowserSupabase() is client-only");
	}

	if (!browserClient) {
		const { supabaseUrl, supabaseAnonKey } = requireSupabaseEnv();
		browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
	}

	return browserClient;
}
