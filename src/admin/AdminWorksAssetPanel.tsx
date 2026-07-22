import { ImagePlus, Plus, Trash2, Type } from "lucide-react"
import type { SelectedCanvasElement } from "./AdminWorksEditorTypes"
import { adminImageInputAccept } from "./adminImageUploadConfig"
import type { AdminWork, AdminWorkImage } from "./adminTypes"

type WorksAssetPanelProps = {
  readonly works: readonly AdminWork[]
  readonly selectedWork: AdminWork
  readonly selectedElement: SelectedCanvasElement | null
  readonly onAddBlankImage: () => void
  readonly onAddText: () => void
  readonly onAddWork: () => void
  readonly onDeleteImage: (imageId: string) => void
  readonly onDeleteWork: (workId: string) => void
  readonly onSelectElement: (element: SelectedCanvasElement) => void
  readonly onSelectWork: (workId: string) => void
  readonly onUploadImage: (file: File) => void
}

function isSelectedImage(
  selectedElement: SelectedCanvasElement | null,
  image: AdminWorkImage,
): boolean {
  return selectedElement?.kind === "image" && selectedElement.id === image.id
}

export function AdminWorksAssetPanel({
  onAddBlankImage,
  onAddText,
  onAddWork,
  onDeleteImage,
  onDeleteWork,
  onSelectElement,
  onSelectWork,
  onUploadImage,
  selectedElement,
  selectedWork,
  works,
}: WorksAssetPanelProps) {
  const uploadInputId = `work-image-upload-${selectedWork.id}`

  return (
    <aside className="admin-asset-panel">
      <section className="admin-asset-section">
        <div className="admin-asset-section__head">
          <span>Works</span>
          <button className="icon-button" type="button" aria-label="Add work" onClick={onAddWork}>
            <Plus size={15} />
          </button>
        </div>
        <div className="admin-list admin-list--compact">
          {works.map((work) => (
            <div
              className={
                work.id === selectedWork.id ? "admin-work-row is-active" : "admin-work-row"
              }
              key={work.id}
            >
              <button
                className="admin-work-row__select"
                type="button"
                onClick={() => onSelectWork(work.id)}
              >
                <strong>{work.title}</strong>
                <span>{`${work.year || "year"} / ${work.images.length} images`}</span>
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label={`Delete ${work.title}`}
                onClick={() => onDeleteWork(work.id)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-asset-section">
        <div className="admin-asset-section__head">
          <span>Assets</span>
          <button className="pill-button" type="button" onClick={onAddText}>
            <Type size={15} />
            Text
          </button>
        </div>
        <label className="admin-upload-dropzone" htmlFor={uploadInputId}>
          <ImagePlus size={24} />
          <strong>Upload image</strong>
          <span>Local preview in development, Blob storage after admin login.</span>
          <input
            id={uploadInputId}
            type="file"
            accept={adminImageInputAccept}
            onChange={(event) => {
              const file = event.currentTarget.files?.item(0)
              event.currentTarget.value = ""

              if (file !== null && file !== undefined) {
                onUploadImage(file)
              }
            }}
          />
        </label>
        <button className="pill-button pill-button--accent" type="button" onClick={onAddBlankImage}>
          <Plus size={15} />
          Add placeholder image
        </button>

        <div className="admin-asset-list">
          {selectedWork.images.map((image) => (
            <div
              className={
                isSelectedImage(selectedElement, image)
                  ? "admin-asset-thumb is-selected"
                  : "admin-asset-thumb"
              }
              key={image.id}
            >
              <button
                className="admin-asset-thumb__select"
                type="button"
                onClick={() => onSelectElement({ kind: "image", id: image.id })}
              >
                <img src={image.src} alt={image.alt} width={52} height={52} loading="lazy" />
                <span>{image.alt}</span>
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label={`Remove ${image.alt}`}
                onClick={() => onDeleteImage(image.id)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}
