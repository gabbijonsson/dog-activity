import {
	NOSEWORK_TYPE_OPTIONS,
	type NoseworkClass,
	type NoseworkType,
} from '#/lib/competition-labels.ts'

const TEM_TYPES: NoseworkType[] = [
	'tem_behallare',
	'tem_inomhus',
	'tem_fordon',
	'tem_utomhus',
]

export function noseworkTypesForClass(
	className: NoseworkClass,
): NoseworkType[] {
	if (className === 'elit') return ['tsm']
	return ['tsm', ...TEM_TYPES]
}

export function isValidNoseworkTypeForClass(
	type: NoseworkType,
	className: NoseworkClass,
): boolean {
	return noseworkTypesForClass(className).includes(type)
}

export function noseworkTypeOptionsForClass(className: NoseworkClass) {
	const allowed = new Set(noseworkTypesForClass(className))
	return NOSEWORK_TYPE_OPTIONS.filter((option) => allowed.has(option.value))
}

export function noseworkPriorCountCombinations(): {
	type: NoseworkType
	class: NoseworkClass
}[] {
	return (['class_1', 'class_2', 'class_3', 'elit'] as NoseworkClass[]).flatMap(
		(className) =>
			noseworkTypesForClass(className).map((type) => ({
				type,
				class: className,
			})),
	)
}

export function normalizeNoseworkTypeForClass(
	type: NoseworkType | undefined,
	className: NoseworkClass,
): NoseworkType {
	if (type && isValidNoseworkTypeForClass(type, className)) return type
	return noseworkTypesForClass(className)[0]
}
