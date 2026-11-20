import { useState } from "react"
import type { ReactNode } from "react"
import { Outlet } from "react-router-dom"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { PageContainer } from "@/components/layout/page-container"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { User } from "@/lib/padel"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface AdminLayoutProps {
    children?: ReactNode
    user?: User
    onLogout?: () => void | Promise<void>
    headerAction?: ReactNode
}

export function AdminLayout({ children, user, onLogout, headerAction }: AdminLayoutProps) {
    const [confirmLogout, setConfirmLogout] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const referee = user?.role === "referee"
    function requestLogout() {
        if (loggingOut) return
        if (referee) setConfirmLogout(true)
        else void onLogout?.()
    }
    return (
        <SidebarProvider>
            <AppSidebar user={user} onLogout={requestLogout} />
            <SidebarInset>
                <AppHeader action={headerAction} onLogout={referee ? requestLogout : undefined} />
                <PageContainer>{children ?? <Outlet />}</PageContainer>
            </SidebarInset>
            <AlertDialog open={confirmLogout} onOpenChange={value => { if (!loggingOut) setConfirmLogout(value) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Yakin ingin logout?</AlertDialogTitle>
                        <AlertDialogDescription>Anda perlu login kembali untuk melanjutkan pencatatan skor.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loggingOut}>Batal</AlertDialogCancel>
                        <Button disabled={loggingOut} onClick={async () => {
                            if (loggingOut) return
                            setLoggingOut(true)
                            try { await onLogout?.(); setConfirmLogout(false) }
                            finally { setLoggingOut(false) }
                        }}>{loggingOut ? "Keluar…" : "Ya, logout"}</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SidebarProvider>
    )
}
