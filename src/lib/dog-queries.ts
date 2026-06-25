import type { Database } from '#/lib/database.types.ts'
import type { DogInput } from '#/lib/schemas.ts'
import type { TypedSupabaseClient } from '#/lib/supabase.ts'

export type Dog = Database['public']['Tables']['dogs']['Row']

export type DogListItem = Dog & {
	entry_count: number
}

export type DogEntry = Pick<
	Database['public']['Tables']['entries']['Row'],
	'id' | 'status' | 'competition_id'
> & {
	competition: Pick<
		Database['public']['Tables']['competitions']['Row'],
		'id' | 'name' | 'sport' | 'event_date'
	> | null
}

export type DogWithEntries = Dog & {
	entries: DogEntry[]
}

export class DogDeleteRestrictedError extends Error {
	constructor() {
		super('Dog has competition entries and cannot be deleted')
		this.name = 'DogDeleteRestrictedError'
	}
}

type DogRowWithCount = Dog & {
	entries: { count: number }[]
}

function toDogListItem(row: DogRowWithCount): DogListItem {
	const { entries, ...dog } = row
	return {
		...dog,
		entry_count: entries[0]?.count ?? 0,
	}
}

function toNullable(value: string): string | null {
	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : null
}

function toOptionalHeight(value: string): number | null {
	const trimmed = value.trim()
	if (trimmed.length === 0) return null
	return Number.parseInt(trimmed, 10)
}

function toDogPayload(input: DogInput) {
	return {
		name: input.name.trim(),
		breed: toNullable(input.breed),
		date_of_birth: toNullable(input.date_of_birth),
		withers_height_cm: toOptionalHeight(input.withers_height_cm),
		notes: toNullable(input.notes),
	}
}

export async function fetchDogsList(
	supabase: TypedSupabaseClient,
): Promise<DogListItem[]> {
	const { data, error } = await supabase
		.from('dogs')
		.select('*, entries(count)')
		.order('name', { ascending: true })

	if (error) throw error
	return (data as DogRowWithCount[]).map(toDogListItem)
}

export async function fetchDogById(
	supabase: TypedSupabaseClient,
	id: string,
): Promise<DogWithEntries | null> {
	const { data, error } = await supabase
		.from('dogs')
		.select(
			'*, entries(id, status, competition_id, competition:competitions(id, name, sport, event_date))',
		)
		.eq('id', id)
		.maybeSingle()

	if (error) throw error
	if (!data) return null

	const dog = data as DogWithEntries
	dog.entries.sort((a, b) => {
		const aDate = a.competition?.event_date ?? ''
		const bDate = b.competition?.event_date ?? ''
		return aDate.localeCompare(bDate)
	})

	return dog
}

export async function createDog(
	supabase: TypedSupabaseClient,
	input: DogInput,
	createdBy: string,
): Promise<Dog> {
	const { data, error } = await supabase
		.from('dogs')
		.insert({
			...toDogPayload(input),
			created_by: createdBy,
		})
		.select('*')
		.single()

	if (error) throw error
	return data
}

export async function updateDog(
	supabase: TypedSupabaseClient,
	id: string,
	input: DogInput,
): Promise<Dog> {
	const { data, error } = await supabase
		.from('dogs')
		.update(toDogPayload(input))
		.eq('id', id)
		.select('*')
		.single()

	if (error) throw error
	return data
}

export async function deleteDog(
	supabase: TypedSupabaseClient,
	id: string,
): Promise<void> {
	const { error } = await supabase.from('dogs').delete().eq('id', id)

	if (error) {
		if (error.code === '23503') {
			throw new DogDeleteRestrictedError()
		}
		throw error
	}
}
