/* eslint-disable react-hooks/set-state-in-effect */
import { LogOut, Monitor, Moon, Sun } from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb"


import { SidebarTrigger } from "@/components/ui/sidebar"

export function AppHeader({ action, onLogout }: { action?: ReactNode; onLogout?: () => void }) {
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme")

        const dark =
            savedTheme === "dark" ||
            (!savedTheme &&
                window.matchMedia("(prefers-color-scheme: dark)").matches)

        setIsDark(dark)

        document.documentElement.classList.toggle("dark", dark)
    }, [])

    const toggleTheme = () => {
        const next = !isDark

        setIsDark(next)

        document.documentElement.classList.toggle("dark", next)

        localStorage.setItem(
            "theme",
            next ? "dark" : "light"
        )
    }

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
            <SidebarTrigger className="-ml-1" />

            <AppBreadcrumb />

            <div className="ml-auto flex items-center gap-1">
                <div className="hidden sm:block">{action}</div>
                {onLogout ? <Button variant="ghost" size="icon" aria-label="Logout" title="Logout" onClick={onLogout}>
                    <LogOut className="size-4" />
                </Button> : <Button variant="ghost" size="icon" aria-label="Buka layar TV" render={<a href="/" target="_blank" rel="noreferrer" />}>
                    <Monitor className="size-4" />
                </Button>}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    {isDark ? (
                        <Sun className="size-4" />
                    ) : (
                        <Moon className="size-4" />
                    )}
                </Button>
            </div>
        </header>
    )
}
