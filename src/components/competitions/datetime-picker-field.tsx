import { DatePickerField } from '#/components/dogs/date-picker-field.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'

interface DateTimePickerFieldProps {
	dateId: string
	timeId: string
	dateLabel: string
	dateValue: string
	timeValue: string
	onDateChange: (value: string) => void
	onTimeChange: (value: string) => void
	onBlur?: () => void
	dateInvalid?: boolean
	timeInvalid?: boolean
}

export function DateTimePickerField({
	dateId,
	timeId,
	dateLabel,
	dateValue,
	timeValue,
	onDateChange,
	onTimeChange,
	onBlur,
	dateInvalid,
	timeInvalid,
}: DateTimePickerFieldProps) {
	return (
		<div className="space-y-2">
			<Label>{dateLabel}</Label>
			<div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
				<DatePickerField
					id={dateId}
					value={dateValue}
					onChange={onDateChange}
					onBlur={onBlur}
					aria-invalid={dateInvalid}
				/>
				<Input
					id={timeId}
					type="time"
					value={timeValue}
					onBlur={onBlur}
					onChange={(event) => onTimeChange(event.target.value)}
					aria-invalid={timeInvalid}
					className="bg-background"
				/>
			</div>
		</div>
	)
}
