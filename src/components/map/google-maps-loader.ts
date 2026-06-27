const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-js'

let loadPromise: Promise<void> | null = null

function waitForImportLibrary(timeoutMs = 10_000): Promise<typeof google.maps> {
	return new Promise((resolve, reject) => {
		const started = Date.now()

		const check = () => {
			const maps = window.google?.maps
			if (maps?.importLibrary) {
				resolve(maps)
				return
			}

			if (Date.now() - started >= timeoutMs) {
				reject(new Error('Google Maps importLibrary unavailable'))
				return
			}

			window.setTimeout(check, 50)
		}

		check()
	})
}

function injectMapsScript(apiKey: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID)
		if (existing) {
			void waitForImportLibrary()
				.then(() => resolve())
				.catch(reject)
			return
		}

		const script = document.createElement('script')
		script.id = GOOGLE_MAPS_SCRIPT_ID
		script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async`
		script.async = true
		script.defer = true
		script.onload = () => {
			void waitForImportLibrary()
				.then(() => resolve())
				.catch(reject)
		}
		script.onerror = () => reject(new Error('Google Maps failed to load'))
		document.head.appendChild(script)
	})
}

export function loadGoogleMaps(apiKey: string): Promise<void> {
	if (typeof window === 'undefined') {
		return Promise.reject(new Error('Maps only load in browser'))
	}

	if (window.google?.maps?.importLibrary) {
		return Promise.resolve()
	}

	if (!loadPromise) {
		loadPromise = injectMapsScript(apiKey).catch((error) => {
			loadPromise = null
			throw error
		})
	}

	return loadPromise
}

function isDarkMode() {
	return document.documentElement.classList.contains('dark')
}

function mapStyles(): google.maps.MapTypeStyle[] {
	if (isDarkMode()) {
		return [
			{ elementType: 'geometry', stylers: [{ color: '#0d1522' }] },
			{ elementType: 'labels.text.fill', stylers: [{ color: '#a8b8cf' }] },
			{ elementType: 'labels.text.stroke', stylers: [{ color: '#070b12' }] },
			{
				featureType: 'road',
				elementType: 'geometry',
				stylers: [{ color: '#162033' }],
			},
			{
				featureType: 'water',
				elementType: 'geometry',
				stylers: [{ color: '#08111f' }],
			},
			{
				featureType: 'poi',
				elementType: 'geometry',
				stylers: [{ color: '#111b2b' }],
			},
		]
	}

	return [
		{ elementType: 'geometry', stylers: [{ color: '#eef4ff' }] },
		{ elementType: 'labels.text.fill', stylers: [{ color: '#506078' }] },
		{ elementType: 'labels.text.stroke', stylers: [{ color: '#f7fbff' }] },
		{
			featureType: 'road',
			elementType: 'geometry',
			stylers: [{ color: '#ffffff' }],
		},
		{
			featureType: 'water',
			elementType: 'geometry',
			stylers: [{ color: '#d9ebff' }],
		},
		{
			featureType: 'poi',
			elementType: 'geometry',
			stylers: [{ color: '#e4efff' }],
		},
	]
}

const COMPETITION_MAP_DEFAULT_ZOOM = 9

export async function createCompetitionMap(
	container: HTMLElement,
	lat: number,
	lng: number,
	title?: string,
) {
	const importLibrary = window.google?.maps?.importLibrary
	if (!importLibrary) {
		throw new Error('Google Maps importLibrary unavailable')
	}

	const { Map: GoogleMap } = (await importLibrary(
		'maps',
	)) as google.maps.MapsLibrary

	const map = new GoogleMap(container, {
		center: { lat, lng },
		zoom: COMPETITION_MAP_DEFAULT_ZOOM,
		disableDefaultUI: true,
		zoomControl: true,
		mapTypeControl: false,
		streetViewControl: false,
		fullscreenControl: false,
		styles: mapStyles(),
	})

	const Marker = window.google?.maps?.Marker
	if (!Marker) {
		throw new Error('Google Maps Marker unavailable')
	}

	new Marker({
		position: { lat, lng },
		map,
		title,
	})

	return map
}
