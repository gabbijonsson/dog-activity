import type { DayButton } from '@daypicker/react'
import { sv } from '@daypicker/react/locale'
import { useQuery } from '@tanstack/react-query'
import {
	addYears,
	endOfYear,
	format,
	isSameMonth,
	parseISO,
	startOfMonth,
	startOfYear,
} from 'date-fns'
import { CalendarPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AddToCalendarButton } from '#/components/calendar/add-to-calendar-button.tsx'
import {
	ErrorState,
	SectionSkeleton,
} from '#/components/dashboard/dashboard-primitives.tsx'
import { EventTypeLegend } from '#/components/dashboard/event-type-legend.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Calendar, CalendarDayButton } from '#/components/ui/calendar.tsx'
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverHeader,
	PopoverTitle,
} from '#/components/ui/popover.tsx'
import {
	calendarEventChipClass,
	calendarEventDotClass,
	calendarEventLabelClass,
	calendarEventVisualState,
} from '#/lib/calendar-event-visual.ts'
import {
	CALENDAR_EVENT_CONFIG,
	type CalendarEventType,
	calendarEventDisplayTitle,
} from '#/lib/calendar-events.ts'
import { calendarExportFromEvent } from '#/lib/calendar-export.ts'
import {
	type CalendarEventWithCompetition,
	fetchCalendarEventsForRange,
} from '#/lib/dashboard-queries.ts'
import {
	formatDisplayDateTime,
	monthRange,
	toDateString,
	toLocalDateString,
} from '#/lib/dates.ts'
import { calendarEventLabelWithEmojis } from '#/lib/handler-emoji.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { sportLabel } from '#/lib/sports.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'
import { cn } from '#/lib/utils.ts'

interface MonthCalendarProps {
	onCompetitionSelect: (competitionId: string) => void
	onAddCompetition?: (date: Date) => void
}

