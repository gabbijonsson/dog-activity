import { Link } from '@tanstack/react-router'
import { LogOutIcon, MoonIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { useAuth } from '#/components/auth-provider.tsx'
import { Avatar, AvatarFallback } from '#/components/ui/avatar.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import { Switch } from '#/components/ui/switch.tsx'

function getInitials(name: string | null | undefined, email: string) {
	if (name?.trim()) {
		const parts = name.trim().split(/\s+/)
		if (parts.length >= 2) {
			return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
		}
		return name.slice(0, 2).toUpperCase()
	}
	return email.slice(0, 2).toUpperCase()
}

function ThemeMenuSwitch() {
	const { resolvedTheme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const isDark = mounted && resolvedTheme === 'dark'

	return (
		<DropdownMenuItem
			onSelect={(event) => event.preventDefault()}
			className="flex items-center justify-between gap-2"
		>
			<span className="flex items-center gap-2">
				<MoonIcon aria-hidden="true" />
				Mörkt läge
			</span>
			<Switch
				size="sm"
				checked={isDark}
				disabled={!mounted}
				onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
				onClick={(event) => event.stopPropagation()}
				aria-label="Mörkt läge"
			/>
		</DropdownMenuItem>
	)
}

export function UserMenu() {
	const { isLoading, isAuthenticated, user, profile, signOut } = useAuth()

	if (isLoading) {
		return (
			<div className="size-8 animate-pulse rounded-full bg-muted" aria-hidden />
		)
	}

	if (!isAuthenticated || !user) {
		return (
			<Button variant="outline" size="sm" asChild>
				<Link to="/login" search={{ redirect: '/' }}>
					Logga in
				</Link>
			</Button>
		)
	}

	const displayName = profile?.full_name ?? user.email ?? 'User'
	const email = user.email ?? ''

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="rounded-full"
					aria-label="Öppna användarmenyn"
				>
					<Avatar size="sm">
						<AvatarFallback>
							{getInitials(profile?.full_name, email)}
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col gap-1">
						<p className="text-sm font-medium leading-none">{displayName}</p>
						<p className="text-xs text-muted-foreground">{email}</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<ThemeMenuSwitch />
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={() => {
						void signOut()
					}}
				>
					<LogOutIcon aria-hidden="true" />
					Logga ut
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
