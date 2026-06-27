import { Link, useRouterState } from '@tanstack/react-router'
import { Dog, LayoutDashboard, Trophy } from 'lucide-react'

import { UserMenu } from '#/components/user-menu.tsx'
import { APP_NAME } from '#/lib/page-meta.ts'

const navItems = [
	{ to: '/', label: 'Översikt', icon: LayoutDashboard },
	{ to: '/competitions', label: 'Tävlingar', icon: Trophy },
	{ to: '/dogs', label: 'Hundar', icon: Dog },
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})
	const isLoginPage = pathname === '/login'

	if (isLoginPage) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center p-4">
				{children}
			</div>
		)
	}

	return (
		<div className="flex min-h-screen flex-col">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-lg"
			>
				Hoppa till innehåll
			</a>
			<header className="sticky top-0 z-40 border-b border-border/80 bg-header/90 backdrop-blur-md">
				<div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6">
					<div className="flex min-w-0 flex-1 items-center gap-6">
						<Link to="/" className="display-title truncate text-base sm:hidden">
							{APP_NAME}
						</Link>
						<nav
							className="hidden items-center gap-6 sm:flex"
							aria-label="Huvudmeny"
						>
							{navItems.map(({ to, label }) => (
								<Link
									key={to}
									to={to}
									className="nav-link text-sm font-medium"
									activeProps={{ className: 'nav-link is-active' }}
									activeOptions={{ exact: to === '/' }}
								>
									{label}
								</Link>
							))}
						</nav>
					</div>
					<UserMenu />
				</div>
			</header>
			<main
				id="main-content"
				className="w-full flex-1 px-4 py-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-6 sm:pb-6"
			>
				{children}
			</main>
			<nav
				className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-header/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
				aria-label="Mobilmeny"
			>
				<ul className="grid grid-cols-3">
					{navItems.map(({ to, label, icon: Icon }) => (
						<li key={to}>
							<Link
								to={to}
								className="mobile-nav-link flex flex-col items-center gap-1 px-2 py-2.5 text-[0.68rem] font-semibold"
								activeProps={{ className: 'mobile-nav-link is-active' }}
								activeOptions={{ exact: to === '/' }}
							>
								<Icon className="size-5" aria-hidden="true" />
								<span>{label}</span>
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</div>
	)
}
