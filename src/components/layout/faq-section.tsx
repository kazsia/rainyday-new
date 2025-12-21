"use client"

import { HelpCircle } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

const faqs = [
    {
        q: "Can I make payments using my preferred method?",
        a: "Yes, we support a wide range of payment methods, including popular fiat options like Credit Cards as well as various crypto currencies.",
    },
    {
        q: "Is it safe to make payments?",
        a: "Yes, we take security very seriously. We use advanced fraud prevention measures and do not store sensitive payment information.",
    },
    {
        q: "How do I make a purchase?",
        a: "Simply browse the available products, add them to your cart, and complete checkout with your preferred payment method.",
    },
    {
        q: "What is the return policy?",
        a: "Return policies vary by product. Review the policy for each product before purchasing to understand the terms.",
    },
]

export function FAQSection() {
    return (
        <section id="faq" className="py-16 md:py-24 bg-[#0a1628]">
            <div className="container mx-auto px-6 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-white/40 text-sm">
                        Explore the common questions and answers about Rainyday
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            className="flex gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div
                                className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
                            >
                                <HelpCircle className="w-5 h-5 text-white/40" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-2">{faq.q}</h4>
                                <p className="text-white/40 text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="text-center">
                    <p className="text-white/40 text-sm">
                        Didn't find the answer you are looking for?{" "}
                        <Link href="/support" className="text-brand hover:underline font-medium">
                            Contact our support
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    )
}
