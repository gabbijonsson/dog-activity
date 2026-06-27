import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
	noseworkClassLabel,
	noseworkTypeLabel,
	rallyLevelLabel,
} from '#/lib/competition-labels.ts'
import type { DogInput } from '#/lib/schemas.ts'

interface DogPriorCountsFieldsProps {
	noseworkValues: DogInput['prior_nosework_diplomas']
	rallyValues: DogInput['prior_rally_qualified']
	onNoseworkChange: (index: number, count: number) => void
	onRallyChange: (index: number, count: number) => void
	disabled?: boolean
}

export function DogPriorCountsFields({
	noseworkValues,
	rallyValues,
	onNoseworkChange,
	onRallyChange,
	disabled = false,
}: DogPriorCountsFieldsProps) {
	const noseworkWithCounts = noseworkValues.filter((row) => row.count > 0)
	const rallyWithCounts = rallyValues.filter((row) => row.count > 0)

	return (
		<div className="flex min-h-0 flex-col rounded-lg border border-border/70 bg-muted/15">
			<div className="shrink-0 space-y-1 border-b border-border/60 px-4 py-3">
				<p className="island-kicker">Meriter utanför appen</p>
				<p className="text-xs text-muted-foreground">
					Tidigare diplom (Nose Work) och kvalificerade starter (Rally).
				</p>
			</div>

			<div className="min-h-0 max-h-56 space-y-4 overflow-y-auto px-4 py-3">
				<div>
					<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Nose Work
					</p>
					<div className="space-y-2">
						{noseworkValues.map((row, index) => (
							<div
								key={`${row.type}-${row.class}`}
								className="grid grid-cols-[1fr_5rem] items-center gap-2 text-sm"
							>
								<Label
									htmlFor={`prior-nw-${row.type}-${row.class}`}
									className="font-normal"
								>
									{noseworkTypeLabel(row.type)} ·{' '}
									{noseworkClassLabel(row.class)}
								</Label>
								<Input
									id={`prior-nw-${row.type}-${row.class}`}
									type="number"
									min={0}
									max={99}
									inputMode="numeric"
									value={row.count}
									disabled={disabled}
									onChange={(event) => {
										const parsed = Number.parseInt(event.target.value, 10)
										onNoseworkChange(
											index,
											Number.isFinite(parsed) ? parsed : 0,
										)
									}}
								/>
							</div>
						))}
					</div>
					{noseworkWithCounts.length === 0 ? (
						<p className="mt-2 text-xs text-muted-foreground">
							Inga tidigare diplom angivna.
						</p>
					) : null}
				</div>

				<div className="border-t border-border/60 pt-4">
					<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Rally
					</p>
					<div className="space-y-2">
						{rallyValues.map((row, index) => (
							<div
								key={row.level}
								className="grid grid-cols-[1fr_5rem] items-center gap-2 text-sm"
							>
								<Label
									htmlFor={`prior-rally-${row.level}`}
									className="font-normal"
								>
									{rallyLevelLabel(row.level)}
								</Label>
								<Input
									id={`prior-rally-${row.level}`}
									type="number"
									min={0}
									max={99}
									inputMode="numeric"
									value={row.count}
									disabled={disabled}
									onChange={(event) => {
										const parsed = Number.parseInt(event.target.value, 10)
										onRallyChange(index, Number.isFinite(parsed) ? parsed : 0)
									}}
								/>
							</div>
						))}
					</div>
					{rallyWithCounts.length === 0 ? (
						<p className="mt-2 text-xs text-muted-foreground">
							Inga tidigare kvalificerade resultat angivna.
						</p>
					) : null}
				</div>
			</div>
		</div>
	)
}
