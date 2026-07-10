import { useEffect, useRef } from "react"
import { useAudioManager } from "../audio/AudioManagerProvider"
import type { AudioTrack } from "../audio/types"
import { useSoundCloud } from "../hooks/useSoundCloud"
import { buildSoundCloudEmbedUrl, getSoundCloudPlaybackUrl } from "../lib/soundcloud"

type SoundCloudPlayerProps = {
  readonly initialTrack: AudioTrack
}

export function SoundCloudPlayer({ initialTrack }: SoundCloudPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const manager = useAudioManager()
  const { provider } = useSoundCloud(iframeRef, initialTrack)
  const initialPlaybackUrl = getSoundCloudPlaybackUrl(initialTrack)
  const embedUrl = buildSoundCloudEmbedUrl(initialPlaybackUrl ?? "", {
    auto_play: false,
    buying: false,
    sharing: false,
    download: false,
    show_artwork: false,
    show_playcount: false,
    show_user: false,
    single_active: true,
    ...(initialTrack.soundCloudPlaylistUrl === undefined || initialTrack.playlistIndex === undefined
      ? {}
      : { start_track: initialTrack.playlistIndex }),
  })

  useEffect(() => manager.register(provider), [manager, provider])

  return (
    <iframe
      ref={iframeRef}
      title="SoundCloud playback transport"
      className="soundcloud-transport-frame"
      src={embedUrl}
      allow="autoplay; encrypted-media"
      aria-hidden="true"
      tabIndex={-1}
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    />
  )
}
