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
		<div className="space-y-4 rounded-lg border border-border/70 bg-muted/15 p-4">
			<div>
				<p className="island-kicker">Tidigare diplom (Nose Work)</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Diplom utanför appen, per typ och klass.
				</p>
			</div>

			<div className="max-h-48 space-y-2 overflow-y-auto pr-1">
				{noseworkValues.map((row, index) => (
					<div
						key={`${row.type}-${row.class}`}
						className="grid grid-cols-[1fr_5rem] items-center gap-2 text-sm"
					>
						<Label
							htmlFor={`prior-nw-${row.type}-${row.class}`}
							className="font-normal"
						>
							{noseworkTypeLabel(row.type)} · {noseworkClassLabel(row.class)}
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
								onNoseworkChange(index, Number.isFinite(parsed) ? parsed : 0)
							}}
						/>
					</div>
				))}
			</div>

			{noseworkWithCounts.length === 0 ? (
				<p className="text-xs text-muted-foreground">
					Inga tidigare diplom angivna.
				</p>
			) : null}

			<div className="border-t border-border/60 pt-4">
				<p className="island-kicker">Tidigare kvalificerade resultat (Rally)</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Kvalificerade starter utanför appen, per nivå.
				</p>
			</div>

			<div className="space-y-2">
				{rallyValues.map((row, index) => (
					<div
						key={row.level}
						className="grid grid-cols-[1fr_5rem] items-center gap-2 text-sm"
					>
						<Label htmlFor={`prior-rally-${row.level}`} className="font-normal">
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
				<p className="text-xs text-muted-foreground">
					Inga tidigare kvalificerade resultat angivna.
				</p>
			) : null}
		</div>
	)
}
