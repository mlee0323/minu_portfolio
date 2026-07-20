import { ArrowLeft, ArrowUpRight, Disc3, Play, Radio } from "lucide-react"
import { useState } from "react"
import { useAudioManager, useAudioPlayback } from "../audio/AudioManagerProvider"
import type { AudioRelease, AudioTrack } from "../audio/types"
import { ArchiveTrackRows } from "./Archive"
import { TrackArtwork } from "./TrackArtwork"

type ArchiveDetailProps = {
  readonly release: AudioRelease
}

const soundCloudProfileUrl = "https://soundcloud.com/syawla_nnuu"

export function ArchiveDetail({ release }: ArchiveDetailProps) {
  const manager = useAudioManager()
  const playback = useAudioPlayback()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const firstTrack = release.tracks[0]
  const isCurrentRelease =
    playback.currentTrack?.releaseId === release.id ||
    release.tracks.some((track) => playback.currentTrack?.id === track.id)

  const playTrack = (track: AudioTrack) => {
    setErrorMessage(null)
    void manager.play({ provider: "soundcloud", track }).catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Could not start SoundCloud track")
    })
  }

  return (
    <section className="archive-detail" id="archive-detail">
      <a className="archive-detail__back" href="/#archive">
        <ArrowLeft size={15} />
        Back to archive
      </a>

      <div className="archive-detail__hero">
        <div className="archive-detail__artwork">
          <TrackArtwork
            track={{
              id: `${release.id}-cover`,
              title: release.title,
              artist: release.artist,
              provider: release.provider,
              artworkUrl: release.artworkUrl,
            }}
            size="large"
          />
        </div>

        <div className="archive-detail__copy">
          <span className="release-card__eyebrow">
            <Disc3 size={13} />
            {[release.type, release.year, `${release.tracks.length} tracks`]
              .filter(Boolean)
              .join(" / ")}
          </span>
          <h1>{release.title}</h1>
          <p className="archive-detail__artist">{release.artist}</p>
          <p className="archive-detail__description">
            {release.description ?? "No release description yet."}
          </p>
          <div className="archive-detail__actions">
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
              {isCurrentRelease ? "Now playing" : "Play release"}
            </button>
            <a
              className="section-heading__link"
              href={release.soundCloudPlaylistUrl ?? soundCloudProfileUrl}
              rel="noreferrer noopener"
              target="_blank"
            >
              Open on SoundCloud
              <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </div>

      <div className="archive-detail__tracks">
        <div className="archive-detail__tracks-head">
          <h2>Track list</h2>
          <span>{`${release.tracks.length} tracks`}</span>
        </div>
        <ArchiveTrackRows
          tracks={release.tracks}
          currentTrack={playback.currentTrack}
          onPlayTrack={playTrack}
        />
      </div>

      {errorMessage !== null ? <p className="inline-error">{errorMessage}</p> : null}
    </section>
  )
}
