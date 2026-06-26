import { useEffect, useId, useRef, useState } from 'react'

import { Input } from '#/components/ui/input.tsx'
import { getGoogleMapsBrowserKey } from '#/lib/env.ts'
import {
	createPlacesSessionToken,
	fetchPlaceSuggestions,
	type PlaceSuggestion,
} from '#/lib/places-autocomplete.ts'
import { cn } from '#/lib/utils.ts'

interface AddressAutocompleteFieldProps {
	id: string
	value: string
	onChange: (value: string) => void
	onBlur?: () => void
	placeholder?: string
	invalid?: boolean
	active?: boolean
	className?: string
}

export function AddressAutocompleteField({
	id,
	value,
	onChange,
	onBlur,
	placeholder,
	invalid = false,
	active = true,
	className,
}: AddressAutocompleteFieldProps) {
	const listId = useId()
	const sessionTokenRef = useRef(createPlacesSessionToken())
	const debounceRef = useRef<number | undefined>(undefined)
	const blurTimeoutRef = useRef<number | undefined>(undefined)
	const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
	const [open, setOpen] = useState(false)
	const [highlightedIndex, setHighlightedIndex] = useState(-1)
	const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

	useEffect(() => {
		if (!active) {
			setSuggestions([])
			setOpen(false)
			return
		}

		window.clearTimeout(debounceRef.current)

		const query = value.trim()
		if (query.length < 2 || !getGoogleMapsBrowserKey()) {
			setSuggestions([])
			setOpen(false)
			setStatus('idle')
			return
		}

		debounceRef.current = window.setTimeout(() => {
			setStatus('loading')
			void fetchPlaceSuggestions(query, sessionTokenRef.current)
				.then((results) => {
					setSuggestions(results)
					setOpen(results.length > 0)
					setHighlightedIndex(results.length > 0 ? 0 : -1)
					setStatus('idle')
				})
				.catch((error: unknown) => {
					console.error('Places autocomplete failed', error)
					setSuggestions([])
					setOpen(false)
					setStatus('error')
				})
		}, 250)

		return () => {
			window.clearTimeout(debounceRef.current)
		}
	}, [active, value])

	useEffect(() => {
		return () => {
			window.clearTimeout(blurTimeoutRef.current)
		}
	}, [])

	function selectSuggestion(suggestion: PlaceSuggestion) {
		onChange(suggestion.label)
		sessionTokenRef.current = createPlacesSessionToken()
		setSuggestions([])
		setOpen(false)
		setHighlightedIndex(-1)
		onBlur?.()
	}

	function handleBlur() {
		blurTimeoutRef.current = window.setTimeout(() => {
			setOpen(false)
			onBlur?.()
		}, 150)
	}

	function handleFocus() {
		window.clearTimeout(blurTimeoutRef.current)
		if (suggestions.length > 0) {
			setOpen(true)
		}
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (!open || suggestions.length === 0) return

		if (event.key === 'ArrowDown') {
			event.preventDefault()
			setHighlightedIndex((current) =>
				current + 1 >= suggestions.length ? 0 : current + 1,
			)
			return
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault()
			setHighlightedIndex((current) =>
				current - 1 < 0 ? suggestions.length - 1 : current - 1,
			)
			return
		}

		if (event.key === 'Enter' && highlightedIndex >= 0) {
			event.preventDefault()
			const suggestion = suggestions[highlightedIndex]
			if (suggestion) selectSuggestion(suggestion)
			return
		}

		if (event.key === 'Escape') {
			setOpen(false)
		}
	}

	return (
		<div className={cn('relative', className)}>
			<Input
				id={id}
				value={value}
				placeholder={placeholder}
				onBlur={handleBlur}
				onFocus={handleFocus}
				onKeyDown={handleKeyDown}
				onChange={(event) => onChange(event.target.value)}
				aria-invalid={invalid}
				aria-autocomplete="list"
				aria-expanded={open}
				aria-controls={open ? listId : undefined}
				role="combobox"
				autoComplete="off"
			/>

			{open && suggestions.length > 0 && (
				<div
					id={listId}
					role="listbox"
					className="absolute z-[100] mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"
				>
					{suggestions.map((suggestion, index) => (
						<div key={suggestion.id} role="presentation">
							<button
								type="button"
								role="option"
								aria-selected={index === highlightedIndex}
								className={cn(
									'flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
									index === highlightedIndex &&
										'bg-accent text-accent-foreground',
								)}
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => selectSuggestion(suggestion)}
							>
								<span className="font-medium">{suggestion.label}</span>
								{suggestion.secondary && (
									<span className="text-xs text-muted-foreground">
										{suggestion.secondary}
									</span>
								)}
							</button>
						</div>
					))}
				</div>
			)}

			{status === 'loading' && value.trim().length >= 2 && (
				<p className="mt-1 text-xs text-muted-foreground">Söker adresser…</p>
			)}

			{status === 'error' && (
				<p className="mt-1 text-xs text-muted-foreground">
					Kunde inte hämta adressförslag — skriv adressen manuellt.
				</p>
			)}
		</div>
	)
}
