"use client"

import Link from "next/link"

export function Footer() {
    return (
        <footer className="w-full py-12 border-t border-white/5">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-xs text-white/30 font-medium">
                        © 2025 Rainyday Digital. All rights reserved.
                    </div>
                    <div className="flex gap-6 text-xs text-white/30 font-medium">
                        <Link href="/terms" className="hover:text-brand transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-brand transition-colors">Privacy</Link>
                        <Link href="/support" className="hover:text-brand transition-colors">Support</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
