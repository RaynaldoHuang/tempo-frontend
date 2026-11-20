import { ChevronUp, CircleDot, LogOut, Settings } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { TempoLogo } from "@/components/shared/tempo-logo"
import { appConfig } from "@/config/app"
import { navigation } from "@/config/navigation"

import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"

import type { User } from "@/lib/padel"

export function AppSidebar({ user, onLogout }: { user?: User; onLogout?: () => void }) {
    const navigate = useNavigate()
    const groups = user?.role === "referee" ? [
        { title: "Pertandingan", items: [{ title: "Court saya", href: "/admintempo", icon: CircleDot }] },
        ...navigation.filter(group => group.title === "System"),
    ] : navigation
    const location = useLocation()

    const isActive = (href: string) => {
        if (href === "/admintempo/dashboard" || href === "/admintempo") {
            return location.pathname.replace(/\/$/, "") === href
        }

        return (
            location.pathname === href ||
            location.pathname.startsWith(`${href}/`)
        )
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                            <SidebarMenuButton
                                render={<Link to={user?.role === "referee" ? "/admintempo" : "/admintempo/dashboard"} />}
                                size="lg"
                                className="h-auto min-h-12 py-2"
                                tooltip={appConfig.name}
                            >
                                <div className="flex min-w-0 flex-1 flex-col gap-1 group-data-[collapsible=icon]:items-center">
                                    <div className="flex h-7 w-28 max-w-full items-center group-data-[collapsible=icon]:size-8">
                                        <TempoLogo className="w-full" />
                                    </div>
                                </div>
                            </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {groups.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel>
                            {group.title}
                        </SidebarGroupLabel>

                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const Icon = item.icon
                                    const active = isActive(item.href)

                                    return (
                                        <SidebarMenuItem key={item.href}>
                                                <SidebarMenuButton
                                                    render={<Link to={item.href} />}
                                                    isActive={active}
                                                    tooltip={item.title}
                                                >
                                                    <Icon className="size-4" />

                                                    <span>
                                                        {item.title}
                                                    </span>
                                                </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="w-full" />}>
                                    <Avatar className="size-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg">
                                            {user?.name.slice(0, 2).toUpperCase() || "AD"}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {user?.name || "Administrator"}
                                        </span>

                                        <span className="truncate text-xs text-muted-foreground">
                                            {user?.email || ""}
                                        </span>
                                    </div>

                                    <ChevronUp className="ml-auto size-4" />
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                side="top"
                                align="end"
                                className="w-56"
                            >
                                <DropdownMenuLabel>
                                    My Account
                                </DropdownMenuLabel>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem onClick={() => navigate("/admintempo/account")}>
                                    <Settings className="size-4" />
                                    Pengaturan akun
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem onClick={onLogout}>
                                    <LogOut className="size-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}
