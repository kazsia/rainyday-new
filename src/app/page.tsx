"use client"

import { ProximaLayout } from "@/components/layout/proxima-layout"
import { BackgroundPaths } from "@/components/ui/background-paths"

import { WhyChoose } from "@/components/layout/why-choose"
import { HowItWorks } from "@/components/layout/how-it-works"
import { CTASection } from "@/components/ui/cta-with-rectangle"
import { FlickeringFooter } from "@/components/ui/flickering-footer"
import { FAQSection } from "@/components/layout/faq-section"
import { motion } from "framer-motion"

export default function HomePage() {
  return (
    <ProximaLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-[#0a1628]"
      >
        <BackgroundPaths title="Digital Products, Redefined." />

        <WhyChoose />
        <HowItWorks />
        <FAQSection />
        <CTASection
          badge={{
            text: "Ready to start?"
          }}
          title="Join Rainyday Today"
          description="Experience the future of digital assets with our secure and intuitive platform."
          action={{
            text: "Get Started",
            href: "/store",
            variant: "glow"
          }}
        />
        <FlickeringFooter />
      </motion.div>
    </ProximaLayout>
  )
}
