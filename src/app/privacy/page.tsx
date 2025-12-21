import { MainLayout } from "@/components/layout/main-layout"

export default function PrivacyPage() {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-24 max-w-3xl">
                <h1 className="text-4xl font-black mb-12">Privacy Policy</h1>
                <div className="prose prose-invert max-w-none text-muted-foreground space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">1. Information Collection</h2>
                        <p>We collect minimal information necessary to process your orders, including your email address and payment details provided by our payment processors.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">2. Data Usage</h2>
                        <p>Your data is used solely for order fulfillment, support, and occasional service updates if you opt-in.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4">3. Security</h2>
                        <p>We implement industry-standard security measures to protect your information and ensure secure transactions.</p>
                    </section>
                </div>
            </div>
        </MainLayout>
    )
}
