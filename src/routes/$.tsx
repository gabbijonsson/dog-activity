import { createFileRoute } from '@tanstack/react-router'

import { NotFoundPage } from '#/components/not-found-page.tsx'
import { pageTitle } from '#/lib/page-meta.ts'

export const Route = createFileRoute('/$')({
	head: () => ({
		meta: [{ title: pageTitle('Sidan hittades inte') }],
	}),
	component: NotFoundPage,
})
