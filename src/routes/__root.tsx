import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { ThemeProvider } from 'next-themes'
import { AppShell } from '#/components/app-shell.tsx'
import { AuthProvider } from '#/components/auth-provider.tsx'
import { ErrorPage } from '#/components/error-page.tsx'
import { NotFoundPage } from '#/components/not-found-page.tsx'
import { Toaster } from '#/components/ui/sonner.tsx'
import { pageTitle } from '#/lib/page-meta.ts'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import TanstackQueryProvider from '../integrations/tanstack-query/root-provider'
import appCss from '../styles.css?url'

interface MyRouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: pageTitle(),
			},
			{
				name: 'description',
				content:
					'Track Nose Work and Rally competitions, sign-up deadlines, and entries.',
			},
			{
				name: 'theme-color',
				content: '#2456d6',
			},
		],
		links: [
			{
				rel: 'stylesheet',
				href: appCss,
			},
			{
				rel: 'icon',
				href: '/favicon.svg',
				type: 'image/svg+xml',
			},
			{
				rel: 'manifest',
				href: '/manifest.json',
			},
		],
	}),
	notFoundComponent: NotFoundPage,
	errorComponent: ErrorPage,
	component: RootComponent,
	shellComponent: RootDocument,
})

function RootComponent() {
	const { queryClient } = Route.useRouteContext()

	return (
		<TanstackQueryProvider queryClient={queryClient}>
			<AuthProvider>
				<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
					<AppShell>
						<Outlet />
					</AppShell>
					<Toaster richColors closeButton />
				</ThemeProvider>
			</AuthProvider>
		</TanstackQueryProvider>
	)
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body suppressHydrationWarning>
				{children}
				<TanStackDevtools
					config={{
						position: 'bottom-right',
					}}
					plugins={[
						{
							name: 'Tanstack Router',
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	)
}
