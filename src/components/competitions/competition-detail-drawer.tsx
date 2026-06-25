import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { SectionSkeleton } from '#/components/dashboard/dashboard-primitives.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '#/components/ui/sheet.tsx'
import { fetchCompetitionById } from '#/lib/dashboard-queries.ts'
import { formatDisplayDate, formatDisplayDateTime } from '#/lib/dates.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { sportLabel } from '#/lib/sports.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'

interface CompetitionDetailDrawerProps {
	competitionId: string | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function CompetitionDetailDrawer({
	competitionId,
	open,
	onOpenChange,
}: CompetitionDetailDrawerProps) {
	const { data: competition, isLoading } = useQuery({
		queryKey: queryKeys.competitions.detail(competitionId ?? 'none'),
		queryFn: async () => {
			if (!competitionId) return null
			const supabase = getBrowserSupabase()
			return fetchCompetitionById(supabase, competitionId)
		},
		enabled: open && !!competitionId,
	})

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-md">
				<SheetHeader>
					<SheetTitle className="display-title pr-8">
						{competition?.name ?? 'Competition'}
					</SheetTitle>
					<SheetDescription>
						{competition
							? sportLabel(competition.sport)
							: 'Loading competition details…'}
					</SheetDescription>
				</SheetHeader>

				{isLoading ? (
					<SheetBody>
						<SectionSkeleton rows={5} />
					</SheetBody>
				) : competition ? (
					<SheetBody className="space-y-6">
						<dl className="space-y-4 text-sm">
							<DetailRow
								label="Event date"
								value={formatDisplayDateTime(competition.event_date)}
							/>
							<DetailRow
								label="Sign-up opens"
								value={formatDisplayDateTime(competition.sign_up_opens)}
							/>
							<DetailRow
								label="Sign-up closes"
								value={formatDisplayDateTime(competition.sign_up_closes)}
							/>
							<DetailRow
								label="Payment due"
								value={formatDisplayDate(competition.payment_deadline)}
							/>
							{competition.location && (
								<DetailRow label="Location" value={competition.location} />
							)}
							{competition.origin_location && (
								<DetailRow label="From" value={competition.origin_location} />
							)}
							{competition.drive_distance_text &&
								competition.drive_duration_text && (
									<DetailRow
										label="Drive"
										value={`${competition.drive_distance_text} · ${competition.drive_duration_text}`}
									/>
								)}
							{competition.notes && (
								<DetailRow label="Notes" value={competition.notes} />
							)}
						</dl>

						{competition.url && (
							<Button variant="outline" className="w-full" asChild>
								<a
									href={competition.url}
									target="_blank"
									rel="noopener noreferrer"
								>
									Open competition site
									<ExternalLink className="size-4" aria-hidden="true" />
								</a>
							</Button>
						)}

						<p className="text-xs text-muted-foreground">
							Full entries, map, and editing arrive in Epic 6.
						</p>
					</SheetBody>
				) : (
					<SheetBody>
						<p className="text-sm text-muted-foreground">
							Competition not found.
						</p>
					</SheetBody>
				)}
			</SheetContent>
		</Sheet>
	)
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				{label}
			</dt>
			<dd className="mt-1 font-medium">{value}</dd>
		</div>
	)
}
