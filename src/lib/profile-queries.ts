import type { Database } from '#/lib/database.types.ts'
import type { TypedSupabaseClient } from '#/lib/supabase.ts'

export type ProfileListItem = Pick<
	Database['public']['Tables']['profiles']['Row'],
	'id' | 'full_name' | 'email'
>

export function profileDisplayName(profile: ProfileListItem): string {
	return profile.full_name?.trim() || profile.email
}

export async function fetchProfilesList(
	supabase: TypedSupabaseClient,
): Promise<ProfileListItem[]> {
	const { data, error } = await supabase
		.from('profiles')
		.select('id, full_name, email')
		.order('full_name', { ascending: true, nullsFirst: false })

	if (error) throw error
	return data
}
