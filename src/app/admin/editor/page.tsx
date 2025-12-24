"use client"

import { redirect } from "next/navigation"

export default function EditorPage() {
    // Redirect to storefront with hero tab (first editor tab)
    redirect("/admin/storefront?tab=hero")
}
