import { useEffect, useRef, useState } from "react"
import { useAudioManager } from "../audio/AudioManagerProvider"
import type { AudioTrack } from "../audio/types"
import { introContent } from "../data/siteContent"
import { mountBreathingDot } from "../lib/breathing-dot"

type IntroOverlayProps = {
  readonly introTrack: AudioTrack | undefined
  readonly onComplete: () => void
}

type IntroPhase = "silent" | "restless" | "prompt" | "confirming"

export function IntroOverlay({ introTrack, onComplete }: IntroOverlayProps) {
  const manager = useAudioManager()
  const [phase, setPhase] = useState<IntroPhase>("silent")
  const timersRef = useRef<number[]>([])
  const dotContainerRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    document.documentElement.classList.add("is-intro-active")
    document.body.classList.add("is-intro-active")
    timersRef.current.push(
      window.setTimeout(() => setPhase("restless"), introContent.motionDelayMs),
      window.setTimeout(() => setPhase("prompt"), introContent.promptDelayMs),
    )

    return () => {
      for (const timer of timersRef.current) {
        window.clearTimeout(timer)
      }
      timersRef.current = []
      document.documentElement.classList.remove("is-intro-active")
      document.body.classList.remove("is-intro-active")
    }
  }, [])
  useEffect(() => {
    const container = dotContainerRef.current
    if (container === null) {
      return
    }

    const breathingDot = mountBreathingDot(container, {
      color: "#f5f5f5",
      ringColor1: "rgba(245,245,245,0.35)",
      ringColor2: "rgba(245,245,245,0.15)",
    })

    return breathingDot.destroy
  }, [])

  const startExperience = () => {
    if (phase === "confirming") {
      return
    }

    for (const timer of timersRef.current) {
      window.clearTimeout(timer)
    }
    timersRef.current = []
    setPhase("confirming")

    if (introTrack !== undefined) {
      void manager
        .play({ provider: introTrack.provider, track: introTrack })
        .catch((error: unknown) => {
          if (error instanceof Error) {
            return
          }

          throw error
        })
    }

    timersRef.current.push(window.setTimeout(onComplete, introContent.confirmationDelayMs))
  }

  return (
    <button
      className={`intro-overlay intro-overlay--${phase}`}
      type="button"
      onClick={startExperience}
      aria-label="Start listening experience"
    >
      <span className="intro-overlay__dot" ref={dotContainerRef} aria-hidden="true" />
      <span className="intro-overlay__prompt" aria-hidden="true">
        {introContent.prompt}
      </span>
      <span className="intro-overlay__headphones" aria-hidden="true">
        {introContent.confirmationLabel}
      </span>
    </button>
  )
}
