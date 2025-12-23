"use client"

import { ProximaLayout } from "@/components/layout/proxima-layout"
import NeuralNetworkHero from "@/components/ui/neural-network-hero"

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
        className="min-h-screen"
      >
        <div className="-mt-20">
          <NeuralNetworkHero
            title="Digital Products, Redefined."
            description="Experience the future of digital assets with our secure and intuitive platform. Built for the next generation of creators."
            ctaButtons={[
              { text: "Get Started", href: "/store", primary: true },
              { text: "View Products", href: "/store" }
            ]}
          />
        </div>

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
