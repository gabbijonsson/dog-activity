import { getGoogleMapsBrowserKey } from '#/lib/env.ts'

export type PlaceSuggestion = {
	id: string
	label: string
	secondary?: string
}

type AutocompleteResponse = {
	suggestions?: Array<{
		placePrediction?: {
			placeId?: string
			text?: { text?: string }
			structuredFormat?: {
				mainText?: { text?: string }
				secondaryText?: { text?: string }
			}
		}
	}>
	error?: { message?: string }
}

export async function fetchPlaceSuggestions(
	input: string,
	sessionToken: string,
): Promise<PlaceSuggestion[]> {
	const apiKey = getGoogleMapsBrowserKey()
	if (!apiKey) return []

	const query = input.trim()
	if (query.length < 2) return []

	const response = await fetch(
		'https://places.googleapis.com/v1/places:autocomplete',
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Goog-Api-Key': apiKey,
			},
			body: JSON.stringify({
				input: query,
				includedRegionCodes: ['se'],
				languageCode: 'sv',
				sessionToken,
			}),
		},
	)

	if (!response.ok) {
		throw new Error(`Places autocomplete failed (${response.status})`)
	}

	const data = (await response.json()) as AutocompleteResponse
	if (data.error?.message) {
		throw new Error(data.error.message)
	}

	return (data.suggestions ?? [])
		.map((suggestion) => {
			const prediction = suggestion.placePrediction
			if (!prediction) return null

			const label =
				prediction.text?.text?.trim() ||
				prediction.structuredFormat?.mainText?.text?.trim()
			if (!label) return null

			return {
				id: prediction.placeId ?? label,
				label,
				secondary: prediction.structuredFormat?.secondaryText?.text?.trim(),
			}
		})
		.filter((item): item is PlaceSuggestion => item !== null)
}

export function createPlacesSessionToken(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID()
	}

	return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
