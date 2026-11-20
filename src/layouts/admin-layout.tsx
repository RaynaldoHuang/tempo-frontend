import type { ReactNode } from "react"
import { Outlet } from "react-router-dom"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { PageContainer } from "@/components/layout/page-container"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { User } from "@/lib/padel"

interface AdminLayoutProps {
    children?: ReactNode
    user?: User
    onLogout?: () => void
    headerAction?: ReactNode
}

export function AdminLayout({ children, user, onLogout, headerAction }: AdminLayoutProps) {
    return (
        <SidebarProvider>
            <AppSidebar user={user} onLogout={onLogout} />
            <SidebarInset>
                <AppHeader action={headerAction} />
                <PageContainer>{children ?? <Outlet />}</PageContainer>
            </SidebarInset>
        </SidebarProvider>
    )
}
