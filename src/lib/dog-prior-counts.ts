import { RALLY_LEVEL_OPTIONS } from '#/lib/competition-labels.ts'
import { noseworkPriorCountCombinations } from '#/lib/nosework-rules.ts'
import type { DogInput } from '#/lib/schemas.ts'

export function emptyPriorNoseworkDiplomas(): DogInput['prior_nosework_diplomas'] {
	return noseworkPriorCountCombinations().map(({ type, class: className }) => ({
		type,
		class: className,
		count: 0,
	}))
}

export function emptyPriorRallyQualified(): DogInput['prior_rally_qualified'] {
	return RALLY_LEVEL_OPTIONS.map((option) => ({
		level: option.value,
		count: 0,
	}))
}

export function mergePriorNoseworkDiplomas(
	existing: ReadonlyArray<{
		type: DogInput['prior_nosework_diplomas'][number]['type']
		class: DogInput['prior_nosework_diplomas'][number]['class']
		count: number
	}>,
): DogInput['prior_nosework_diplomas'] {
	const byKey = new Map(
		existing.map((row) => [`${row.type}:${row.class}`, row.count]),
	)

	return emptyPriorNoseworkDiplomas().map((row) => ({
		...row,
		count: byKey.get(`${row.type}:${row.class}`) ?? 0,
	}))
}

export function mergePriorRallyQualified(
	existing: ReadonlyArray<{
		level: DogInput['prior_rally_qualified'][number]['level']
		count: number
	}>,
): DogInput['prior_rally_qualified'] {
	const byLevel = new Map(existing.map((row) => [row.level, row.count]))

	return emptyPriorRallyQualified().map((row) => ({
		...row,
		count: byLevel.get(row.level) ?? 0,
	}))
}
