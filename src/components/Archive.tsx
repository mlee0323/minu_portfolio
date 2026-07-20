import { ArrowUpRight, Disc3, ListMusic, Radio } from "lucide-react"
import { useState } from "react"
import { useAudioManager, useAudioPlayback } from "../audio/AudioManagerProvider"
import type { AudioRelease, AudioTrack } from "../audio/types"
import { formatDuration } from "../lib/time"
import { TrackArtwork } from "./TrackArtwork"

type ArchiveProps = {
  readonly releases: readonly AudioRelease[]
}

type ArchiveTrackRowsProps = {
  readonly tracks: readonly AudioTrack[]
  readonly currentTrack: AudioTrack | null
  readonly onPlayTrack: (track: AudioTrack) => void
}

const soundCloudProfileUrl = "https://soundcloud.com/syawla_nnuu"

function getReleaseCoverTrack(release: AudioRelease): AudioTrack {
  const firstTrack = release.tracks[0]
  const baseTrack = firstTrack ?? {
    id: `${release.id}-cover`,
    title: release.title,
    artist: release.artist,
    provider: release.provider,
    artworkUrl: release.artworkUrl,
  }

  return {
    ...baseTrack,
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

export function ArchiveTrackRows({ tracks, currentTrack, onPlayTrack }: ArchiveTrackRowsProps) {
  return (
    <div className="release-track-list">
      {tracks.map((track) => {
        const isCurrent = isCurrentTrack(currentTrack, track)

        return (
          <button
            className={isCurrent ? "release-track-row is-current" : "release-track-row"}
            key={track.id}
            type="button"
            onClick={() => onPlayTrack(track)}
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
  )
}

function trackCountLabel(release: AudioRelease): string {
  return release.tracks.length === 1
    ? "1 track"
    : `${String(release.tracks.length).padStart(2, "0")} tracks`
}

export function Archive({ releases }: ArchiveProps) {
  const manager = useAudioManager()
  const playback = useAudioPlayback()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const carouselClassName =
    releases.length <= 3 ? "release-carousel release-carousel--compact" : "release-carousel"

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
        <p>Album jackets, notes, and listening records from the sound archive.</p>
        <div className="section-heading__actions">
          <button
            className="archive-toggle"
            type="button"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            {isExpanded ? "Hide all" : "View all releases"}
          </button>
          <a
            className="section-heading__link"
            href={soundCloudProfileUrl}
            rel="noreferrer noopener"
            target="_blank"
          >
            Full archive
            <ArrowUpRight size={15} />
          </a>
        </div>
      </div>

      <ul className={carouselClassName} aria-label="Sound archive carousel">
        {releases.map((release) => {
          const coverTrack = getReleaseCoverTrack(release)
          const isCurrentRelease =
            playback.currentTrack?.releaseId === release.id ||
            release.tracks.some((track) => isCurrentTrack(playback.currentTrack, track))
          const releaseHref = `/archive/${encodeURIComponent(release.id)}`

          return (
            <li
              className={isCurrentRelease ? "release-card is-current" : "release-card"}
              key={release.id}
            >
              <a
                className="release-card__cover-link"
                href={releaseHref}
                aria-label={`Open ${release.title} album page`}
              >
                <TrackArtwork track={coverTrack} size="medium" />
                <span className="release-card__cover-scrim" aria-hidden="true" />
                <span className="release-card__cover-overlay">
                  <span className="release-card__eyebrow">
                    <Disc3 size={13} />
                    {[release.type, release.year, trackCountLabel(release)]
                      .filter(Boolean)
                      .join(" / ")}
                  </span>
                  <strong className="release-card__cover-title">{release.title}</strong>
                  <span className="release-card__cover-artist">{release.artist}</span>
                  <span className="release-card__cover-cta">
                    Open album
                    <ArrowUpRight size={16} />
                  </span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>

      {isExpanded ? (
        <section className="archive-all-tracks" aria-label="Full release track list">
          <div className="archive-all-tracks__head">
            <div>
              <span className="release-card__eyebrow">Archive index</span>
              <h3>All releases / all tracks</h3>
            </div>
            <span>{`${releases.length} releases`}</span>
          </div>
          {releases.map((release) => (
            <section className="archive-release-list" key={release.id}>
              <div className="archive-release-list__head">
                <div>
                  <span>{[release.type, release.year].filter(Boolean).join(" / ")}</span>
                  <h4>{release.title}</h4>
                </div>
                <a href={`/archive/${encodeURIComponent(release.id)}`}>Open album</a>
              </div>
              <ArchiveTrackRows
                tracks={release.tracks}
                currentTrack={playback.currentTrack}
                onPlayTrack={playTrack}
              />
            </section>
          ))}
        </section>
      ) : null}

      {errorMessage !== null ? <p className="inline-error">{errorMessage}</p> : null}
    </section>
  )
}
