import { MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import {
	createCompetitionMap,
	loadGoogleMaps,
} from '#/components/map/google-maps-loader.ts'
import { getGoogleMapsBrowserKey } from '#/lib/env.ts'
import { cn } from '#/lib/utils.ts'

interface CompetitionMapProps {
	lat: number
	lng: number
	locationLabel?: string | null
	active?: boolean
	className?: string
}

type MapState =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'ready' }
	| { status: 'missing-key' }
	| { status: 'error'; message: string }

export function CompetitionMap({
	lat,
	lng,
	locationLabel,
	active = true,
	className,
}: CompetitionMapProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [state, setState] = useState<MapState>({ status: 'idle' })

	useEffect(() => {
		if (!active) {
			setState({ status: 'idle' })
			return
		}

		const apiKey = getGoogleMapsBrowserKey()
		if (!apiKey) {
			setState({ status: 'missing-key' })
			return
		}

		let cancelled = false
		setState({ status: 'loading' })

		void loadGoogleMaps(apiKey)
			.then(async () => {
				if (cancelled || !containerRef.current) return
				await createCompetitionMap(
					containerRef.current,
					lat,
					lng,
					locationLabel ?? undefined,
				)
				if (!cancelled) setState({ status: 'ready' })
			})
			.catch((error: unknown) => {
				if (cancelled) return
				const message =
					error instanceof Error ? error.message : 'Kartan kunde inte laddas'
				setState({ status: 'error', message })
			})

		return () => {
			cancelled = true
			if (containerRef.current) {
				containerRef.current.replaceChildren()
			}
		}
	}, [active, lat, lng, locationLabel])

	return (
		<div
			className={cn(
				'overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] shadow-[inset_0_1px_0_var(--inset-glint)]',
				className,
			)}
		>
			<div className="flex items-center gap-2 border-b border-[var(--line)] px-3 py-2">
				<span
					className="inline-flex size-6 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--palm)_18%,transparent)] text-[var(--palm)]"
					aria-hidden="true"
				>
					<MapPin className="size-3.5" />
				</span>
				<div className="min-w-0">
					<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						Tävlingsplats
					</p>
					{locationLabel && (
						<p className="truncate text-sm font-medium text-foreground">
							{locationLabel}
						</p>
					)}
				</div>
			</div>

			<div className="relative aspect-[16/10] w-full bg-muted/30">
				<div ref={containerRef} className="absolute inset-0 size-full" />

				{state.status !== 'ready' && (
					<div className="absolute inset-0 flex items-center justify-center px-4 text-center">
						<p className="text-sm text-muted-foreground">
							{state.status === 'loading' && 'Laddar karta…'}
							{state.status === 'missing-key' &&
								'Karta kräver VITE_GOOGLE_MAPS_BROWSER_KEY'}
							{state.status === 'error' && state.message}
							{state.status === 'idle' && 'Karta…'}
						</p>
					</div>
				)}
			</div>
		</div>
	)
}

interface CompetitionLocationSectionProps {
	lat: number | null
	lng: number | null
	location: string | null
	originLocation: string | null
	driveDistanceText: string | null
	driveDurationText: string | null
	active?: boolean
}

export function CompetitionLocationSection({
	lat,
	lng,
	location,
	originLocation,
	driveDistanceText,
	driveDurationText,
	active = true,
}: CompetitionLocationSectionProps) {
	const hasDrive = Boolean(driveDistanceText && driveDurationText)
	const hasCoords = lat != null && lng != null

	return (
		<section className="space-y-3">
			{hasCoords ? (
				<CompetitionMap
					lat={lat}
					lng={lng}
					locationLabel={location}
					active={active}
				/>
			) : location ? (
				<div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
					Karta ej tillgänglig — kontrollera platsadressen och spara igen.
				</div>
			) : null}

			{originLocation && (
				<div className="rounded-lg border border-border/70 bg-muted/15 px-4 py-3 text-sm">
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Körning från {originLocation}
					</p>
					{hasDrive ? (
						<p className="mt-1 text-base font-semibold text-foreground">
							{driveDistanceText}
							<span className="mx-2 text-muted-foreground">·</span>
							{driveDurationText}
						</p>
					) : (
						<p className="mt-1 text-muted-foreground">
							Körsträcka kunde inte beräknas — kontrollera adresserna.
						</p>
					)}
				</div>
			)}
		</section>
	)
}
