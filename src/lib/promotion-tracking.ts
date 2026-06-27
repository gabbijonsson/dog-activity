import type { Database } from '#/lib/database.types.ts'

type NoseworkType = Database['public']['Enums']['nosework_type']
type NoseworkClass = Database['public']['Enums']['nosework_class']
type NoseworkOfficialStatus =
	Database['public']['Enums']['nosework_official_status']
type RallyLevel = Database['public']['Enums']['rally_level']

export const RALLY_QUALIFICATION_THRESHOLDS: Record<RallyLevel, number> = {
	nyborjare: 70,
	fortsattning: 75,
	avancerad: 80,
	mastare: 90,
}

export const PROMOTION_DIPLOMA_LIMIT = 3
export const PROMOTION_RALLY_QUALIFIED_LIMIT = 3

export function noseworkCountsTowardPromotion(
	officialStatus: NoseworkOfficialStatus | null | undefined,
): boolean {
	return officialStatus === 'official'
}

export type DogNoseworkDiplomaCount = {
	dog_id: string
	type: NoseworkType
	class: NoseworkClass
	count: number
}

export type DogRallyQualifiedCount = {
	dog_id: string
	level: RallyLevel
	count: number
}

export type AppNoseworkDiploma = {
	dog_id: string
	type: NoseworkType
	class: NoseworkClass
}

export type AppRallyQualifiedStart = {
	dog_id: string
	level: RallyLevel
}

export function countNoseworkDiplomas(
	dogId: string,
	type: NoseworkType,
	className: NoseworkClass,
	priorCounts: DogNoseworkDiplomaCount[],
	appDiplomas: AppNoseworkDiploma[],
): number {
	const prior =
		priorCounts.find(
			(row) =>
				row.dog_id === dogId && row.type === type && row.class === className,
		)?.count ?? 0

	const fromApp = appDiplomas.filter(
		(row) =>
			row.dog_id === dogId && row.type === type && row.class === className,
	).length

	return prior + fromApp
}

export function countRallyQualifiedResults(
	dogId: string,
	level: RallyLevel,
	priorCounts: DogRallyQualifiedCount[],
	appQualifiedStarts: AppRallyQualifiedStart[],
): number {
	const prior =
		priorCounts.find((row) => row.dog_id === dogId && row.level === level)
			?.count ?? 0

	const fromApp = appQualifiedStarts.filter(
		(row) => row.dog_id === dogId && row.level === level,
	).length

	return prior + fromApp
}

export function isRallyStartQualified(
	level: RallyLevel,
	points: number | null | undefined,
): boolean {
	if (points == null) return false
	return points >= RALLY_QUALIFICATION_THRESHOLDS[level]
}

export function noseworkPromotionWarning(
	dogName: string,
	dogId: string,
	type: NoseworkType,
	className: NoseworkClass,
	priorCounts: DogNoseworkDiplomaCount[],
	appDiplomas: AppNoseworkDiploma[],
): string | null {
	const total = countNoseworkDiplomas(
		dogId,
		type,
		className,
		priorCounts,
		appDiplomas,
	)
	if (total < PROMOTION_DIPLOMA_LIMIT) return null
	return `${dogName} har redan 3 diplom i denna klass och gren`
}

export function rallyPromotionWarning(
	dogName: string,
	dogId: string,
	level: RallyLevel,
	priorCounts: DogRallyQualifiedCount[],
	appQualifiedStarts: AppRallyQualifiedStart[],
): string | null {
	const total = countRallyQualifiedResults(
		dogId,
		level,
		priorCounts,
		appQualifiedStarts,
	)
	if (total < PROMOTION_RALLY_QUALIFIED_LIMIT) return null
	return `${dogName} har redan 3 kvalificerade resultat i denna klass.`
}
