import { Play, Radio } from "lucide-react"
import { useState } from "react"
import { useAudioManager, useAudioPlayback } from "../audio/AudioManagerProvider"
import type { AudioTrack } from "../audio/types"
import { archiveTracks } from "../data/archiveTracks"
import { formatDuration } from "../lib/time"
import { TrackArtwork } from "./TrackArtwork"

export function Archive() {
  const manager = useAudioManager()
  const playback = useAudioPlayback()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const playTrack = (track: AudioTrack) => {
    setErrorMessage(null)
    void manager.play({ provider: "soundcloud", track }).catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Could not start SoundCloud track")
    })
  }

  return (
    <section className="section-panel archive-section" id="archive">
      <div className="section-heading">
        <h2>Archive</h2>
        <p>SoundCloud tracks are data-led. Edit the archive file and this list updates.</p>
      </div>

      <div className="archive-list">
        {archiveTracks.map((track) => {
          const isCurrent =
            playback.currentTrack?.id === track.id ||
            playback.currentTrack?.soundCloudUrl === track.soundCloudUrl

          return (
            <article
              className={isCurrent ? "archive-row is-current" : "archive-row"}
              key={track.id}
            >
              <TrackArtwork track={track} size="small" />
              <div className="archive-row__copy">
                <h3>{track.title}</h3>
                <p>{track.artist}</p>
              </div>
              <span className="archive-row__duration">{formatDuration(track.durationMs ?? 0)}</span>
              <button
                className="pill-button pill-button--neutral"
                type="button"
                onClick={() => playTrack(track)}
                aria-label={`Play ${track.title} with SoundCloud`}
              >
                {isCurrent ? <Radio size={16} /> : <Play size={16} fill="currentColor" />}
                {isCurrent ? "Current" : "Play"}
              </button>
            </article>
          )
        })}
      </div>
      {errorMessage !== null ? <p className="inline-error">{errorMessage}</p> : null}
    </section>
  )
}
