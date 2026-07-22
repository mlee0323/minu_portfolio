import { Trash2 } from "lucide-react"
import { AdminCanvasRectFields } from "./AdminCanvasRectFields"
import { AdminSelectField, AdminTextareaField, AdminTextField } from "./AdminFields"
import { AdminImageUploadField } from "./AdminImageUploadField"
import { AdminWorkSettingsInspector } from "./AdminWorkSettingsInspector"
import type { SelectedCanvasElement } from "./AdminWorksEditorTypes"
import { getViewportRectForLayout, getWorkCanvasDimensions } from "./adminCanvas"
import type {
  AdminArchiveTrack,
  AdminCanvasViewport,
  AdminWork,
  AdminWorkImage,
  AdminWorkTextElement,
} from "./adminTypes"
import {
  imageAlignOptions,
  imageScaleOptions,
  textAlignOptions,
  textWeightOptions,
} from "./adminTypes"

type WorksInspectorProps = {
  readonly selectedElement: SelectedCanvasElement | null
  readonly viewport: AdminCanvasViewport
  readonly work: AdminWork
  readonly archiveTracks: readonly AdminArchiveTrack[]
  readonly onDeleteImage: (imageId: string) => void
  readonly onDeleteTextElement: (textElementId: string) => void
  readonly onSelectAudioTrack: (trackId: string) => void
  readonly onUpdateCanvasHeight: (height: number) => void
  readonly onUpdateImage: (imageId: string, patch: Partial<AdminWorkImage>) => void
  readonly onUpdateTextElement: (
    textElementId: string,
    patch: Partial<AdminWorkTextElement>,
  ) => void
  readonly onUpdateWork: (patch: Partial<AdminWork>) => void
}

function parseInteger(value: string, fallback: number, minimum: number): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback
}

function parseNumber(value: string, fallback: number, minimum: number): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback
}

function colorInputValue(color: string): string {
  return color.startsWith("#") ? color : "#f5f5f5"
}

function assertNever(value: never): never {
  throw new Error(`Unhandled selected canvas element: ${value}`)
}

export function AdminWorksInspector({
  archiveTracks,
  onDeleteImage,
  onDeleteTextElement,
  onSelectAudioTrack,
  onUpdateCanvasHeight,
  onUpdateImage,
  onUpdateTextElement,
  onUpdateWork,
  selectedElement,
  viewport,
  work,
}: WorksInspectorProps) {
  if (selectedElement === null) {
    return (
      <AdminWorkSettingsInspector
        archiveTracks={archiveTracks}
        work={work}
        onSelectAudioTrack={onSelectAudioTrack}
        onUpdateCanvasHeight={onUpdateCanvasHeight}
        onUpdateWork={onUpdateWork}
      />
    )
  }

  const dimensions = getWorkCanvasDimensions(work, viewport)

  switch (selectedElement.kind) {
    case "image": {
      const image = work.images.find((item) => item.id === selectedElement.id)

      if (image === undefined) {
        return null
      }

      const rect = getViewportRectForLayout(image.layout, viewport, dimensions)

      return (
        <aside className="admin-inspector">
          <div className="admin-inspector__head">
            <h3>Image</h3>
            <button
              className="icon-button"
              type="button"
              aria-label={`Remove ${image.alt}`}
              onClick={() => onDeleteImage(image.id)}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <AdminImageUploadField
            label="Image file"
            value={image.src}
            alt={image.alt}
            onUpload={({ height, src, width }) =>
              onUpdateImage(image.id, {
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
            onChange={(alt) => onUpdateImage(image.id, { alt })}
          />
          <AdminSelectField
            label="Scale"
            value={image.scale}
            options={imageScaleOptions}
            onChange={(scale) => onUpdateImage(image.id, { scale })}
          />
          <AdminSelectField
            label="Align"
            value={image.align}
            options={imageAlignOptions}
            onChange={(align) => onUpdateImage(image.id, { align })}
          />
          <AdminTextField
            label="Position"
            value={image.objectPosition}
            onChange={(objectPosition) => onUpdateImage(image.id, { objectPosition })}
          />
          <AdminCanvasRectFields
            dimensions={dimensions}
            rect={rect}
            viewport={viewport}
            onChange={(layout) => onUpdateImage(image.id, { layout })}
          />
        </aside>
      )
    }
    case "text": {
      const textElement = work.textElements.find((item) => item.id === selectedElement.id)

      if (textElement === undefined) {
        return null
      }

      const rect = getViewportRectForLayout(textElement.layout, viewport, dimensions)

      return (
        <aside className="admin-inspector">
          <div className="admin-inspector__head">
            <h3>Text</h3>
            <button
              className="icon-button"
              type="button"
              aria-label={`Remove ${textElement.text}`}
              onClick={() => onDeleteTextElement(textElement.id)}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <AdminTextareaField
            label="Text"
            value={textElement.text}
            onChange={(text) => onUpdateTextElement(textElement.id, { text })}
          />
          <AdminTextField
            label="Font size"
            type="number"
            value={String(textElement.fontSize)}
            onChange={(fontSize) =>
              onUpdateTextElement(textElement.id, {
                fontSize: parseInteger(fontSize, textElement.fontSize, 8),
              })
            }
          />
          <AdminSelectField
            label="Weight"
            value={textElement.fontWeight}
            options={textWeightOptions}
            onChange={(fontWeight) => onUpdateTextElement(textElement.id, { fontWeight })}
          />
          <AdminSelectField
            label="Align"
            value={textElement.textAlign}
            options={textAlignOptions}
            onChange={(textAlign) => onUpdateTextElement(textElement.id, { textAlign })}
          />
          <AdminTextField
            label="Line height"
            type="number"
            value={String(textElement.lineHeight)}
            onChange={(lineHeight) =>
              onUpdateTextElement(textElement.id, {
                lineHeight: parseNumber(lineHeight, textElement.lineHeight, 0.75),
              })
            }
          />
          <AdminTextField
            label="Color"
            type="color"
            value={colorInputValue(textElement.color)}
            onChange={(color) => onUpdateTextElement(textElement.id, { color })}
          />
          <AdminCanvasRectFields
            dimensions={dimensions}
            rect={rect}
            viewport={viewport}
            onChange={(layout) => onUpdateTextElement(textElement.id, { layout })}
          />
        </aside>
      )
    }
    default:
      return assertNever(selectedElement)
  }
}
