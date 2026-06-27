import type { Database } from '#/lib/database.types.ts'
import {
	type AppNoseworkDiploma,
	type AppRallyQualifiedStart,
	type DogNoseworkDiplomaCount,
	type DogRallyQualifiedCount,
	isRallyStartQualified,
	noseworkCountsTowardPromotion,
} from '#/lib/promotion-tracking.ts'
import type { TypedSupabaseClient } from '#/lib/supabase.ts'

export type PromotionContext = {
	priorNoseworkDiplomas: DogNoseworkDiplomaCount[]
	priorRallyQualified: DogRallyQualifiedCount[]
	appNoseworkDiplomas: AppNoseworkDiploma[]
	appRallyQualifiedStarts: AppRallyQualifiedStart[]
}

export async function fetchPromotionContext(
	supabase: TypedSupabaseClient,
): Promise<PromotionContext> {
	const [
		{ data: priorNosework, error: noseworkPriorError },
		{ data: priorRally, error: rallyPriorError },
		{ data: appNosework, error: noseworkAppError },
		{ data: appRally, error: rallyAppError },
	] = await Promise.all([
		supabase
			.from('dog_nosework_diploma_counts')
			.select('dog_id, type, class, count'),
		supabase.from('dog_rally_qualified_counts').select('dog_id, level, count'),
		supabase
			.from('nosework_entry_results')
			.select(
				'diploma_result, entry:entries!inner(dog_id, competition:competitions!inner(nosework_details(type, class, official_status)))',
			)
			.eq('diploma_result', 'diplom'),
		supabase
			.from('rally_start_results')
			.select(
				'points, entry:entries!inner(dog_id, competition:competitions!inner(rally_details(level)))',
			)
			.not('points', 'is', null),
	])

	if (noseworkPriorError) throw noseworkPriorError
	if (rallyPriorError) throw rallyPriorError
	if (noseworkAppError) throw noseworkAppError
	if (rallyAppError) throw rallyAppError

	return {
		priorNoseworkDiplomas: (priorNosework ?? []).map((row) => ({
			dog_id: row.dog_id,
			type: row.type,
			class: row.class,
			count: row.count,
		})),
		priorRallyQualified: (priorRally ?? []).map((row) => ({
			dog_id: row.dog_id,
			level: row.level,
			count: row.count,
		})),
		appNoseworkDiplomas: mapAppNoseworkDiplomas(appNosework ?? []),
		appRallyQualifiedStarts: mapAppRallyQualifiedStarts(appRally ?? []),
	}
}

type NoseworkResultRow = {
	diploma_result: Database['public']['Enums']['nosework_diploma_result'] | null
	entry: {
		dog_id: string | null
		competition: {
			nosework_details: {
				type: Database['public']['Enums']['nosework_type']
				class: Database['public']['Enums']['nosework_class']
				official_status: Database['public']['Enums']['nosework_official_status']
			} | null
		} | null
	} | null
}

type RallyResultRow = {
	points: number | null
	entry: {
		dog_id: string | null
		competition: {
			rally_details: {
				level: Database['public']['Enums']['rally_level']
			} | null
		} | null
	} | null
}

function mapAppNoseworkDiplomas(
	rows: NoseworkResultRow[],
): AppNoseworkDiploma[] {
	return rows.flatMap((row) => {
		if (row.diploma_result !== 'diplom') return []
		const dogId = row.entry?.dog_id
		const details = row.entry?.competition?.nosework_details
		if (!dogId || !details) return []
		if (!noseworkCountsTowardPromotion(details.official_status)) return []
		return [{ dog_id: dogId, type: details.type, class: details.class }]
	})
}

function mapAppRallyQualifiedStarts(
	rows: RallyResultRow[],
): AppRallyQualifiedStart[] {
	return rows.flatMap((row) => {
		const dogId = row.entry?.dog_id
		const level = row.entry?.competition?.rally_details?.level
		if (!dogId || !level) return []
		if (!isRallyStartQualified(level, row.points)) return []
		return [{ dog_id: dogId, level }]
	})
}

export type DogPriorCounts = {
	nosework: DogNoseworkDiplomaCount[]
	rally: DogRallyQualifiedCount[]
}

export async function fetchDogPriorCounts(
	supabase: TypedSupabaseClient,
	dogId: string,
): Promise<DogPriorCounts> {
	const [
		{ data: nosework, error: noseworkError },
		{ data: rally, error: rallyError },
	] = await Promise.all([
		supabase
			.from('dog_nosework_diploma_counts')
			.select('dog_id, type, class, count')
			.eq('dog_id', dogId),
		supabase
			.from('dog_rally_qualified_counts')
			.select('dog_id, level, count')
			.eq('dog_id', dogId),
	])

	if (noseworkError) throw noseworkError
	if (rallyError) throw rallyError

	return {
		nosework: (nosework ?? []).map((row) => ({
			dog_id: row.dog_id,
			type: row.type,
			class: row.class,
			count: row.count,
		})),
		rally: (rally ?? []).map((row) => ({
			dog_id: row.dog_id,
			level: row.level,
			count: row.count,
		})),
	}
}

export async function saveDogPriorCounts(
	supabase: TypedSupabaseClient,
	dogId: string,
	nosework: Omit<DogNoseworkDiplomaCount, 'dog_id'>[],
	rally: Omit<DogRallyQualifiedCount, 'dog_id'>[],
): Promise<void> {
	const noseworkRows = nosework
		.filter((row) => row.count > 0)
		.map((row) => ({
			dog_id: dogId,
			type: row.type,
			class: row.class,
			count: row.count,
		}))

	const rallyRows = rally
		.filter((row) => row.count > 0)
		.map((row) => ({
			dog_id: dogId,
			level: row.level,
			count: row.count,
		}))

	const { error: deleteNoseworkError } = await supabase
		.from('dog_nosework_diploma_counts')
		.delete()
		.eq('dog_id', dogId)
	if (deleteNoseworkError) throw deleteNoseworkError

	const { error: deleteRallyError } = await supabase
		.from('dog_rally_qualified_counts')
		.delete()
		.eq('dog_id', dogId)
	if (deleteRallyError) throw deleteRallyError

	if (noseworkRows.length > 0) {
		const { error } = await supabase
			.from('dog_nosework_diploma_counts')
			.insert(noseworkRows)
		if (error) throw error
	}

	if (rallyRows.length > 0) {
		const { error } = await supabase
			.from('dog_rally_qualified_counts')
			.insert(rallyRows)
		if (error) throw error
	}
}
