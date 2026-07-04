import { AudioWaveform } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useAudioManager } from "../audio/AudioManagerProvider"
import { localTracks } from "../data/localTracks"
import { introContent } from "../data/siteContent"

type IntroOverlayProps = {
  readonly onComplete: () => void
}

export function IntroOverlay({ onComplete }: IntroOverlayProps) {
  const manager = useAudioManager()
  const [isStarting, setIsStarting] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const introTrack = localTracks[0]

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const startExperience = () => {
    if (isStarting) {
      return
    }

    setIsStarting(true)

    if (introTrack !== undefined) {
      void manager.play({ provider: "local", track: introTrack }).catch((error: unknown) => {
        if (error instanceof Error) {
          return
        }

        throw error
      })
    }

    timeoutRef.current = window.setTimeout(onComplete, introContent.delayMs)
  }

  return (
    <button
      className={isStarting ? "intro-overlay is-exiting" : "intro-overlay"}
      type="button"
      onClick={startExperience}
      aria-label="Start listening experience"
    >
      <span className="intro-overlay__signal" aria-hidden="true">
        <AudioWaveform size={18} />
      </span>
      <span className="intro-overlay__prompt">{introContent.prompt}</span>
      <span className="intro-overlay__label">{introContent.label}</span>
    </button>
  )
}