export function MonthCalendar({
	onCompetitionSelect,
	onAddCompetition,
}: MonthCalendarProps) {
	const [visibleMonth, setVisibleMonth] = useState(() =>
		startOfMonth(new Date()),
	)
	const [popoverDay, setPopoverDay] = useState<Date | undefined>()
	const [popoverOpen, setPopoverOpen] = useState(false)
	const [mounted, setMounted] = useState(false)
	const [selectedEventTypes, setSelectedEventTypes] = useState<
		CalendarEventType[]
	>([])

	useEffect(() => {
		setMounted(true)
	}, [])

	const { from, to } = monthRange(visibleMonth)

	const {
		data: events = [],
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: queryKeys.dashboard.calendarMonth(from, to),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchCalendarEventsForRange(supabase, from, to)
		},
	})

	const filteredEvents = useMemo(() => {
		if (selectedEventTypes.length === 0) return events
		const selected = new Set(selectedEventTypes)
		return events.filter((event) => selected.has(event.event_type))
	}, [events, selectedEventTypes])

	const eventsByDate = useMemo(() => {
		const map = new Map<string, CalendarEventWithCompetition[]>()
		for (const event of filteredEvents) {
			const dayKey = toLocalDateString(event.event_date)
			const existing = map.get(dayKey) ?? []
			existing.push(event)
			map.set(dayKey, existing)
		}
		return map
	}, [filteredEvents])

	const popoverDayEvents = useMemo(() => {
		if (!popoverDay) return []
		return eventsByDate.get(toDateString(popoverDay)) ?? []
	}, [eventsByDate, popoverDay])

	const daysWithEvents = useMemo(
		() => filteredEvents.map((event) => parseISO(event.event_date)),
		[filteredEvents],
	)

	function toggleEventType(type: CalendarEventType) {
		setSelectedEventTypes((current) =>
			current.includes(type)
				? current.filter((item) => item !== type)
				: [...current, type],
		)
	}

	const handleAddCompetition = (date: Date) => {
		onAddCompetition?.(date)
		setPopoverOpen(false)
	}

	const goToToday = () => {
		setVisibleMonth(startOfMonth(new Date()))
	}

	const isViewingToday =
		mounted && isSameMonth(visibleMonth, startOfMonth(new Date()))

	return (
		<section className="island-shell rounded-xl p-4 sm:p-6">
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div className="flex flex-wrap items-center gap-3">
					<h2 className="island-kicker">Kalender</h2>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={isViewingToday}
						onClick={goToToday}
					>
						Idag
					</Button>
				</div>
				<EventTypeLegend
					selectedTypes={selectedEventTypes}
					onToggleType={toggleEventType}
					onClear={() => setSelectedEventTypes([])}
				/>
			</div>

			{isLoading ? (
				<SectionSkeleton rows={6} />
			) : isError ? (
				<ErrorState
					title="Kunde inte ladda kalender"
					description="Kontrollera anslutningen och försök igen."
					onRetry={() => void refetch()}
				/>
			) : (
				<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
					<PopoverAnchor asChild>
						<div className="w-full">
							<Calendar
								month={visibleMonth}
								onMonthChange={setVisibleMonth}
								captionLayout="dropdown"
								startMonth={startOfYear(addYears(new Date(), -1))}
								endMonth={endOfYear(addYears(new Date(), 2))}
								showOutsideDays
								modifiers={{ hasEvents: daysWithEvents }}
								onDayClick={(date) => {
									setPopoverDay(date)
									setPopoverOpen(true)
								}}
								className="w-full bg-transparent p-0 [--cell-size:1.35rem] sm:[--cell-size:1.5rem] md:[--cell-size:1.65rem]"
								classNames={{
									root: 'w-full',
									months: 'relative w-full',
									month: 'w-full gap-3',
									month_caption: 'mb-1 h-auto px-0',
									month_grid: 'w-full table-fixed border-collapse',
									weekdays: 'border-b border-border/60',
									weekday:
										'pb-1.5 text-center text-[0.75rem] font-normal text-muted-foreground',
									week: 'border-0',
									day: 'h-14 p-px text-left align-top sm:h-16 md:h-[4.25rem]',
									today: 'font-semibold',
								}}
								components={{
									DayButton: (props) => (
										<CalendarDayWithEvents
											{...props}
											eventsByDate={eventsByDate}
										/>
									),
								}}
							/>
						</div>
					</PopoverAnchor>

					<PopoverContent
						className="w-[min(20rem,calc(100vw-2rem))] p-0"
						align="center"
						onOpenAutoFocus={(event) => event.preventDefault()}
						onPointerDownOutside={(event) => {
							if ((event.target as HTMLElement).closest('[data-day]')) {
								event.preventDefault()
							}
						}}
						onInteractOutside={(event) => {
							if ((event.target as HTMLElement).closest('[data-day]')) {
								event.preventDefault()
							}
						}}
					>
						<PopoverHeader className="flex flex-row items-center justify-between gap-2 border-b border-border px-4 py-3">
							<PopoverTitle className="min-w-0 flex-1 leading-snug">
								{popoverDay
									? format(popoverDay, 'EEEE, d MMMM yyyy', { locale: sv })
									: 'Events'}
							</PopoverTitle>
							{popoverDayEvents.length > 0 && popoverDay && (
								<Button
									type="button"
									size="icon-sm"
									className="shrink-0"
									aria-label="Lägg till tävling"
									onClick={() => handleAddCompetition(popoverDay)}
								>
									<CalendarPlus />
								</Button>
							)}
						</PopoverHeader>
						<div className="max-h-72 overflow-y-auto p-2">
							{popoverDayEvents.length === 0 ? (
								<div className="flex justify-center px-2 py-6">
									<Button
										type="button"
										onClick={() =>
											popoverDay && handleAddCompetition(popoverDay)
										}
									>
										<CalendarPlus />
										Lägg till tävling
									</Button>
								</div>
							) : (
								<ul className="space-y-1">
									{popoverDayEvents.map((event) => {
										const config = CALENDAR_EVENT_CONFIG[event.event_type]
										const visualState = calendarEventVisualState(event)
										const title = calendarEventDisplayTitle(event)
										const displayTitle = calendarEventLabelWithEmojis(
											title,
											event.competitions?.entries ?? [],
										)
										const showTime =
											event.event_type !== 'payment' &&
											event.event_type !== 'sign_up_close'
										return (
											<li key={event.id}>
												<div className="flex items-start gap-1">
													<button
														type="button"
														className="flex min-w-0 flex-1 items-start gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/70"
														onClick={() => {
															onCompetitionSelect(event.competition_id)
															setPopoverOpen(false)
														}}
													>
														<span
															className={cn(
																'mt-1.5 size-2 shrink-0 rounded-full',
																calendarEventDotClass(
																	event.event_type,
																	visualState,
																),
															)}
															aria-hidden="true"
														/>
														<span className="min-w-0">
															<span
																className={cn(
																	'block text-xs font-semibold uppercase tracking-wide',
																	calendarEventLabelClass(
																		event.event_type,
																		visualState,
																	),
																)}
															>
																{config.label}
															</span>
															<span
																className={cn(
																	'block truncate text-sm font-medium',
																	visualState !== 'default' &&
																		'text-muted-foreground',
																)}
															>
																{displayTitle}
															</span>
															{showTime && (
																<time
																	dateTime={event.event_date}
																	className="block text-xs tabular-nums text-muted-foreground"
																>
																	{formatDisplayDateTime(event.event_date)}
																</time>
															)}
															{event.competitions && (
																<span className="block truncate text-xs text-muted-foreground">
																	{sportLabel(event.competitions.sport)}
																	{event.competitions.location
																		? ` · ${event.competitions.location}`
																		: ''}
																</span>
															)}
														</span>
													</button>
													<AddToCalendarButton
														event={calendarExportFromEvent(event)}
														className="mt-1.5"
													/>
												</div>
											</li>
										)
									})}
								</ul>
							)}
						</div>
					</PopoverContent>
				</Popover>
			)}
		</section>
	)
}

