import { AdminCanvasImageElement } from "./AdminCanvasImageElement"
import { AdminCanvasTextElement } from "./AdminCanvasTextElement"
import type { SelectedCanvasElement } from "./AdminWorksEditorTypes"
import { getWorkCanvasDimensions } from "./adminCanvas"
import type {
  AdminCanvasViewport,
  AdminWork,
  AdminWorkImage,
  AdminWorkTextElement,
} from "./adminTypes"
import { useCanvasPreview } from "./useCanvasPreview"

type WorksCanvasProps = {
  readonly work: AdminWork
  readonly viewport: AdminCanvasViewport
  readonly selectedElement: SelectedCanvasElement | null
  readonly onSelectElement: (element: SelectedCanvasElement) => void
  readonly onUpdateImage: (imageId: string, patch: Partial<AdminWorkImage>) => void
  readonly onUpdateTextElement: (
    textElementId: string,
    patch: Partial<AdminWorkTextElement>,
  ) => void
}

function isSelected(
  selectedElement: SelectedCanvasElement | null,
  element: SelectedCanvasElement,
): boolean {
  return selectedElement?.kind === element.kind && selectedElement.id === element.id
}

export function AdminWorksCanvas({
  onSelectElement,
  onUpdateImage,
  onUpdateTextElement,
  selectedElement,
  viewport,
  work,
}: WorksCanvasProps) {
  const dimensions = getWorkCanvasDimensions(work, viewport)
  const { frameRef, width, scale: canvasScale, targetWidth } = useCanvasPreview(viewport, 720)

  return (
    <div className="admin-canvas-preview">
      <p className="admin-canvas-scale">
        {viewport === "mobile" ? "Mobile" : "Web"} · {targetWidth}px · Preview{" "}
        {Math.round((width / targetWidth) * 100)}% · Font sizes use a 390px canvas
      </p>
      <div className="admin-canvas-frame" ref={frameRef}>
        <div
          className="admin-canvas-stage"
          style={{
            width: dimensions.width * canvasScale,
            height: dimensions.height * canvasScale,
          }}
        >
          <div
            className={`admin-canvas admin-canvas--${viewport}`}
            style={{
              width,
              height: dimensions.height * canvasScale,
            }}
          >
            {work.images.map((image) => (
              <AdminCanvasImageElement
                canvasScale={canvasScale}
                dimensions={dimensions}
                image={image}
                key={image.id}
                selected={isSelected(selectedElement, { kind: "image", id: image.id })}
                viewport={viewport}
                onSelectElement={onSelectElement}
                onUpdateImage={onUpdateImage}
              />
            ))}

            {work.textElements.map((textElement) => (
              <AdminCanvasTextElement
                canvasScale={canvasScale}
                dimensions={dimensions}
                key={textElement.id}
                selected={isSelected(selectedElement, { kind: "text", id: textElement.id })}
                textElement={textElement}
                viewport={viewport}
                onSelectElement={onSelectElement}
                onUpdateTextElement={onUpdateTextElement}
              />
            ))}

            {work.images.length === 0 && work.textElements.length === 0 ? (
              <div className="admin-canvas-empty">
                <strong>No elements yet</strong>
                <span>Add an image or text block from the left panel.</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
