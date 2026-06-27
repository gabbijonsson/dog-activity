export function readMultiSelectFilter(value: unknown): string[] {
	return Array.isArray(value) ? value.map(String) : []
}