const MAX_VISIBLE_EVENTS = 3

function CalendarDayWithEvents({
	day,
	modifiers,
	eventsByDate,
	className,
	children,
	...props
}: React.ComponentProps<typeof DayButton> & {
	eventsByDate: Map<string, CalendarEventWithCompetition[]>
}) {
	const dayKey = toDateString(day.date)
	const dayEvents = eventsByDate.get(dayKey) ?? []
	const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS)
	const overflow = dayEvents.length - visibleEvents.length

	return (
		<CalendarDayButton
			day={day}
			modifiers={modifiers}
			className={cn(
				'aspect-auto h-full min-h-0 w-full cursor-pointer flex-col items-start justify-start gap-0.5 px-0.5 py-0.5 text-left font-normal',
				modifiers.today && 'ring-1 ring-primary/40',
				modifiers.outside && 'text-muted-foreground/50',
				className,
			)}
			{...props}
		>
			<span className="shrink-0 text-xs leading-none opacity-100">
				{children}
			</span>
			{visibleEvents.length > 0 && (
				<span
					className="flex min-h-0 w-full flex-1 flex-col gap-px overflow-hidden"
					aria-hidden="true"
				>
					{visibleEvents.map((event) => {
						const title = calendarEventDisplayTitle(event)
						const visualState = calendarEventVisualState(event)
						const displayTitle = calendarEventLabelWithEmojis(
							title,
							event.competitions?.entries ?? [],
						)
						return (
							<span
								key={event.id}
								title={displayTitle}
								className={cn(
									'block w-full truncate rounded-sm px-1 py-px text-left text-[0.6875rem] leading-snug font-medium',
									calendarEventChipClass(event.event_type, visualState),
									modifiers.outside && 'opacity-60',
								)}
							>
								{displayTitle}
							</span>
						)
					})}
					{overflow > 0 && (
						<span className="truncate px-1 text-left text-[0.625rem] leading-snug text-muted-foreground">
							+{overflow} till
						</span>
					)}
				</span>
			)}
			{dayEvents.length > 0 && (
				<span className="sr-only">
					{dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
				</span>
			)}
		</CalendarDayButton>
	)
}
