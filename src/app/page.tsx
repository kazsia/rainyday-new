"use client"

import * as React from "react"
import { ProximaLayout } from "@/components/layout/proxima-layout"
import ProximaHero from "@/components/ui/proxima-hero"

import { WhyChoose } from "@/components/layout/why-choose"
import { HowItWorks } from "@/components/layout/how-it-works"
import { FlickeringFooter } from "@/components/ui/flickering-footer"
import { FAQSection } from "@/components/layout/faq-section"
import { CTASection } from "@/components/ui/cta-section"
import { LandingBackground } from "@/components/layout/landing-background"
import { motion } from "framer-motion"
import { useSiteSettingsWithDefaults } from "@/context/site-settings-context"

export default function HomePage() {
  const { settings } = useSiteSettingsWithDefaults()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black" suppressHydrationWarning />
    )
  }

  return (
    <ProximaLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-black"
        suppressHydrationWarning
      >
        <div className="-mt-20 min-h-screen relative overflow-x-hidden" suppressHydrationWarning>
          <ProximaHero
            title={settings?.hero?.title}
            description={settings?.hero?.description}
            badgeText={settings?.hero?.badge_text}
            badgeLabel={settings?.hero?.badge_label}
            ctaButtons={[
              { text: settings?.hero?.cta1_text || "Get started", href: settings?.hero?.cta1_href || "/store", primary: true },
              { text: settings?.hero?.cta2_text || "View showcase", href: settings?.hero?.cta2_href || "/store" }
            ]}
            microDetails={settings?.hero?.micro_details}
          />
        </div>

        <div className="relative">
          <LandingBackground />
          <WhyChoose
            title={settings?.why_choose?.title}
            subtitle={settings?.why_choose?.subtitle}
            features={settings?.why_choose?.features}
          />
          <HowItWorks
            title={settings?.how_it_works?.title}
            texts={settings?.how_it_works?.texts}
            steps={settings?.how_it_works?.steps}
          />
          <FAQSection />
          <CTASection
            title={settings?.landing_cta?.title || "Ready to dive into digital products?"}
            description={settings?.landing_cta?.description || "Connect with our community today!"}
            buttonText={settings?.landing_cta?.button_text || "Get Started"}
            buttonHref={settings?.landing_cta?.button_href || "/store"}
          />
          <FlickeringFooter />
        </div>
      </motion.div>
    </ProximaLayout >
  )
}
