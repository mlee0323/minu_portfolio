import { Music2 } from "lucide-react"
import { AdminSelectField, AdminTextField } from "./AdminFields"
import type { AdminArchiveTrack, AdminWork } from "./adminTypes"

type WorkSettingsInspectorProps = {
  readonly archiveTracks: readonly AdminArchiveTrack[]
  readonly work: AdminWork
  readonly onSelectAudioTrack: (trackId: string) => void
  readonly onUpdateCanvasHeight: (height: number) => void
  readonly onUpdateWork: (patch: Partial<AdminWork>) => void
}

function parseCanvasHeight(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 520 ? parsed : fallback
}

function getSelectedTrackId(work: AdminWork, archiveTracks: readonly AdminArchiveTrack[]): string {
  return archiveTracks.some((track) => track.id === work.audio.id) ? work.audio.id : ""
}

function getTrackOptionLabel(trackId: string, archiveTracks: readonly AdminArchiveTrack[]): string {
  if (trackId === "") {
    return "Select archive track"
  }

  const track = archiveTracks.find((item) => item.id === trackId)
  return track === undefined ? trackId : `${track.title} - ${track.artist}`
}

export function AdminWorkSettingsInspector({
  archiveTracks,
  onSelectAudioTrack,
  onUpdateCanvasHeight,
  onUpdateWork,
  work,
}: WorkSettingsInspectorProps) {
  const selectedTrackId = getSelectedTrackId(work, archiveTracks)
  const archiveTrackOptions =
    selectedTrackId === ""
      ? ["", ...archiveTracks.map((track) => track.id)]
      : archiveTracks.map((track) => track.id)

  return (
    <aside className="admin-inspector">
      <div className="admin-inspector__head">
        <h3>Work</h3>
        <Music2 size={15} />
      </div>
      <p>Select an image or text block for element controls.</p>
      <section className="admin-inspector-section">
        <span>Canvas</span>
        <AdminTextField
          label="Responsive height"
          type="number"
          value={String(work.canvas.height)}
          onChange={(height) => onUpdateCanvasHeight(parseCanvasHeight(height, work.canvas.height))}
        />
      </section>
      <section className="admin-inspector-section">
        <span>Title</span>
        <AdminTextField
          label="Work title"
          value={work.title}
          onChange={(title) => onUpdateWork({ title })}
        />
      </section>
      <section className="admin-inspector-section">
        <span>Entry audio</span>
        {archiveTracks.length === 0 ? (
          <p>No archive tracks.</p>
        ) : (
          <AdminSelectField
            label="Archive track"
            value={selectedTrackId}
            options={archiveTrackOptions}
            getOptionLabel={(trackId) => getTrackOptionLabel(trackId, archiveTracks)}
            onChange={(trackId) => {
              if (trackId !== "") {
                onSelectAudioTrack(trackId)
              }
            }}
          />
        )}
      </section>
    </aside>
  )
}
