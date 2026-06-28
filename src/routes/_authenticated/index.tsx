import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

import { MonthCalendar } from '#/components/calendar/month-calendar.tsx'
import { CompetitionDetailDrawer } from '#/components/competitions/competition-detail-drawer.tsx'
import { DeadlineCards } from '#/components/dashboard/deadline-cards.tsx'
import { UpcomingEventsTable } from '#/components/dashboard/upcoming-events-table.tsx'
import { toDateString } from '#/lib/dates.ts'

import { pageTitle } from '#/lib/page-meta.ts'

export const Route = createFileRoute('/_authenticated/')({
	head: () => ({
		meta: [{ title: pageTitle('Översikt') }],
	}),
	component: DashboardPage,
})

function DashboardPage() {
	const navigate = useNavigate()
	const [selectedCompetitionId, setSelectedCompetitionId] = useState<
		string | null
	>(null)
	const [drawerOpen, setDrawerOpen] = useState(false)

	const handleCompetitionSelect = useCallback((competitionId: string) => {
		setSelectedCompetitionId(competitionId)
		setDrawerOpen(true)
	}, [])

	const handleAddCompetition = useCallback(
		(date: Date) => {
			void navigate({
				to: '/competitions',
				search: { event_date: toDateString(date) },
			})
		},
		[navigate],
	)

	return (
		<div className="rise-in">
			<div className="grid gap-6 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] lg:items-start">
				<div className="min-w-0 space-y-6">
					<MonthCalendar
						onCompetitionSelect={handleCompetitionSelect}
						onAddCompetition={handleAddCompetition}
					/>
					<DeadlineCards onCompetitionSelect={handleCompetitionSelect} />
				</div>

				<aside className="min-w-0 lg:sticky lg:top-6">
					<UpcomingEventsTable onCompetitionSelect={handleCompetitionSelect} />
				</aside>
			</div>

			<CompetitionDetailDrawer
				competitionId={selectedCompetitionId}
				open={drawerOpen}
				onOpenChange={setDrawerOpen}
			/>
		</div>
	)
}
