"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { HelpCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getSiteSettings, type SiteSettings } from "@/lib/db/settings"

export default function FAQPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSiteSettings()
        setSettings(data)
      } catch (error) {
        console.error("Failed to load FAQ settings:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const faqs = settings?.faq?.items || []
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
            F.A.Q
          </h1>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            Everything you need to know about Rainyday products, payments, and security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 min-h-[400px]">
          {isLoading ? (
            <div className="col-span-full flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary/20" />
              <p className="text-white/20 font-medium uppercase tracking-widest text-xs">Loading answers...</p>
            </div>
          ) : faqs.length > 0 ? (
            faqs.map((faq, i) => (
              <div key={i} className="group flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:border-brand-primary/30 group-hover:bg-brand-primary/5 transition-all duration-300">
                  <HelpCircle className="w-6 h-6 text-white/20 group-hover:text-brand-primary transition-colors" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors duration-300 tracking-tight">
                    {faq.q}
                  </h4>
                  <p className="text-white/40 text-[15px] leading-relaxed font-medium">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center space-y-4 opacity-40">
              <HelpCircle className="w-12 h-12 text-white/10" />
              <p className="text-white/40 font-medium">No questions found.</p>
            </div>
          )}
        </div>

        <div className="mt-24 p-12 rounded-[2.5rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 text-center">
          <h3 className="text-2xl font-black text-white mb-4">Still have questions?</h3>
          <p className="text-white/40 mb-8 max-w-md mx-auto">
            Our support team is available 24/7 to help you with any inquiries you might have.
          </p>
          <Link
            href="/support"
            className="inline-flex items-center justify-center h-14 px-10 bg-brand-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl shadow-brand-primary/20"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}
