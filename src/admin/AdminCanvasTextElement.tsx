import { Move } from "lucide-react"
import type { KeyboardEvent } from "react"
import { Rnd } from "react-rnd"
import { workTextStyle } from "../data/canvasTypography"
import type { SelectedCanvasElement } from "./AdminWorksEditorTypes"
import { getViewportRectForLayout, updateCanvasLayout } from "./adminCanvas"
import type { AdminCanvasViewport, AdminWorkTextElement } from "./adminTypes"

type CanvasDimensions = {
  readonly width: number
  readonly height: number
}

type CanvasTextElementProps = {
  readonly canvasScale: number
  readonly dimensions: CanvasDimensions
  readonly selected: boolean
  readonly textElement: AdminWorkTextElement
  readonly viewport: AdminCanvasViewport
  readonly onSelectElement: (element: SelectedCanvasElement) => void
  readonly onUpdateTextElement: (
    textElementId: string,
    patch: Partial<AdminWorkTextElement>,
  ) => void
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

export function AdminCanvasTextElement({
  canvasScale,
  dimensions,
  onSelectElement,
  onUpdateTextElement,
  selected,
  textElement,
  viewport,
}: CanvasTextElementProps) {
  const element = { kind: "text", id: textElement.id } as const
  const baseRect = getViewportRectForLayout(textElement.layout, viewport, dimensions)
  const rect = {
    x: baseRect.x * canvasScale,
    y: baseRect.y * canvasScale,
    width: baseRect.width * canvasScale,
    height: baseRect.height * canvasScale,
  }
  const textStyle = workTextStyle(textElement, canvasScale)

  return (
    <Rnd
      bounds="parent"
      {...(selected ? { cancel: ".admin-canvas-copy-input" } : {})}
      className={
        selected
          ? "admin-canvas-element admin-canvas-text is-selected"
          : "admin-canvas-element admin-canvas-text"
      }
      {...(selected ? { dragHandleClassName: "admin-canvas-drag-handle" } : {})}
      position={{ x: rect.x, y: rect.y }}
      size={{ width: rect.width, height: rect.height }}
      onDragStop={(event, data) => {
        event.stopPropagation()
        onUpdateTextElement(textElement.id, {
          layout: updateCanvasLayout(
            viewport,
            {
              ...baseRect,
              x: data.x / canvasScale,
              y: data.y / canvasScale,
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
        onUpdateTextElement(textElement.id, {
          layout: updateCanvasLayout(
            viewport,
            {
              x: position.x / canvasScale,
              y: position.y / canvasScale,
              width: ref.getBoundingClientRect().width / canvasScale,
              height: ref.getBoundingClientRect().height / canvasScale,
            },
            dimensions,
          ),
        })
      }}
    >
      {selected ? (
        <>
          <textarea
            aria-label="Edit canvas text"
            className="admin-canvas-copy admin-canvas-copy-input canvas-text"
            spellCheck={false}
            style={textStyle}
            value={textElement.text}
            onChange={(event) =>
              onUpdateTextElement(textElement.id, { text: event.currentTarget.value })
            }
          />
          <button className="admin-canvas-drag-handle" type="button" aria-label="Move text block">
            <Move size={13} />
          </button>
        </>
      ) : (
        <button
          className="admin-canvas-copy canvas-text"
          type="button"
          tabIndex={0}
          style={textStyle}
          onKeyDown={(event) => handleSelectableKey(event, element, onSelectElement)}
        >
          <span className="canvas-text">{textElement.text}</span>
        </button>
      )}
    </Rnd>
  )
}
