import { ArrowUpRight, Disc3, ListMusic, Play, Radio } from "lucide-react"
import { useState } from "react"
import { useAudioManager, useAudioPlayback } from "../audio/AudioManagerProvider"
import type { AudioRelease, AudioTrack } from "../audio/types"
import { archiveReleases } from "../data/archiveTracks"
import { formatDuration } from "../lib/time"
import { TrackArtwork } from "./TrackArtwork"

function getReleaseCoverTrack(release: AudioRelease): AudioTrack {
  const firstTrack = release.tracks[0]

  if (firstTrack !== undefined) {
    return firstTrack
  }

  return {
    id: `${release.id}-cover`,
    title: release.title,
    artist: release.artist,
    provider: release.provider,
    artworkUrl: release.artworkUrl,
    releaseId: release.id,
    releaseTitle: release.title,
    ...(release.visibility === undefined ? {} : { visibility: release.visibility }),
  }
}

function isCurrentTrack(currentTrack: AudioTrack | null, track: AudioTrack): boolean {
  return (
    currentTrack?.id === track.id ||
    (track.soundCloudUrl !== undefined && currentTrack?.soundCloudUrl === track.soundCloudUrl)
  )
}

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
        <h2>Archive & Sound</h2>
        <p>Swipe to explore releases, playlists, and external listening records.</p>
        <a
          className="section-heading__link"
          href="https://soundcloud.com/forss"
          rel="noreferrer"
          target="_blank"
        >
          Full archive
          <ArrowUpRight size={15} />
        </a>
      </div>

      <ul className="release-carousel" aria-label="Sound archive carousel">
        {archiveReleases.map((release) => {
          const firstTrack = release.tracks[0]
          const coverTrack = getReleaseCoverTrack(release)
          const isCurrentRelease =
            playback.currentTrack?.releaseId === release.id ||
            release.tracks.some((track) => isCurrentTrack(playback.currentTrack, track))
          const trackCountLabel =
            release.tracks.length === 1
              ? "1 track"
              : `${String(release.tracks.length).padStart(2, "0")} tracks`

          return (
            <li
              className={isCurrentRelease ? "release-card is-current" : "release-card"}
              key={release.id}
            >
              <div className="release-card__cover">
                <TrackArtwork track={coverTrack} size="medium" />
              </div>

              <div className="release-card__head">
                <div>
                  <span className="release-card__eyebrow">
                    <Disc3 size={13} />
                    {[release.type, release.year, trackCountLabel].filter(Boolean).join(" / ")}
                  </span>
                  <h3>{release.title}</h3>
                  <p>{release.artist}</p>
                </div>

                <button
                  className="pill-button pill-button--neutral"
                  type="button"
                  disabled={firstTrack === undefined}
                  onClick={() => {
                    if (firstTrack !== undefined) {
                      playTrack(firstTrack)
                    }
                  }}
                  aria-label={`Play ${release.title} release with SoundCloud`}
                >
                  {isCurrentRelease ? <Radio size={16} /> : <Play size={16} fill="currentColor" />}
                  {isCurrentRelease ? "Current" : "Play Release"}
                </button>
              </div>

              <div className="release-track-list">
                {release.tracks.map((track) => {
                  const isCurrent = isCurrentTrack(playback.currentTrack, track)

                  return (
                    <button
                      className={isCurrent ? "release-track-row is-current" : "release-track-row"}
                      key={track.id}
                      type="button"
                      onClick={() => playTrack(track)}
                      aria-label={`Play ${track.title} with SoundCloud`}
                    >
                      <span className="release-track-row__number">
                        {track.trackNumber?.toString().padStart(2, "0") ?? "--"}
                      </span>
                      <span className="release-track-row__copy">
                        <strong>{track.title}</strong>
                        <span>{track.artist}</span>
                      </span>
                      <span className="release-track-row__duration">
                        {formatDuration(track.durationMs ?? 0)}
                      </span>
                      <span className="release-track-row__icon">
                        {isCurrent ? <Radio size={15} /> : <ListMusic size={15} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>
      {errorMessage !== null ? <p className="inline-error">{errorMessage}</p> : null}
    </section>
  )
}
