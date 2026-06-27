import { ChevronDown } from 'lucide-react'

import { Button } from '#/components/ui/button.tsx'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import { cn } from '#/lib/utils.ts'

export interface MultiSelectFilterOption {
	value: string
	label: string
}

interface MultiSelectFilterProps {
	placeholder: string
	options: MultiSelectFilterOption[]
	selected: string[]
	onChange: (selected: string[]) => void
	className?: string
}

export function MultiSelectFilter({
	placeholder,
	options,
	selected,
	onChange,
	className,
}: MultiSelectFilterProps) {
	const selectedLabels = options
		.filter((option) => selected.includes(option.value))
		.map((option) => option.label)

	const triggerLabel =
		selectedLabels.length === 0
			? placeholder
			: selectedLabels.length === 1
				? selectedLabels[0]
				: `${selectedLabels.length} valda`

	function toggleValue(value: string, checked: boolean) {
		if (checked) {
			onChange([...selected, value])
			return
		}

		onChange(selected.filter((item) => item !== value))
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className={cn(
						'w-full justify-between bg-background font-normal',
						className,
					)}
				>
					<span className="truncate">{triggerLabel}</span>
					<ChevronDown
						className="size-4 shrink-0 opacity-50"
						aria-hidden="true"
					/>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-[var(--radix-dropdown-menu-trigger-width)]"
			>
				{options.map((option) => (
					<DropdownMenuCheckboxItem
						key={option.value}
						checked={selected.includes(option.value)}
						onCheckedChange={(checked) =>
							toggleValue(option.value, checked === true)
						}
						onSelect={(event) => event.preventDefault()}
					>
						{option.label}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
