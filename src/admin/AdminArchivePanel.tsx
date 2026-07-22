import { ImagePlus, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { AdminPanel, AdminSelectField, AdminTextareaField, AdminTextField } from "./AdminFields"
import { AdminImageUploadField } from "./AdminImageUploadField"
import { uploadAdminImageAsset } from "./adminBlobUpload"
import {
  createArchiveImageFromAsset,
  createBlankArchiveRelease,
  createBlankArchiveTrack,
} from "./adminFactories"
import { AdminImageUploadError } from "./adminImageUpload"
import { adminImageInputAccept } from "./adminImageUploadConfig"
import type {
  AdminArchiveImage,
  AdminArchiveRelease,
  AdminArchiveTrack,
  AdminContent,
} from "./adminTypes"
import { adminStatusOptions } from "./adminTypes"

const releaseTypeOptions = ["single", "ep", "album", "playlist"] as const
const visibilityOptions = ["public", "private-link"] as const

type ArchivePanelProps = {
  readonly content: AdminContent
  readonly onChange: (content: AdminContent) => void
}

function renumberReleases(
  releases: readonly AdminArchiveRelease[],
): readonly AdminArchiveRelease[] {
  return releases.map((release, sortOrder) => ({ ...release, sortOrder }))
}

function renumberTracks(tracks: readonly AdminArchiveTrack[]): readonly AdminArchiveTrack[] {
  return tracks.map((track, sortOrder) => ({ ...track, sortOrder }))
}

function renumberReleaseImages(images: readonly AdminArchiveImage[]): readonly AdminArchiveImage[] {
  return images.map((image, sortOrder) => ({ ...image, sortOrder }))
}

function parseOptionalInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export function AdminArchivePanel({ content, onChange }: ArchivePanelProps) {
  const [selectedReleaseId, setSelectedReleaseId] = useState(content.archiveReleases[0]?.id ?? "")
  const [detailImageNotice, setDetailImageNotice] = useState("")
  const release =
    content.archiveReleases.find((item) => item.id === selectedReleaseId) ??
    content.archiveReleases[0]

  const replaceReleases = (archiveReleases: readonly AdminArchiveRelease[]) => {
    onChange({ ...content, archiveReleases: renumberReleases(archiveReleases) })
  }
  const updateRelease = (patch: Partial<AdminArchiveRelease>) => {
    if (release === undefined) {
      return
    }
    replaceReleases(
      content.archiveReleases.map((item) =>
        item.id === release.id ? { ...item, ...patch } : item,
      ),
    )
  }
  const updateTrack = (trackId: string, patch: Partial<AdminArchiveTrack>) => {
    if (release === undefined) {
      return
    }
    updateRelease({
      tracks: release.tracks.map((track) =>
        track.id === trackId ? { ...track, ...patch } : track,
      ),
    })
  }
  const updateReleaseImage = (imageId: string, patch: Partial<AdminArchiveImage>) => {
    if (release === undefined) {
      return
    }

    updateRelease({
      images: release.images.map((image) =>
        image.id === imageId ? { ...image, ...patch } : image,
      ),
    })
  }
  const addReleaseImage = async (file: File | undefined) => {
    if (release === undefined || file === undefined) {
      return
    }

    setDetailImageNotice("")

    try {
      const uploaded = await uploadAdminImageAsset(file)
      updateRelease({
        images: [
          ...release.images,
          createArchiveImageFromAsset({
            ...uploaded,
            sortOrder: release.images.length,
          }),
        ],
      })
      setDetailImageNotice("Detail image added.")
    } catch (error: unknown) {
      setDetailImageNotice(
        error instanceof AdminImageUploadError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Image upload failed.",
      )
    }
  }
  const addRelease = () => {
    const nextRelease = createBlankArchiveRelease(content.archiveReleases.length)
    replaceReleases([...content.archiveReleases, nextRelease])
    setSelectedReleaseId(nextRelease.id)
    setDetailImageNotice("")
  }

  if (release === undefined) {
    return (
      <AdminPanel title="Archive" meta="0 releases">
        <button className="pill-button pill-button--accent" type="button" onClick={addRelease}>
          <Plus size={15} />
          Add release
        </button>
      </AdminPanel>
    )
  }

  return (
    <AdminPanel title="Archive & Sound" meta={`${content.archiveReleases.length} releases`}>
      <p className="admin-panel__intro">
        Edit the album jacket, card title, listening source, detail description, and track list used
        by the public Archive & Sound page.
      </p>
      <div className="admin-editor-grid">
        <div className="admin-list">
          {content.archiveReleases.map((item) => (
            <button
              className={item.id === release.id ? "admin-list-row is-active" : "admin-list-row"}
              key={item.id}
              type="button"
              onClick={() => setSelectedReleaseId(item.id)}
            >
              <strong>{item.title}</strong>
              <span>{`${item.type} / ${item.tracks.length} tracks / ${item.status}`}</span>
            </button>
          ))}
          <button className="pill-button pill-button--accent" type="button" onClick={addRelease}>
            <Plus size={15} />
            Add release
          </button>
        </div>

        <div className="admin-form-grid">
          <AdminTextField
            label="Release title"
            value={release.title}
            onChange={(title) => updateRelease({ title })}
          />
          <AdminTextField
            label="Artist"
            value={release.artist}
            onChange={(artist) => updateRelease({ artist })}
          />
          <AdminTextField
            label="Year"
            value={release.year}
            onChange={(year) => updateRelease({ year })}
          />
          <AdminImageUploadField
            label="Cover image"
            value={release.artworkUrl}
            alt={`${release.title} cover preview`}
            onUpload={({ src }) => updateRelease({ artworkUrl: src })}
          />
          <div className="admin-archive-preview">
            <img src={release.artworkUrl} alt={`${release.title} cover preview`} />
            <span>
              The cover appears on the album card and the album detail page. Use a square image for
              the cleanest result.
            </span>
          </div>
          <AdminSelectField
            label="Type"
            value={release.type}
            options={releaseTypeOptions}
            onChange={(type) => updateRelease({ type })}
          />
          <AdminSelectField
            label="Status"
            value={release.status}
            options={adminStatusOptions}
            onChange={(status) => updateRelease({ status })}
          />
          <AdminSelectField
            label="Visibility"
            value={release.visibility}
            options={visibilityOptions}
            onChange={(visibility) => updateRelease({ visibility })}
          />
          <AdminTextField
            label="Playlist URL"
            value={release.soundCloudPlaylistUrl}
            onChange={(soundCloudPlaylistUrl) => updateRelease({ soundCloudPlaylistUrl })}
          />
          <AdminTextareaField
            label="Description"
            value={release.description}
            onChange={(description) => updateRelease({ description })}
          />

          <div className="admin-subpanel admin-subpanel--wide">
            <div className="admin-subpanel__head">
              <h3>Detail images</h3>
              <span>{`${release.images.length} ${release.images.length === 1 ? "image" : "images"}`}</span>
            </div>
            <p className="admin-panel__intro">
              These photos appear below the track list on the album detail page.
            </p>
            <label className="admin-upload-dropzone" htmlFor={`detail-image-upload-${release.id}`}>
              <ImagePlus size={24} />
              <strong>Add detail image</strong>
              <span>Upload a JPEG, PNG, WebP, AVIF, or GIF image.</span>
              <input
                id={`detail-image-upload-${release.id}`}
                type="file"
                accept={adminImageInputAccept}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0]
                  event.currentTarget.value = ""
                  void addReleaseImage(file)
                }}
              />
            </label>
            {detailImageNotice ? <p className="admin-upload-notice">{detailImageNotice}</p> : null}
            {release.images.map((image) => (
              <div className="admin-image-row admin-image-row--detail" key={image.id}>
                <AdminImageUploadField
                  label="Image file"
                  value={image.src}
                  alt={image.alt}
                  onUpload={({ alt, height, src, width }) =>
                    updateReleaseImage(image.id, {
                      alt,
                      src,
                      width,
                      height,
                      aspectRatio: `${width} / ${height}`,
                    })
                  }
                />
                <AdminTextField
                  label="Alt text"
                  value={image.alt}
                  onChange={(alt) => updateReleaseImage(image.id, { alt })}
                />
                <AdminTextField
                  label="Object position"
                  value={image.objectPosition}
                  onChange={(objectPosition) => updateReleaseImage(image.id, { objectPosition })}
                />
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Remove ${image.alt}`}
                  onClick={() =>
                    updateRelease({
                      images: renumberReleaseImages(
                        release.images.filter((item) => item.id !== image.id),
                      ),
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="admin-subpanel admin-subpanel--wide">
            <div className="admin-subpanel__head">
              <h3>Tracks</h3>
              <button
                className="pill-button"
                type="button"
                onClick={() =>
                  updateRelease({
                    tracks: [...release.tracks, createBlankArchiveTrack(release.tracks.length)],
                  })
                }
              >
                <Plus size={15} />
                Add track
              </button>
            </div>
            {release.tracks.map((track) => (
              <div className="admin-track-row" key={track.id}>
                <AdminTextField
                  label="Title"
                  value={track.title}
                  onChange={(title) => updateTrack(track.id, { title })}
                />
                <AdminTextField
                  label="Artist"
                  value={track.artist}
                  onChange={(artist) => updateTrack(track.id, { artist })}
                />
                <AdminTextField
                  label="Track URL"
                  value={track.soundCloudUrl}
                  onChange={(soundCloudUrl) => updateTrack(track.id, { soundCloudUrl })}
                />
                <AdminImageUploadField
                  label="Track artwork"
                  value={track.artworkUrl}
                  alt={`${track.title} artwork preview`}
                  onUpload={({ src }) => updateTrack(track.id, { artworkUrl: src })}
                />
                <AdminTextField
                  label="Playlist index"
                  type="number"
                  value={track.playlistIndex?.toString() ?? ""}
                  onChange={(playlistIndex) =>
                    updateTrack(track.id, { playlistIndex: parseOptionalInteger(playlistIndex) })
                  }
                />
                <AdminTextField
                  label="Track number"
                  type="number"
                  value={track.trackNumber?.toString() ?? ""}
                  onChange={(trackNumber) =>
                    updateTrack(track.id, { trackNumber: parseOptionalInteger(trackNumber) })
                  }
                />
                <AdminTextareaField
                  label="Track description"
                  value={track.description}
                  onChange={(description) => updateTrack(track.id, { description })}
                />
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Remove ${track.title}`}
                  onClick={() =>
                    updateRelease({
                      tracks: renumberTracks(release.tracks.filter((item) => item.id !== track.id)),
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminPanel>
  )
}
