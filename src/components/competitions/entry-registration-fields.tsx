import { useEffect } from 'react'

import { Label } from '#/components/ui/label.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#/components/ui/select.tsx'
import type { Database } from '#/lib/database.types.ts'
import { ENTRY_STATUS_OPTIONS } from '#/lib/entries.ts'
import {
	getAvailableDogs,
	getAvailableHandlers,
} from '#/lib/entry-options.ts'
import type { ProfileListItem } from '#/lib/profile-queries.ts'
import { profileDisplayName } from '#/lib/profile-queries.ts'

type Sport = Database['public']['Enums']['sport']
type EntryStatus = Database['public']['Enums']['entry_status']

type DogOption = { id: string; name: string }

interface EntryRegistrationFieldsProps {
	sport: Sport
	enteredDogIds: Set<string>
	enteredHandlerIds: Set<string>
	dogs: DogOption[]
	handlers: ProfileListItem[]
	dogId: string
	handlerId: string
	status: EntryStatus
	onDogIdChange: (id: string) => void
	onHandlerIdChange: (id: string) => void
	onStatusChange: (status: EntryStatus) => void
	disabled?: boolean
	idPrefix?: string
}

export function EntryRegistrationFields({
	sport,
	enteredDogIds,
	enteredHandlerIds,
	dogs,
	handlers,
	dogId,
	handlerId,
	status,
	onDogIdChange,
	onHandlerIdChange,
	onStatusChange,
	disabled = false,
	idPrefix = 'entry',
}: EntryRegistrationFieldsProps) {
	const availableDogs = getAvailableDogs(dogs, enteredDogIds)
	const availableHandlers = getAvailableHandlers(
		handlers,
		enteredHandlerIds,
		sport,
	)

	useEffect(() => {
		if (availableDogs.length === 1 && dogId !== availableDogs[0].id) {
			onDogIdChange(availableDogs[0].id)
		}
	}, [availableDogs, dogId, onDogIdChange])

	useEffect(() => {
		if (
			availableHandlers.length === 1 &&
			handlerId !== availableHandlers[0].id
		) {
			onHandlerIdChange(availableHandlers[0].id)
		}
	}, [availableHandlers, handlerId, onHandlerIdChange])

	const dogFieldId = `${idPrefix}-dog`
	const handlerFieldId = `${idPrefix}-handler`
	const statusFieldId = `${idPrefix}-status`

	return (
		<>
			<div className="space-y-1.5">
				<Label htmlFor={dogFieldId}>Hund</Label>
				{availableDogs.length === 1 ? (
					<p
						id={dogFieldId}
						className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm"
					>
						{availableDogs[0].name}
					</p>
				) : (
					<Select
						value={dogId}
						onValueChange={onDogIdChange}
						disabled={disabled || availableDogs.length === 0}
					>
						<SelectTrigger id={dogFieldId} className="w-full bg-background">
							<SelectValue placeholder="Välj hund" />
						</SelectTrigger>
						<SelectContent>
							{availableDogs.map((dog) => (
								<SelectItem key={dog.id} value={dog.id}>
									{dog.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>

			<div className="space-y-1.5">
				<Label htmlFor={handlerFieldId}>Hundförare</Label>
				{availableHandlers.length === 1 ? (
					<p
						id={handlerFieldId}
						className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm"
					>
						{profileDisplayName(availableHandlers[0])}
					</p>
				) : (
					<Select
						value={handlerId}
						onValueChange={onHandlerIdChange}
						disabled={disabled || availableHandlers.length === 0}
					>
						<SelectTrigger
							id={handlerFieldId}
							className="w-full bg-background"
						>
							<SelectValue placeholder="Välj handler" />
						</SelectTrigger>
						<SelectContent>
							{availableHandlers.map((handler) => (
								<SelectItem key={handler.id} value={handler.id}>
									{profileDisplayName(handler)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>

			<div className="space-y-1.5">
				<Label htmlFor={statusFieldId}>Status</Label>
				<Select
					value={status}
					onValueChange={(value) => onStatusChange(value as EntryStatus)}
					disabled={disabled}
				>
					<SelectTrigger id={statusFieldId} className="w-full bg-background">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{ENTRY_STATUS_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</>
	)
}
