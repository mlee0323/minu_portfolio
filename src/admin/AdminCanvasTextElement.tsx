import { Move } from "lucide-react"
import type { CSSProperties, KeyboardEvent } from "react"
import { Rnd } from "react-rnd"
import type { SelectedCanvasElement } from "./AdminWorksEditorTypes"
import { getViewportRectForLayout, updateCanvasLayout } from "./adminCanvas"
import type { AdminCanvasViewport, AdminTextWeight, AdminWorkTextElement } from "./adminTypes"

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

function assertNever(value: never): never {
  throw new Error(`Unhandled text weight: ${value}`)
}

function fontWeightFor(weight: AdminTextWeight): number {
  switch (weight) {
    case "light":
      return 300
    case "regular":
      return 500
    case "bold":
      return 760
    case "black":
      return 900
    default:
      return assertNever(weight)
  }
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

function textStyleFor(textElement: AdminWorkTextElement): CSSProperties {
  return {
    color: textElement.color,
    fontSize: textElement.fontSize,
    fontWeight: fontWeightFor(textElement.fontWeight),
    lineHeight: textElement.lineHeight,
    textAlign: textElement.textAlign,
  }
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
  const rect = getViewportRectForLayout(textElement.layout, viewport, dimensions)
  const textStyle = textStyleFor(textElement)

  return (
    <Rnd
      bounds="parent"
      cancel={selected ? ".admin-canvas-copy-input" : undefined}
      className={
        selected
          ? "admin-canvas-element admin-canvas-text is-selected"
          : "admin-canvas-element admin-canvas-text"
      }
      dragHandleClassName={selected ? "admin-canvas-drag-handle" : undefined}
      position={{ x: rect.x, y: rect.y }}
      scale={canvasScale}
      size={{ width: rect.width, height: rect.height }}
      onDragStop={(event, data) => {
        event.stopPropagation()
        onUpdateTextElement(textElement.id, {
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
        onUpdateTextElement(textElement.id, {
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
      {selected ? (
        <>
          <textarea
            aria-label="Edit canvas text"
            className="admin-canvas-copy admin-canvas-copy-input"
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
          className="admin-canvas-copy"
          type="button"
          tabIndex={0}
          style={textStyle}
          onKeyDown={(event) => handleSelectableKey(event, element, onSelectElement)}
        >
          {textElement.text}
        </button>
      )}
    </Rnd>
  )
}
