import {
	NOSEWORK_CLASS_OPTIONS,
	NOSEWORK_TYPE_OPTIONS,
	RALLY_LEVEL_OPTIONS,
} from '#/lib/competition-labels.ts'
import type { DogInput } from '#/lib/schemas.ts'

export function emptyPriorNoseworkDiplomas(): DogInput['prior_nosework_diplomas'] {
	return NOSEWORK_TYPE_OPTIONS.flatMap((typeOption) =>
		NOSEWORK_CLASS_OPTIONS.map((classOption) => ({
			type: typeOption.value,
			class: classOption.value,
			count: 0,
		})),
	)
}

export function emptyPriorRallyQualified(): DogInput['prior_rally_qualified'] {
	return RALLY_LEVEL_OPTIONS.map((option) => ({
		level: option.value,
		count: 0,
	}))
}

export function mergePriorNoseworkDiplomas(
	existing: DogInput['prior_nosework_diplomas'],
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
	existing: DogInput['prior_rally_qualified'],
): DogInput['prior_rally_qualified'] {
	const byLevel = new Map(existing.map((row) => [row.level, row.count]))

	return emptyPriorRallyQualified().map((row) => ({
		...row,
		count: byLevel.get(row.level) ?? 0,
	}))
}
