"use client"

import * as React from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, MessageSquareQuote } from "lucide-react"

import { submitFeedback } from "@/lib/db/feedbacks"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function FeedbackPage() {
    const [rating, setRating] = React.useState(0)
    const [hoverRating, setHoverRating] = React.useState(0)
    const [content, setContent] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const router = useRouter()

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Please select a rating")
            return
        }
        if (!content.trim()) {
            toast.error("Please enter your feedback")
            return
        }

        setIsSubmitting(true)
        try {
            await submitFeedback({
                rating,
                content
            })
            toast.success("Feedback submitted! Thank you for your review.")
            router.push("/")
        } catch (error) {
            toast.error("Failed to submit feedback. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter uppercase">
                        Feedback
                    </h1>
                    <p className="text-white/40 text-lg max-w-xl mx-auto">
                        Your voice matters. Help us refine Rainyday and build the future of digital commerce.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    <Card className="bg-[#0a1628] border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <MessageSquareQuote size={120} />
                        </div>

                        <div className="relative z-10 space-y-10">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-white italic tracking-tight">Rate your experience</h3>
                                <div className="flex gap-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="transition-all duration-300 transform hover:scale-125"
                                        >
                                            <Star
                                                className={`w-10 h-10 ${star <= (hoverRating || rating)
                                                    ? "fill-brand-primary text-brand-primary"
                                                    : "text-white/10 hover:text-white/30"
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-white italic tracking-tight">Tell us more</h3>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="What's on your mind? We want to hear your thoughts, suggestions, or just a simple hello."
                                    className="w-full min-h-[200px] bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 text-white placeholder:text-white/10 focus:outline-none focus:border-brand-primary/30 transition-all text-lg font-medium"
                                />
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="h-16 px-12 bg-brand-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl shadow-brand-primary/20"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Feedback"}
                            </Button>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                            <div className="flex gap-1 text-brand-primary">
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                            </div>
                            <p className="text-white/60 italic font-medium">
                                "Rainyday is hands down the best platform for digital goods. The UI is insane and the delivery is instant."
                            </p>
                            <p className="text-white/20 text-xs font-black uppercase tracking-widest">— Alex M., Developer</p>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                            <div className="flex gap-1 text-brand-primary">
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                            </div>
                            <p className="text-white/60 italic font-medium">
                                "The customer support team resolved my issue in under 5 minutes. Amazing service quality!"
                            </p>
                            <p className="text-white/20 text-xs font-black uppercase tracking-widest">— Sarah K., Designer</p>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
