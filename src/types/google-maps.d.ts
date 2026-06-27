declare namespace google {
	namespace maps {
		var importLibrary:
			| ((library: 'places' | 'maps') => Promise<PlacesLibrary | MapsLibrary>)
			| undefined

		namespace event {
			function clearInstanceListeners(instance: unknown): void
		}

		interface MapsLibrary {
			Map: GoogleMapConstructor
		}

		interface PlacesLibrary {
			Autocomplete: AutocompleteConstructor
			PlaceAutocompleteElement?: PlaceAutocompleteElementConstructor
		}

		interface GoogleMap {
			setCenter(latLng: LatLng | LatLngLiteral): void
			setZoom(zoom: number): void
		}

		interface GoogleMapConstructor {
			new (element: HTMLElement, options?: MapOptions): GoogleMap
		}

		interface Marker {
			setMap(map: GoogleMap | null): void
		}

		interface MarkerConstructor {
			new (options?: MarkerOptions): Marker
		}

		interface MapOptions {
			center?: LatLng | LatLngLiteral
			zoom?: number
			disableDefaultUI?: boolean
			zoomControl?: boolean
			mapTypeControl?: boolean
			streetViewControl?: boolean
			fullscreenControl?: boolean
			styles?: MapTypeStyle[]
		}

		interface MarkerOptions {
			position?: LatLng | LatLngLiteral
			map?: GoogleMap
			title?: string
		}

		interface LatLng {
			lat(): number
			lng(): number
		}

		interface LatLngLiteral {
			lat: number
			lng: number
		}

		interface MapTypeStyle {
			elementType?: string
			featureType?: string
			stylers: Array<Record<string, string | number>>
		}

		var Marker: MarkerConstructor | undefined

		namespace places {
			interface AutocompleteOptions {
				fields?: string[]
				componentRestrictions?: { country: string | string[] }
			}

			interface PlaceResult {
				formatted_address?: string
				name?: string
			}

			interface Autocomplete {
				getPlace(): PlaceResult
				addListener(eventName: 'place_changed', handler: () => void): unknown
			}

			interface AutocompleteConstructor {
				new (
					input: HTMLInputElement,
					options?: AutocompleteOptions,
				): Autocomplete
			}

			interface PlaceAutocompleteElementConstructor {
				new (options?: Record<string, unknown>): HTMLElement
			}
		}
	}
}

declare global {
	interface Window {
		google?: {
			maps: typeof google.maps
		}
	}
}
