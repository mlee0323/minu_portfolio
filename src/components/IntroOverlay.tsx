import { useEffect, useRef, useState } from "react"
import { useAudioManager } from "../audio/AudioManagerProvider"
import { localTracks } from "../data/localTracks"
import { introContent } from "../data/siteContent"

type IntroOverlayProps = {
  readonly onComplete: () => void
}

type IntroPhase = "silent" | "restless" | "prompt" | "confirming"

export function IntroOverlay({ onComplete }: IntroOverlayProps) {
  const manager = useAudioManager()
  const [phase, setPhase] = useState<IntroPhase>("silent")
  const timersRef = useRef<number[]>([])
  const introTrack = localTracks[0]

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
      void manager.play({ provider: "local", track: introTrack }).catch((error: unknown) => {
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
      <span className="intro-overlay__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="intro-overlay__prompt" aria-hidden="true">
        {introContent.prompt}
      </span>
      <span className="intro-overlay__headphones" aria-hidden="true">
        {introContent.confirmationLabel}
      </span>
    </button>
  )
}
