import { Headphones, Play } from "lucide-react"
import { useState } from "react"
import { useAudioManager, useAudioPlayback } from "../audio/AudioManagerProvider"
import { localTracks } from "../data/localTracks"

export function Hero() {
  const manager = useAudioManager()
  const playback = useAudioPlayback()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const heroTrack = localTracks[0]

  if (heroTrack === undefined) {
    return null
  }

  const isCurrent = playback.currentTrack?.id === heroTrack.id

  const playHeroTrack = () => {
    setErrorMessage(null)
    void manager.play({ provider: "local", track: heroTrack }).catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Could not start local audio")
    })
  }

  return (
    <section className="hero-section">
      <div className="hero-brand-card">
        <span className="hero-brand-card__menu">Menu</span>
        <span className="hero-brand-card__mark">minu</span>
      </div>

      <div className="hero-copy">
        <p className="section-kicker">Sound archive</p>
        <h1>
          Audio led.
          <br />
          Human focused.
        </h1>
        <p>
          Local works and SoundCloud archives share one audio interface. The Widget plays the
          archive, while the manager keeps every source in its lane.
        </p>
        <div className="hero-actions">
          <button className="pill-button pill-button--accent" type="button" onClick={playHeroTrack}>
            <Play size={18} fill="currentColor" />
            {isCurrent ? "Playing Local" : "Play Hero Audio"}
          </button>
          <a className="pill-button pill-button--ghost" href="#archive">
            <Headphones size={18} />
            Open Archive
          </a>
        </div>
        {errorMessage !== null ? <p className="inline-error">{errorMessage}</p> : null}
      </div>
    </section>
  )
}
