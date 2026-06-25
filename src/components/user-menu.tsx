import { Link } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";

import { useAuth } from "#/components/auth-provider.tsx";
import { Avatar, AvatarFallback } from "#/components/ui/avatar.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu.tsx";

function getInitials(name: string | null | undefined, email: string) {
	if (name?.trim()) {
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) {
			return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	}
	return email.slice(0, 2).toUpperCase();
}

export function UserMenu() {
	const { isLoading, isAuthenticated, user, profile, signOut } = useAuth();

	if (isLoading) {
		return (
			<div className="size-8 animate-pulse rounded-full bg-muted" aria-hidden />
		);
	}

	if (!isAuthenticated || !user) {
		return (
			<Button variant="outline" size="sm" asChild>
				<Link to="/login">Login</Link>
			</Button>
		);
	}

	const displayName = profile?.full_name ?? user.email ?? "User";
	const email = user.email ?? "";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="rounded-full"
					aria-label="Open user menu"
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
				<DropdownMenuItem
					variant="destructive"
					onClick={() => {
						void signOut();
					}}
				>
					<LogOutIcon />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
