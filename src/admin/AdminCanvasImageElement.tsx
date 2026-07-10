import type { KeyboardEvent } from "react"
import { Rnd } from "react-rnd"
import type { SelectedCanvasElement } from "./AdminWorksEditorTypes"
import { getViewportRectForLayout, updateCanvasLayout } from "./adminCanvas"
import type { AdminCanvasViewport, AdminWorkImage } from "./adminTypes"

type CanvasDimensions = {
  readonly width: number
  readonly height: number
}

type CanvasImageElementProps = {
  readonly canvasScale: number
  readonly dimensions: CanvasDimensions
  readonly image: AdminWorkImage
  readonly selected: boolean
  readonly viewport: AdminCanvasViewport
  readonly onSelectElement: (element: SelectedCanvasElement) => void
  readonly onUpdateImage: (imageId: string, patch: Partial<AdminWorkImage>) => void
}

function handleSelectableKey(
  event: KeyboardEvent,
  element: SelectedCanvasElement,
  onSelectElement: (element: SelectedCanvasElement) => void,
): void {
  if (event.key !== "Enter" && event.key !== " ") {
    return
  }

  event.preventDefault()
  onSelectElement(element)
}

export function AdminCanvasImageElement({
  canvasScale,
  dimensions,
  image,
  onSelectElement,
  onUpdateImage,
  selected,
  viewport,
}: CanvasImageElementProps) {
  const element = { kind: "image", id: image.id } as const
  const rect = getViewportRectForLayout(image.layout, viewport, dimensions)

  return (
    <Rnd
      bounds="parent"
      className={selected ? "admin-canvas-element is-selected" : "admin-canvas-element"}
      lockAspectRatio={true}
      position={{ x: rect.x, y: rect.y }}
      scale={canvasScale}
      size={{ width: rect.width, height: rect.height }}
      onDragStop={(event, data) => {
        event.stopPropagation()
        onUpdateImage(image.id, {
          layout: updateCanvasLayout(
            viewport,
            {
              ...rect,
              x: data.x,
              y: data.y,
            },
            dimensions,
          ),
        })
      }}
      onMouseDown={() => onSelectElement(element)}
      onResizeStop={(event, direction, ref, delta, position) => {
        event.stopPropagation()
        void direction
        void delta
        onUpdateImage(image.id, {
          layout: updateCanvasLayout(
            viewport,
            {
              x: position.x,
              y: position.y,
              width: ref.offsetWidth,
              height: ref.offsetHeight,
            },
            dimensions,
          ),
        })
      }}
    >
      <button
        className="admin-canvas-media"
        type="button"
        tabIndex={0}
        onKeyDown={(event) => handleSelectableKey(event, element, onSelectElement)}
      >
        <img
          className="work-canvas-image"
          src={image.src}
          alt={image.alt}
          draggable={false}
          style={{ objectPosition: image.objectPosition }}
        />
      </button>
    </Rnd>
  )
}
