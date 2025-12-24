"use client"

import { redirect } from "next/navigation"

export default function ConfigurePage() {
    // Redirect to storefront with identity tab (first configure tab)
    redirect("/admin/storefront?tab=identity")
}
