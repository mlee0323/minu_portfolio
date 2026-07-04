import { Pause } from "lucide-react"
import { useAudioManager, useAudioPlayback } from "../audio/AudioManagerProvider"
import { formatDuration, progressPercent } from "../lib/time"
import { TrackArtwork } from "./TrackArtwork"

export function NowPlayingBar() {
  const manager = useAudioManager()
  const playback = useAudioPlayback()
  const track = playback.currentTrack
  const progress = progressPercent(playback.positionMs, playback.durationMs)
  const canPause = playback.status === "playing" || playback.status === "loading"
  const meterMax = Math.max(playback.durationMs, 1)
  const meterValue = Math.min(playback.positionMs, meterMax)

  if (track === null) {
    return null
  }

  return (
    <aside className="now-playing" aria-live="polite">
      <div className="now-playing__identity">
        <TrackArtwork track={track} size="small" />
        <div>
          <p className="now-playing__label">Now Playing</p>
          <h2>{track.title}</h2>
          <p>{`${track.artist} · ${playback.provider}`}</p>
        </div>
      </div>

      <div className="now-playing__meter">
        <meter
          className="visually-hidden"
          min={0}
          max={meterMax}
          value={meterValue}
          aria-label="Playback progress"
        />
        <div className="now-playing__time">
          <span>{formatDuration(playback.positionMs)}</span>
          <span>{formatDuration(playback.durationMs)}</span>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="now-playing__state">
        <span className={`status-pill status-pill--${playback.status}`}>{playback.status}</span>
        <button
          className="icon-button"
          type="button"
          disabled={!canPause}
          onClick={manager.pauseActive}
          aria-label="Pause active audio source"
        >
          <Pause size={18} />
        </button>
      </div>
    </aside>
  )
}
