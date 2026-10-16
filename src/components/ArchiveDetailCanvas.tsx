import "../styles/archiveDetailCanvas.css"
import type { CSSProperties } from "react"
import type {
  ArchiveDetailCanvasDesign,
  ArchiveDetailCanvasElement,
  ArchiveDetailCanvasViewport,
} from "../data/archiveDetailCanvas"

export function ArchiveDetailCanvasElementContent({
  element,
}: {
  readonly element: ArchiveDetailCanvasElement
}) {
  return element.kind === "image" ? (
    <img
      className="archive-detail-canvas__image"
      src={element.src}
      alt={element.alt}
      style={{ objectPosition: element.objectPosition }}
      draggable={false}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span className="archive-detail-canvas__text">{element.text}</span>
  )
}

export function archiveDetailCanvasElementStyle(
  element: ArchiveDetailCanvasElement,
  viewport: ArchiveDetailCanvasViewport,
): CSSProperties {
  const style = element.styles[viewport]
  return {
    color: style.color,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    textAlign: style.textAlign,
  }
}

export function ArchiveDetailCanvas({ design }: { readonly design: ArchiveDetailCanvasDesign }) {
  return (
    <div className="archive-detail-canvas">
      <div
        className="archive-detail-canvas__stage"
        style={
          {
            "--detail-canvas-height-mobile": design.heights.mobile,
            "--detail-canvas-height-desktop": design.heights.desktop,
          } as CSSProperties
        }
      >
        {design.elements.map((element) => {
          const variables: Record<string, string | number> = {}
          for (const viewport of ["mobile", "desktop"] as const) {
            const rect = element.layouts[viewport]
            const style = element.styles[viewport]
            for (const [key, value] of Object.entries(rect))
              variables[`--detail-${key}-${viewport}`] = value
            variables[`--detail-font-size-${viewport}`] = style.fontSize
            variables[`--detail-font-weight-${viewport}`] = style.fontWeight
            variables[`--detail-line-height-${viewport}`] = style.lineHeight
            variables[`--detail-text-align-${viewport}`] = style.textAlign
            variables[`--detail-color-${viewport}`] = style.color
          }
          return (
            <div
              key={element.id}
              className="archive-detail-canvas__element"
              style={variables as CSSProperties}
            >
              <ArchiveDetailCanvasElementContent element={element} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
