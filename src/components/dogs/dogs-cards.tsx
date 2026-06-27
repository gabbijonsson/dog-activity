import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'

import {
	EmptyState,
	ErrorState,
	SectionSkeleton,
} from '#/components/dashboard/dashboard-primitives.tsx'
import { DogMeritsSummary } from '#/components/dogs/dog-merits-summary.tsx'
import { EntryCountBadge } from '#/components/dogs/entry-count-badge.tsx'
import { formatDisplayDate } from '#/lib/dates.ts'
import { summarizeDogMerits } from '#/lib/dog-merits.ts'
import { fetchDogsList } from '#/lib/dog-queries.ts'
import { fetchPromotionContext } from '#/lib/promotion-queries.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'
import { cn } from '#/lib/utils.ts'

interface DogsCardsProps {
	onDogSelect: (dogId: string) => void
}

export function DogsCards({ onDogSelect }: DogsCardsProps) {
	const {
		data: dogs = [],
		isLoading: dogsLoading,
		isError: dogsError,
		refetch: refetchDogs,
	} = useQuery({
		queryKey: queryKeys.dogs.list(),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchDogsList(supabase)
		},
	})

	const {
		data: promotionContext,
		isLoading: meritsLoading,
		isError: meritsError,
		refetch: refetchMerits,
	} = useQuery({
		queryKey: queryKeys.promotion.context(),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchPromotionContext(supabase)
		},
	})

	const isLoading = dogsLoading || meritsLoading
	const isError = dogsError || meritsError

	if (isLoading) {
		return <SectionSkeleton rows={4} />
	}

	if (isError) {
		return (
			<ErrorState
				title="Kunde inte ladda hundar"
				description="Kontrollera anslutningen och försök igen."
				onRetry={() => {
					void refetchDogs()
					void refetchMerits()
				}}
			/>
		)
	}

	if (dogs.length === 0) {
		return (
			<EmptyState
				title="Inga hundar än"
				description="Lägg till din första hund för att börja anmäla till tävlingar."
			/>
		)
	}

	return (
		<ul className="grid gap-4 sm:grid-cols-2">
			{dogs.map((dog) => {
				const merits = promotionContext
					? summarizeDogMerits(dog.id, promotionContext)
					: { nosework: [], rally: [] }
				const meta = [
					dog.breed,
					dog.date_of_birth && formatDisplayDate(dog.date_of_birth),
				]
					.filter(Boolean)
					.join(' · ')

				return (
					<li key={dog.id}>
						<button
							type="button"
							className={cn(
								'record-card record-card-accent-dog group flex h-full w-full flex-col text-left',
								'transition-[box-shadow,border-color] hover:border-[color-mix(in_oklab,var(--palm)_35%,var(--line))]',
							)}
							onClick={() => onDogSelect(dog.id)}
						>
							<div className="flex items-start gap-3 px-4 py-4">
								<div className="min-w-0 flex-1">
									<p className="display-title text-lg leading-tight">
										{dog.name}
									</p>
									{meta ? (
										<p className="mt-1 text-xs text-muted-foreground">{meta}</p>
									) : (
										<p className="mt-1 text-xs text-muted-foreground">
											Ingen ras eller födelsedatum
										</p>
									)}
								</div>
								<div className="flex shrink-0 flex-col items-end gap-2">
									<EntryCountBadge count={dog.entry_count} />
									<ChevronRight
										className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
										aria-hidden="true"
									/>
								</div>
							</div>

							<div className="border-t border-border/60 bg-muted/10 px-4 py-3">
								<p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
									Meriter
								</p>
								<DogMeritsSummary merits={merits} variant="compact" />
							</div>
						</button>
					</li>
				)
			})}
		</ul>
	)
}
