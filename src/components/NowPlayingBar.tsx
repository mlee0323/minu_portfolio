import { Pause, Play } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useAudioManager, useAudioPlayback } from "../audio/AudioManagerProvider"
import { formatDuration, progressPercent } from "../lib/time"
import { TrackArtwork } from "./TrackArtwork"

const shortcutIgnoredTagNames = ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"] as const

function shouldIgnoreSpaceShortcut(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    shortcutIgnoredTagNames.some((tagName) => target.tagName === tagName)
  )
}

export function NowPlayingBar() {
  const manager = useAudioManager()
  const playback = useAudioPlayback()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const track = playback.currentTrack
  const progress = progressPercent(playback.positionMs, playback.durationMs)
  const shouldPause = playback.status === "playing" || playback.status === "loading"
  const activeProvider = playback.provider ?? track?.provider ?? null
  const canToggle = track !== null && activeProvider !== null
  const meterMax = Math.max(playback.durationMs, 1)
  const meterValue = Math.min(playback.positionMs, meterMax)
  const sourceLabel = [track?.artist, track?.releaseTitle ?? playback.provider].filter(Boolean)
  const togglePlayback = useCallback(() => {
    if (track === null || activeProvider === null) {
      return
    }

    setErrorMessage(null)

    if (shouldPause) {
      manager.pauseActive()
      return
    }

    void manager.play({ provider: activeProvider, track }).catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Could not resume current audio")
    })
  }, [activeProvider, manager, shouldPause, track])

  useEffect(() => {
    if (!canToggle) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const isSpaceKey = event.code === "Space" || event.key === " "

      if (
        event.defaultPrevented ||
        event.repeat ||
        !isSpaceKey ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        shouldIgnoreSpaceShortcut(event.target)
      ) {
        return
      }

      event.preventDefault()
      togglePlayback()
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [canToggle, togglePlayback])

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
          <p>{sourceLabel.join(" · ")}</p>
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
          disabled={!canToggle}
          onClick={togglePlayback}
          aria-keyshortcuts="Space"
          aria-label={shouldPause ? "Pause active audio source" : "Play current audio source"}
        >
          {shouldPause ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
        </button>
      </div>
      {errorMessage !== null ? <p className="now-playing__error">{errorMessage}</p> : null}
    </aside>
  )
}
