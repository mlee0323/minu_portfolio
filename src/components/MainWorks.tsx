import { Play } from "lucide-react"
import { useState } from "react"
import { useAudioManager, useAudioPlayback } from "../audio/AudioManagerProvider"
import type { AudioTrack } from "../audio/types"
import { localTracks } from "../data/localTracks"
import { formatDuration } from "../lib/time"
import { TrackArtwork } from "./TrackArtwork"

export function MainWorks() {
  const manager = useAudioManager()
  const playback = useAudioPlayback()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const playTrack = (track: AudioTrack) => {
    setErrorMessage(null)
    void manager.play({ provider: "local", track }).catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Could not start local audio")
    })
  }

  return (
    <section className="section-panel" id="main-works">
      <div className="section-heading">
        <h2>Portfolio</h2>
        <p>Local works sit beside the streamed archive, all running through the same provider.</p>
      </div>
      <div className="work-grid">
        {localTracks.map((track) => {
          const isCurrent = playback.currentTrack?.id === track.id

          return (
            <article className={isCurrent ? "work-card is-current" : "work-card"} key={track.id}>
              <TrackArtwork track={track} size="small" />
              <div>
                <h3>{track.title}</h3>
                <p>{track.description}</p>
                <span>{formatDuration(track.durationMs ?? 0)}</span>
              </div>
              <button
                className="icon-button icon-button--accent"
                type="button"
                onClick={() => playTrack(track)}
                aria-label={`Play ${track.title}`}
              >
                <Play size={18} fill="currentColor" />
              </button>
            </article>
          )
        })}
      </div>
      {errorMessage !== null ? <p className="inline-error">{errorMessage}</p> : null}
    </section>
  )
}
