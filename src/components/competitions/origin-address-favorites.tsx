import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookmarkPlus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '#/components/ui/alert-dialog.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
	addressesMatch,
	createOriginAddressFavorite,
	defaultOriginFavoriteLabel,
	deleteOriginAddressFavorite,
	fetchOriginAddressFavorites,
} from '#/lib/origin-favorite-queries.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'
import { cn } from '#/lib/utils.ts'

interface OriginAddressFavoritesProps {
	value: string
	onSelect: (address: string) => void
	active?: boolean
}

export function OriginAddressFavorites({
	value,
	onSelect,
	active = true,
}: OriginAddressFavoritesProps) {
	const queryClient = useQueryClient()
	const [saveOpen, setSaveOpen] = useState(false)
	const [label, setLabel] = useState('')

	const { data: favorites = [], isLoading } = useQuery({
		queryKey: queryKeys.originFavorites.list(),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchOriginAddressFavorites(supabase)
		},
		enabled: active,
	})

	const saveMutation = useMutation({
		mutationFn: async () => {
			const supabase = getBrowserSupabase()
			return createOriginAddressFavorite(supabase, {
				label,
				address: value,
			})
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.originFavorites.all,
			})
			toast.success('Startadress sparad')
			setSaveOpen(false)
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : 'Kunde inte spara genvägen',
			)
		},
	})

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			const supabase = getBrowserSupabase()
			await deleteOriginAddressFavorite(supabase, id)
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.originFavorites.all,
			})
			toast.success('Genväg borttagen')
		},
		onError: () => {
			toast.error('Kunde inte ta bort genvägen')
		},
	})

	const trimmedValue = value.trim()
	const alreadySaved = favorites.some((favorite) =>
		addressesMatch(favorite.address, trimmedValue),
	)
	const canSave = trimmedValue.length > 0 && !alreadySaved

	function openSaveDialog() {
		setLabel(defaultOriginFavoriteLabel(trimmedValue))
		setSaveOpen(true)
	}

	if (!active) return null

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Sparade startadresser
				</p>
				{canSave && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-7 px-2 text-xs"
						onClick={openSaveDialog}
					>
						<BookmarkPlus className="size-3.5" aria-hidden="true" />
						Spara nuvarande
					</Button>
				)}
			</div>

			{isLoading ? (
				<p className="text-xs text-muted-foreground">Laddar genvägar…</p>
			) : favorites.length === 0 ? (
				<p className="text-xs text-muted-foreground">
					Inga sparade adresser än. Skriv en adress och klicka Spara nuvarande.
				</p>
			) : (
				<div className="flex flex-wrap gap-2">
					{favorites.map((favorite) => {
						const selected = addressesMatch(favorite.address, trimmedValue)

						return (
							<div key={favorite.id} className="group relative">
								<Button
									type="button"
									variant={selected ? 'default' : 'outline'}
									size="sm"
									className={cn(
										'h-8 max-w-full pr-8 text-xs',
										selected && 'shadow-sm',
									)}
									title={favorite.address}
									onClick={() => onSelect(favorite.address)}
								>
									<span className="truncate">{favorite.label}</span>
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute top-0 right-0 size-8 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
									aria-label={`Ta bort ${favorite.label}`}
									disabled={deleteMutation.isPending}
									onClick={() => void deleteMutation.mutateAsync(favorite.id)}
								>
									<X className="size-3.5" aria-hidden="true" />
								</Button>
							</div>
						)
					})}
				</div>
			)}

			<AlertDialog open={saveOpen} onOpenChange={setSaveOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Spara startadress</AlertDialogTitle>
						<AlertDialogDescription>
							Ge genvägen ett kort namn, till exempel Hemma eller Stuga.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<div className="space-y-2">
						<Label htmlFor="origin-favorite-label">Namn</Label>
						<Input
							id="origin-favorite-label"
							value={label}
							onChange={(event) => setLabel(event.target.value)}
							placeholder="Hemma"
						/>
						<p className="text-xs text-muted-foreground">{trimmedValue}</p>
					</div>

					<AlertDialogFooter>
						<AlertDialogCancel>Avbryt</AlertDialogCancel>
						<AlertDialogAction
							disabled={!label.trim() || saveMutation.isPending}
							onClick={(event) => {
								event.preventDefault()
								void saveMutation.mutateAsync()
							}}
						>
							{saveMutation.isPending ? 'Sparar…' : 'Spara'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
