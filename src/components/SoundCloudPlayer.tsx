import { Pause, Play, Radio } from "lucide-react"
import { useEffect, useRef } from "react"
import { useAudioManager } from "../audio/AudioManagerProvider"
import type { AudioTrack } from "../audio/types"
import { useSoundCloud } from "../hooks/useSoundCloud"
import { buildSoundCloudEmbedUrl, getSoundCloudPlaybackUrl } from "../lib/soundcloud"
import { formatDuration } from "../lib/time"
import { TrackArtwork } from "./TrackArtwork"

type SoundCloudPlayerProps = {
  readonly initialTrack: AudioTrack
}

export function SoundCloudPlayer({ initialTrack }: SoundCloudPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const manager = useAudioManager()
  const { provider, state } = useSoundCloud(iframeRef, initialTrack)
  const currentTrack = state.currentTrack ?? initialTrack
  const initialPlaybackUrl = getSoundCloudPlaybackUrl(initialTrack)
  const embedUrl = buildSoundCloudEmbedUrl(initialPlaybackUrl ?? "", {
    auto_play: false,
    buying: false,
    sharing: false,
    download: false,
    show_artwork: true,
    show_playcount: false,
    show_user: true,
    single_active: true,
    ...(initialTrack.soundCloudPlaylistUrl === undefined || initialTrack.playlistIndex === undefined
      ? {}
      : { start_track: initialTrack.playlistIndex }),
  })

  useEffect(() => manager.register(provider), [manager, provider])

  const playCurrentTrack = () => {
    void manager.play({ provider: "soundcloud", track: currentTrack })
  }

  return (
    <section className="section-panel widget-section" aria-label="SoundCloud Widget Player">
      <div className="section-heading">
        <h2>Embedded listening.</h2>
        <p>Selected releases stay close to the room records.</p>
      </div>

      <div className="widget-console">
        <div className="widget-console__meta">
          <TrackArtwork track={currentTrack} size="medium" />
          <div>
            <p className="section-kicker">Widget API</p>
            <h3>{currentTrack.title}</h3>
            <p>{currentTrack.artist}</p>
            <span>
              {formatDuration(state.positionMs)} / {formatDuration(state.durationMs)}
            </span>
          </div>
        </div>

        <div className="widget-console__controls">
          <button
            className="icon-button icon-button--accent"
            type="button"
            onClick={playCurrentTrack}
            aria-label={`Play ${currentTrack.title} through SoundCloud`}
          >
            <Play size={18} fill="currentColor" />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => provider.pause()}
            aria-label="Pause SoundCloud widget"
          >
            <Pause size={18} />
          </button>
          <span className={`status-pill status-pill--${state.status}`}>{state.status}</span>
          <span className="widget-console__event">
            <Radio size={14} />
            {state.lastEvent}
          </span>
        </div>
      </div>

      <iframe
        ref={iframeRef}
        title="SoundCloud official embed player"
        className="soundcloud-frame"
        src={embedUrl}
        allow="autoplay; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </section>
  )
}
