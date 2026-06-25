import { format, parseISO } from 'date-fns'
import { sv } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '#/components/ui/button.tsx'
import { Calendar } from '#/components/ui/calendar.tsx'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '#/components/ui/popover.tsx'
import { cn } from '#/lib/utils.ts'

interface DatePickerFieldProps {
	id: string
	value: string
	onChange: (value: string) => void
	onBlur?: () => void
	placeholder?: string
	'aria-invalid'?: boolean
}

export function DatePickerField({
	id,
	value,
	onChange,
	onBlur,
	placeholder = 'Välj datum',
	'aria-invalid': ariaInvalid,
}: DatePickerFieldProps) {
	const [open, setOpen] = useState(false)
	const selected = value ? parseISO(value) : undefined

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					type="button"
					variant="outline"
					onBlur={onBlur}
					aria-invalid={ariaInvalid}
					className={cn(
						'w-full justify-start text-left font-normal',
						!value && 'text-muted-foreground',
					)}
				>
					<CalendarIcon className="size-4" aria-hidden="true" />
					{selected
						? format(selected, 'd MMM yyyy', { locale: sv })
						: placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={selected}
					onSelect={(date) => {
						onChange(date ? format(date, 'yyyy-MM-dd') : '')
						setOpen(false)
					}}
					defaultMonth={selected}
				/>
			</PopoverContent>
		</Popover>
	)
}
