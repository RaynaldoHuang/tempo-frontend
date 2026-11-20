import { Link, useLocation } from "react-router-dom"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const labels: Record<string, string> = {
    admintempo: "Admin Tempo",
    dashboard: "Dashboard",
    venues: "Venue",
    progression: "Klasemen & knockout",
    competitions: "Turnamen & tier",
    "master-data": "Master Data",
    tournaments: "Turnamen",
    tiers: "Tier & grup",
    courts: "Court",
    assignments: "Penugasan wasit",
    "wasit-preview": "Pratinjau wasit",
    matches: "Jadwal & hasil",
    referees: "Wasit",
    presets: "Preset skor",
    account: "Pengaturan akun",
    customers: "Customers",
    products: "Products",
    orders: "Orders",
    settings: "Settings",
    create: "Create",
    edit: "Edit",
}

function formatLabel(segment: string) {
    if (labels[segment]) {
        return labels[segment]
    }

    if (/^\d+$/.test(segment)) {
        return "Detail"
    }

    return segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function AppBreadcrumb() {
    const location = useLocation()

    const segments = location.pathname
        .split("/")
        .filter(Boolean)

    if (segments.length === 0) {
        return null
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {segments.map((segment, index) => {
                    const isLast =
                        index === segments.length - 1

                    const href = `/${segments
                        .slice(0, index + 1)
                        .join("/")}`

                    const label = formatLabel(segment)

                    return (
                        <div
                            key={href}
                            className="contents"
                        >
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="block max-w-44 truncate sm:max-w-none">
                                        {label}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink>
                                        <Link to={href}>
                                            {label}
                                        </Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>

                            {!isLast && (
                                <BreadcrumbSeparator />
                            )}
                        </div>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}