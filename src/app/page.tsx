"use client"

import { ProximaLayout } from "@/components/layout/proxima-layout"
import NeuralNetworkHero from "@/components/ui/neural-network-hero"

import { WhyChoose } from "@/components/layout/why-choose"
import { HowItWorks } from "@/components/layout/how-it-works"
import { FlickeringFooter } from "@/components/ui/flickering-footer"
import { FAQSection } from "@/components/layout/faq-section"
import { CTASection } from "@/components/ui/cta-section"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { getSiteSettings, type SiteSettings } from "@/lib/db/settings"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSiteSettings()
        setSettings(data)
      } catch (error) {
        console.error("Failed to load settings:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand/20" />
      </div>
    )
  }

  return (
    <ProximaLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen"
      >
        <div className="-mt-20">
          <NeuralNetworkHero
            title={settings?.hero?.title || "Digital Products, Redefined."}
            description={settings?.hero?.description || "Experience the future of digital assets."}
            badgeText={settings?.hero?.badge_text}
            badgeLabel={settings?.hero?.badge_label}
            ctaButtons={[
              { text: settings?.hero?.cta1_text || "Get Started", href: settings?.hero?.cta1_href || "/store", primary: true },
              { text: settings?.hero?.cta2_text || "View Products", href: settings?.hero?.cta2_href || "/store" }
            ]}
          />
        </div>

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
      </motion.div>
    </ProximaLayout>
  )
}
