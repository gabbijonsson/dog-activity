import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'

import { DogDetailDrawer } from '#/components/dogs/dog-detail-drawer.tsx'
import { DogFormDrawer } from '#/components/dogs/dog-form-drawer.tsx'
import { DogsTable } from '#/components/dogs/dogs-table.tsx'
import { Button } from '#/components/ui/button.tsx'

export const Route = createFileRoute('/_authenticated/dogs')({
	component: DogsPage,
})

function DogsPage() {
	const [selectedDogId, setSelectedDogId] = useState<string | null>(null)
	const [detailOpen, setDetailOpen] = useState(false)
	const [formOpen, setFormOpen] = useState(false)
	const [editDogId, setEditDogId] = useState<string | null>(null)

	const handleDogSelect = useCallback((dogId: string) => {
		setSelectedDogId(dogId)
		setDetailOpen(true)
	}, [])

	const handleAddDog = useCallback(() => {
		setEditDogId(null)
		setFormOpen(true)
	}, [])

	const handleEditDog = useCallback((dogId: string) => {
		setDetailOpen(false)
		setEditDogId(dogId)
		setFormOpen(true)
	}, [])

	const handleFormOpenChange = useCallback((open: boolean) => {
		setFormOpen(open)
		if (!open) setEditDogId(null)
	}, [])

	const handleSaved = useCallback((dogId: string) => {
		setSelectedDogId(dogId)
		setDetailOpen(true)
	}, [])

	return (
		<div className="rise-in space-y-6">
			<section className="island-shell rounded-xl p-4 sm:p-6">
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="island-kicker">Stallet</p>
						<h1 className="display-title mt-1 text-2xl sm:text-3xl">Hundar</h1>
						<p className="mt-2 max-w-xl text-sm text-muted-foreground">
							Dina tävlingshundar — namn, ras och anmälningar på ett ställe.
						</p>
					</div>
					<Button onClick={handleAddDog} className="shrink-0">
						<Plus className="size-4" aria-hidden="true" />
						Lägg till hund
					</Button>
				</div>

				<DogsTable onDogSelect={handleDogSelect} />
			</section>

			<DogDetailDrawer
				dogId={selectedDogId}
				open={detailOpen}
				onOpenChange={setDetailOpen}
				onEdit={handleEditDog}
			/>

			<DogFormDrawer
				open={formOpen}
				onOpenChange={handleFormOpenChange}
				dogId={editDogId}
				onSaved={handleSaved}
			/>
		</div>
	)
}
