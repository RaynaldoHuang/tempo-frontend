import type { ReactNode } from "react"

interface PageContainerProps {
    children: ReactNode
}

export function PageContainer({
    children,
}: PageContainerProps) {
    return (
        <main className="flex min-w-0 flex-1 flex-col">
            <div className="mx-auto w-full max-w-[1600px] flex-1 p-4 md:p-6 lg:px-8 lg:py-8">
                {children}
            </div>
        </main>
    )
}