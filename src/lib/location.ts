/** City from Places-style address: ..., city, country. Strips digits (postal codes). */
export function cityFromAddress(address: string): string | null {
	const parts = address.split(',').map((part) => part.trim())
	if (parts.length < 2) return null

	const city = parts[parts.length - 2]
		.replace(/\d/g, '')
		.replace(/\s+/g, ' ')
		.trim()

	return city.length > 0 ? city : null
}
