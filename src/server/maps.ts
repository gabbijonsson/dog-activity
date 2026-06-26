import { createServerOnlyFn } from '@tanstack/react-start'

import { getGoogleMapsServerKey } from '#/lib/env.server.ts'

export type MapComputationResult = {
	location_lat: number | null
	location_lng: number | null
	drive_distance_meters: number | null
	drive_distance_text: string | null
	drive_duration_seconds: number | null
	drive_duration_text: string | null
	drive_computed_at: string | null
}

export type MapComputationInput = {
	location: string | null
	origin_location: string | null
	previous: {
		location: string | null
		origin_location: string | null
		location_lat: number | null
		location_lng: number | null
		drive_distance_meters: number | null
		drive_distance_text: string | null
		drive_duration_seconds: number | null
		drive_duration_text: string | null
		drive_computed_at: string | null
	} | null
}

const EMPTY_MAP_FIELDS: MapComputationResult = {
	location_lat: null,
	location_lng: null,
	drive_distance_meters: null,
	drive_distance_text: null,
	drive_duration_seconds: null,
	drive_duration_text: null,
	drive_computed_at: null,
}

type GeocodeResponse = {
	results?: Array<{
		location?: { latitude?: number; longitude?: number }
	}>
}

type ComputeRoutesResponse = {
	routes?: Array<{
		distanceMeters?: number
		duration?: string
		legs?: Array<{
			endLocation?: {
				latLng?: { latitude?: number; longitude?: number }
			}
		}>
	}>
}

export function formatDriveDistance(meters: number): string {
	if (meters >= 1000) {
		return `${Math.round(meters / 1000)} km`
	}
	return `${Math.round(meters)} m`
}

export function formatDriveDuration(totalSeconds: number): string {
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.round((totalSeconds % 3600) / 60)

	if (hours === 0) {
		return `${minutes} min`
	}

	if (minutes === 0) {
		return `${hours} h`
	}

	return `${hours} h ${minutes} min`
}

function parseRouteDuration(duration: string | undefined): number | null {
	if (!duration?.endsWith('s')) return null
	const seconds = Number.parseInt(duration.slice(0, -1), 10)
	return Number.isFinite(seconds) ? seconds : null
}

async function geocodeAddress(address: string, apiKey: string) {
	const url = `https://geocode.googleapis.com/v4beta/geocode/address/${encodeURIComponent(address)}`

	const response = await fetch(url, {
		headers: {
			'X-Goog-Api-Key': apiKey,
			'X-Goog-FieldMask': 'results.location',
		},
	})
	if (!response.ok) {
		throw new Error(`Geocoding failed (${response.status})`)
	}

	const data = (await response.json()) as GeocodeResponse
	const location = data.results?.[0]?.location
	if (location?.latitude == null || location.longitude == null) {
		throw new Error('Geocoding returned no results')
	}

	return { lat: location.latitude, lng: location.longitude }
}

async function computeDrivingRoute(
	origin: string,
	destination: string,
	apiKey: string,
) {
	const response = await fetch(
		'https://routes.googleapis.com/directions/v2:computeRoutes',
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Goog-Api-Key': apiKey,
				'X-Goog-FieldMask':
					'routes.distanceMeters,routes.duration,routes.legs.endLocation',
			},
			body: JSON.stringify({
				origin: { address: origin },
				destination: { address: destination },
				travelMode: 'DRIVE',
				routingPreference: 'TRAFFIC_AWARE',
				languageCode: 'sv',
				regionCode: 'SE',
			}),
		},
	)

	if (!response.ok) {
		throw new Error(`Routes API failed (${response.status})`)
	}

	const data = (await response.json()) as ComputeRoutesResponse
	const route = data.routes?.[0]
	const endLocation = route?.legs?.[0]?.endLocation?.latLng
	const distanceMeters = route?.distanceMeters
	const durationSeconds = parseRouteDuration(route?.duration)

	if (
		!route ||
		distanceMeters == null ||
		durationSeconds == null ||
		endLocation?.latitude == null ||
		endLocation.longitude == null
	) {
		throw new Error('Routes API returned no usable route')
	}

	return {
		destinationLat: endLocation.latitude,
		destinationLng: endLocation.longitude,
		distanceMeters,
		durationSeconds,
	}
}

function normalizeAddress(value: string | null | undefined): string | null {
	const trimmed = value?.trim()
	return trimmed ? trimmed : null
}

function addressesUnchanged(input: MapComputationInput): boolean {
	if (!input.previous) return false

	return (
		normalizeAddress(input.location) ===
			normalizeAddress(input.previous.location) &&
		normalizeAddress(input.origin_location) ===
			normalizeAddress(input.previous.origin_location)
	)
}

function keepExistingPin(
	input: MapComputationInput,
): MapComputationResult | null {
	if (!input.previous?.location_lat || !input.previous.location_lng) {
		return null
	}

	return {
		location_lat: input.previous.location_lat,
		location_lng: input.previous.location_lng,
		drive_distance_meters: input.previous.drive_distance_meters,
		drive_distance_text: input.previous.drive_distance_text,
		drive_duration_seconds: input.previous.drive_duration_seconds,
		drive_duration_text: input.previous.drive_duration_text,
		drive_computed_at: input.previous.drive_computed_at,
	}
}

/** Returns map fields to persist, or null when nothing should change. */
export const computeCompetitionMapFields = createServerOnlyFn(
	async (input: MapComputationInput): Promise<MapComputationResult | null> => {
		const location = normalizeAddress(input.location)
		const originLocation = normalizeAddress(input.origin_location)

		if (!location || !originLocation) {
			return { ...EMPTY_MAP_FIELDS }
		}

		if (addressesUnchanged(input)) {
			return null
		}

		const apiKey = getGoogleMapsServerKey()

		try {
			const route = await computeDrivingRoute(originLocation, location, apiKey)

			return {
				location_lat: route.destinationLat,
				location_lng: route.destinationLng,
				drive_distance_meters: route.distanceMeters,
				drive_distance_text: formatDriveDistance(route.distanceMeters),
				drive_duration_seconds: route.durationSeconds,
				drive_duration_text: formatDriveDuration(route.durationSeconds),
				drive_computed_at: new Date().toISOString(),
			}
		} catch {
			const geocoded = await geocodeAddress(location, apiKey).catch(() => null)
			if (geocoded) {
				return {
					location_lat: geocoded.lat,
					location_lng: geocoded.lng,
					drive_distance_meters: null,
					drive_distance_text: null,
					drive_duration_seconds: null,
					drive_duration_text: null,
					drive_computed_at: null,
				}
			}

			return keepExistingPin(input) ?? { ...EMPTY_MAP_FIELDS }
		}
	},
)
