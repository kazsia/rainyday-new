import { requireAdmin } from "@/lib/security/auth"

/**
 * Server-side admin layout that validates admin role.
 * This is the SECOND line of defense after middleware.
 * Defense in depth: even if middleware is bypassed, this will catch it.
 * 
 * Note: Individual pages still use <AdminLayout> for the UI chrome.
 * This layout only handles auth verification.
 */
export const dynamic = "force-dynamic"

export default async function AdminRouteLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // This will redirect to /auth or / if not admin
    await requireAdmin()

    // Just pass through children - pages handle their own layout UI
    return <>{children}</>
}
