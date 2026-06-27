import {
	type NoseworkClass,
	type NoseworkType,
	RALLY_LEVEL_OPTIONS,
	type RallyLevel,
} from '#/lib/competition-labels.ts'
import { noseworkPriorCountCombinations } from '#/lib/nosework-rules.ts'
import type { PromotionContext } from '#/lib/promotion-queries.ts'

export type NoseworkMeritLine = {
	type: NoseworkType
	class: NoseworkClass
	total: number
	prior: number
	fromApp: number
}

export type RallyMeritLine = {
	level: RallyLevel
	total: number
	prior: number
	fromApp: number
}

export type DogMeritsSummary = {
	nosework: NoseworkMeritLine[]
	rally: RallyMeritLine[]
}

function priorNoseworkCount(
	context: PromotionContext,
	dogId: string,
	type: NoseworkType,
	className: NoseworkClass,
): number {
	return (
		context.priorNoseworkDiplomas.find(
			(row) =>
				row.dog_id === dogId && row.type === type && row.class === className,
		)?.count ?? 0
	)
}

function appNoseworkCount(
	context: PromotionContext,
	dogId: string,
	type: NoseworkType,
	className: NoseworkClass,
): number {
	return context.appNoseworkDiplomas.filter(
		(row) =>
			row.dog_id === dogId && row.type === type && row.class === className,
	).length
}

function priorRallyCount(
	context: PromotionContext,
	dogId: string,
	level: RallyLevel,
): number {
	return (
		context.priorRallyQualified.find(
			(row) => row.dog_id === dogId && row.level === level,
		)?.count ?? 0
	)
}

function appRallyCount(
	context: PromotionContext,
	dogId: string,
	level: RallyLevel,
): number {
	return context.appRallyQualifiedStarts.filter(
		(row) => row.dog_id === dogId && row.level === level,
	).length
}

export function summarizeDogMerits(
	dogId: string,
	context: PromotionContext,
): DogMeritsSummary {
	const nosework = noseworkPriorCountCombinations()
		.map(({ type, class: className }) => {
			const prior = priorNoseworkCount(context, dogId, type, className)
			const fromApp = appNoseworkCount(context, dogId, type, className)
			return { type, class: className, prior, fromApp, total: prior + fromApp }
		})
		.filter((row) => row.total > 0)

	const rally = RALLY_LEVEL_OPTIONS.map((option) => {
		const prior = priorRallyCount(context, dogId, option.value)
		const fromApp = appRallyCount(context, dogId, option.value)
		return {
			level: option.value,
			prior,
			fromApp,
			total: prior + fromApp,
		}
	}).filter((row) => row.total > 0)

	return { nosework, rally }
}

export function dogHasMerits(merits: DogMeritsSummary): boolean {
	return merits.nosework.length > 0 || merits.rally.length > 0
}
