"use client"

import * as React from "react"
import { Star, Send, Loader2, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { submitFeedback } from "@/lib/db/feedbacks"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface FeedbackFormProps {
  invoiceId: string
  orderId?: string
  onSuccess?: () => void
}

export function FeedbackForm({ invoiceId, orderId, onSuccess }: FeedbackFormProps) {
  const [rating, setRating] = React.useState(0)
  const [hoverRating, setHoverRating] = React.useState(0)
  const [message, setMessage] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    setIsSubmitting(true)
    try {
      await submitFeedback({
        invoice_id: invoiceId,
        order_id: orderId,
        rating,
        message: message.trim() || undefined
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

  const getRatingText = () => {
    if (hoverRating || rating) {
      const texts = ["", "Poor", "Fair", "Good", "Great", "Excellent"]
      return texts[hoverRating || rating]
    }
    return "Tap to rate"
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {isSubmitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12 px-6 space-y-6"
          >
            {/* Success Illustration */}
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative w-32 h-32 mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#a4f8ff]/20 to-emerald-500/20 rounded-full blur-2xl" />
              <div className="relative w-full h-full bg-gradient-to-br from-[#a4f8ff]/10 to-[#5bc4d0]/10 rounded-full flex items-center justify-center border border-[#a4f8ff]/20">
                <Rocket className="w-14 h-14 text-[#a4f8ff]" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <h3 className="text-2xl font-bold text-white">Thank you!</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                By making your voice heard, you help us<br />
                improve our service.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="outline"
                className="px-6 py-2 rounded-full border-[#a4f8ff]/30 text-[#a4f8ff] hover:bg-[#a4f8ff]/10"
                onClick={() => setIsSubmitted(false)}
              >
                Submit Another
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-8 py-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-white">Give feedback</h3>
              <p className="text-sm text-white/40">How did we do?</p>
            </div>

            {/* Star Rating */}
            <div className="space-y-3">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform duration-200 hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={cn(
                        "w-10 h-10 transition-all duration-200",
                        star <= (hoverRating || rating)
                          ? "fill-[#a4f8ff] text-[#a4f8ff] drop-shadow-[0_0_8px_rgba(164,248,255,0.5)]"
                          : "text-white/20 hover:text-white/40"
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm font-medium text-[#a4f8ff]/70">
                {getRatingText()}
              </p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/40 ml-1">
                Care to share more about it? (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={4}
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#a4f8ff]/30 focus:ring-1 focus:ring-[#a4f8ff]/20 transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className={cn(
                "w-full h-12 rounded-full font-semibold text-sm uppercase tracking-wider transition-all",
                rating > 0
                  ? "bg-[#a4f8ff] hover:bg-[#8ae6ed] text-black"
                  : "bg-white/5 text-white/30 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Publish Feedback</span>
                  <Send className="w-4 h-4" />
                </div>
              )}
            </Button>

            {/* Footer Note */}
            <p className="text-center text-[10px] text-white/30">
              Your review helps other customers make informed decisions.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
