"use client"

import * as React from "react"
import { Star, MessageSquareQuote, Send, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { submitFeedback } from "@/lib/db/feedbacks"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface FeedbackFormProps {
  invoiceId: string
  orderId?: string
  onSuccess?: () => void
}

export function FeedbackForm({ invoiceId, orderId, onSuccess }: FeedbackFormProps) {
  const [rating, setRating] = React.useState(0)
  const [hoverRating, setHoverRating] = React.useState(0)
  const [title, setTitle] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }
    if (!message.trim()) {
      toast.error("Please enter your feedback message")
      return
    }

    setIsSubmitting(true)
    try {
      await submitFeedback({
        invoice_id: invoiceId,
        order_id: orderId,
        rating,
        title: title.trim() || undefined,
        message: message.trim()
      })
      setIsSubmitted(true)
      toast.success("Thank you for your feedback!")
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="bg-brand-primary/5 border-brand-primary/20 p-8 rounded-[2rem] text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto text-brand-primary">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tight">Feedback Submitted</h3>
        <p className="text-white/60 font-medium">Thank you for helping us improve!</p>
      </Card>
    )
  }

  return (
    <Card className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
      <div className="absolute -top-6 -right-6 p-8 text-white/[0.02] group-hover:text-white/[0.04] transition-colors duration-500">
        <MessageSquareQuote size={120} />
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
        <div className="space-y-4">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Rate your experience</h3>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-all duration-300 transform hover:scale-125"
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    star <= (hoverRating || rating)
                      ? "fill-brand-primary text-brand-primary"
                      : "text-white/10 hover:text-white/30"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-2">Headline (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Great experience! or Amazing delivery speed"
              className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-brand-primary/30 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-2">Your Thoughts</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your experience with the community..."
              required
              className="w-full min-h-[120px] bg-white/[0.02] border border-white/5 rounded-xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-brand-primary/30 transition-all font-medium resize-none"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full h-14 bg-brand-primary text-black font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-primary/10 flex items-center justify-center gap-3"
        >
          {isSubmitting ? "Submitting..." : (
            <>
              Submit Review
              <Send size={18} />
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}
