import type { AudioTrack } from "../audio/types"

export function TrackArtwork({
  track,
  size,
}: {
  readonly track: AudioTrack
  readonly size: "large" | "medium" | "small"
}) {
  return (
    <img
      className={`track-artwork track-artwork--${size}`}
      src={track.artworkUrl}
      alt={`${track.title} artwork`}
      width={size === "large" ? 320 : 96}
      height={size === "large" ? 320 : 96}
      loading="lazy"
    />
  )
}
