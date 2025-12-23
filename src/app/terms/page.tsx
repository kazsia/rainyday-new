"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { useSiteSettingsWithDefaults } from "@/context/site-settings-context"

export default function TermsPage() {
    const { settings } = useSiteSettingsWithDefaults()

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-24 max-w-3xl">
                <h1 className="text-4xl font-black mb-12">Terms of Service</h1>
                <div className="prose prose-invert max-w-none text-muted-foreground space-y-8 whitespace-pre-wrap">
                    {settings.legal.terms_of_service || (
                        <>
                            <section>
                                <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
                                <p>By accessing and using Rainyday, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
                            </section>
                            <section>
                                <h2 className="text-2xl font-bold text-foreground mb-4">2. Digital Products</h2>
                                <p>All products sold on Rainyday are digital. Once a product key is revealed or a file is downloaded, the sale is final and non-refundable.</p>
                            </section>
                            <section>
                                <h2 className="text-2xl font-bold text-foreground mb-4">3. License</h2>
                                <p>Purchasing a product grants you a non-exclusive, non-transferable license for personal or internal business use only.</p>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </MainLayout>
    )
}
