"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps, toast as sonnerToast } from "sonner"


// Toast wrapper - sounds only on payment/delivery
export const toast = {
  success: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) => {
    return sonnerToast.success(message, options)
  },
  error: (message: string, options?: Parameters<typeof sonnerToast.error>[1]) => {
    return sonnerToast.error(message, options)
  },
  info: (message: string, options?: Parameters<typeof sonnerToast.info>[1]) => {
    return sonnerToast.info(message, options)
  },
  warning: (message: string, options?: Parameters<typeof sonnerToast.warning>[1]) => {
    return sonnerToast.warning(message, options)
  },
  // Special celebration sounds for payment and delivery
  payment: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) => {
    playCelebration('payment')
    return sonnerToast.success(message, {
      duration: 4000,
      icon: '💰',
      ...options
    })
  },
  delivery: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) => {
    playCelebration('delivery')
    return sonnerToast.success(message, {
      duration: 4000,
      icon: '🎉',
      ...options
    })
  },
  loading: sonnerToast.loading,
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
  message: sonnerToast.message,
}

// Special celebration sounds - soft musical arpeggios
function playCelebration(type: 'payment' | 'delivery') {
  if (typeof window === 'undefined') return

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return

    const ctx = new AudioContext()
    const masterGain = ctx.createGain()
    masterGain.connect(ctx.destination)
    masterGain.gain.value = 0.05

    // Soft, musical arpeggio patterns
    const patterns = {
      payment: [
        { freq: 523.25, delay: 0, duration: 0.18 },      // C5
        { freq: 659.25, delay: 0.12, duration: 0.18 },   // E5
        { freq: 783.99, delay: 0.24, duration: 0.18 },   // G5
        { freq: 1046.50, delay: 0.36, duration: 0.35 },  // C6 (resolve)
      ],
      delivery: [
        { freq: 659.25, delay: 0, duration: 0.15 },      // E5
        { freq: 783.99, delay: 0.1, duration: 0.15 },    // G5
        { freq: 987.77, delay: 0.2, duration: 0.15 },    // B5
        { freq: 1174.66, delay: 0.3, duration: 0.2 },    // D6
        { freq: 1318.51, delay: 0.42, duration: 0.4 },   // E6 (triumph)
      ],
    }

    const notes = patterns[type]

    notes.forEach((note, i) => {
      // Each note gets harmonics for richness
      [1, 2, 3].forEach((harmonic, h) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(masterGain)

        osc.frequency.value = note.freq * harmonic
        osc.type = 'sine'

        const harmonicAmp = [1, 0.3, 0.1][h]

        gain.gain.setValueAtTime(0, ctx.currentTime + note.delay)
        gain.gain.linearRampToValueAtTime(harmonicAmp, ctx.currentTime + note.delay + 0.01)
        gain.gain.setTargetAtTime(0, ctx.currentTime + note.delay + 0.03, note.duration / 2)

        osc.start(ctx.currentTime + note.delay)
        osc.stop(ctx.currentTime + note.delay + note.duration + 0.3)

        if (i === notes.length - 1 && h === 2) {
          osc.onended = () => ctx.close()
        }
      })
    })
  } catch (e) {
    // Ignore errors
  }
}


const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={800}
      gap={8}
      visibleToasts={4}
      closeButton={false}
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-400" />,
        info: <InfoIcon className="size-4 text-sky-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-400" />,
        error: <OctagonXIcon className="size-4 text-rose-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-[#a4f8ff]" />,
      }}
      toastOptions={{
        classNames: {
          toast: `
            group toast 
            !bg-[#0a0c14]/95 !backdrop-blur-xl 
            !border !border-white/10 
            !rounded-xl !shadow-2xl !shadow-black/50
            !px-4 !py-3
            data-[type=success]:!border-emerald-500/30 data-[type=success]:!shadow-emerald-500/10
            data-[type=error]:!border-rose-500/30 data-[type=error]:!shadow-rose-500/10
            data-[type=warning]:!border-amber-500/30 data-[type=warning]:!shadow-amber-500/10
            data-[type=info]:!border-sky-500/30 data-[type=info]:!shadow-sky-500/10
            animate-in slide-in-from-top-2 fade-in-0 zoom-in-95
          `,
          title: "!text-[13px] !font-bold !text-white",
          description: "!text-[11px] !text-white/60",
          actionButton: "!bg-[#a4f8ff] !text-black !font-bold !text-[10px] !uppercase !tracking-wider !rounded-lg",
          cancelButton: "!bg-white/10 !text-white/60 !font-bold !text-[10px] !uppercase !tracking-wider !rounded-lg",
          closeButton: "!bg-white/10 !border-white/10 !text-white/40 hover:!text-white hover:!bg-white/20",
          icon: "!mr-3",
        },
      }}
      style={
        {
          "--normal-bg": "rgba(10, 12, 20, 0.95)",
          "--normal-text": "#ffffff",
          "--normal-border": "rgba(255, 255, 255, 0.1)",
          "--border-radius": "12px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
