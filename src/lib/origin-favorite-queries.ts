import type { Database } from '#/lib/database.types.ts'
import type { TypedSupabaseClient } from '#/lib/supabase.ts'

export type OriginAddressFavorite =
	Database['public']['Tables']['origin_address_favorites']['Row']

function normalizeAddress(value: string): string {
	return value.trim()
}

export async function fetchOriginAddressFavorites(
	supabase: TypedSupabaseClient,
): Promise<OriginAddressFavorite[]> {
	const { data, error } = await supabase
		.from('origin_address_favorites')
		.select('*')
		.order('sort_order', { ascending: true })
		.order('created_at', { ascending: true })

	if (error) throw error
	return data
}

export async function createOriginAddressFavorite(
	supabase: TypedSupabaseClient,
	input: { label: string; address: string },
): Promise<OriginAddressFavorite> {
	const label = input.label.trim()
	const address = normalizeAddress(input.address)

	if (!label || !address) {
		throw new Error('Etikett och adress krävs')
	}

	const { data: existing } = await supabase
		.from('origin_address_favorites')
		.select('sort_order')
		.order('sort_order', { ascending: false })
		.limit(1)
		.maybeSingle()

	const { data, error } = await supabase
		.from('origin_address_favorites')
		.insert({
			label,
			address,
			sort_order: (existing?.sort_order ?? -1) + 1,
		})
		.select('*')
		.single()

	if (error) {
		if (error.code === '23505') {
			throw new Error('Adressen finns redan som genväg')
		}
		throw error
	}

	return data
}

export async function deleteOriginAddressFavorite(
	supabase: TypedSupabaseClient,
	id: string,
): Promise<void> {
	const { error } = await supabase
		.from('origin_address_favorites')
		.delete()
		.eq('id', id)

	if (error) throw error
}

export function defaultOriginFavoriteLabel(address: string): string {
	const trimmed = normalizeAddress(address)
	if (!trimmed) return 'Genväg'

	const firstSegment = trimmed.split(',')[0]?.trim() ?? trimmed
	if (firstSegment.length <= 28) return firstSegment

	return `${firstSegment.slice(0, 25)}…`
}

export function addressesMatch(a: string, b: string): boolean {
	return normalizeAddress(a).toLowerCase() === normalizeAddress(b).toLowerCase()
}
