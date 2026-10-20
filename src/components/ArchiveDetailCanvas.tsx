import "../styles/archiveDetailCanvas.css"
import type { CSSProperties } from "react"
import type {
  ArchiveDetailCanvasDesign,
  ArchiveDetailCanvasElement,
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
    <span className="archive-detail-canvas__text canvas-text">{element.text}</span>
  )
}

export function archiveDetailCanvasElementStyle(
  element: ArchiveDetailCanvasElement,
  scale = 1,
): CSSProperties {
  const style = element.style
  return {
    color: style.color,
    fontSize: style.fontSize * scale,
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
            "--detail-canvas-height": design.height,
          } as CSSProperties
        }
      >
        {design.elements.map((element) => {
          const variables: Record<string, string | number> = {}
          const rect = element.layout
          const style = element.style
          for (const [key, value] of Object.entries(rect)) variables[`--detail-${key}`] = value
          variables["--detail-font-size"] = style.fontSize
          variables["--detail-font-weight"] = style.fontWeight
          variables["--detail-line-height"] = style.lineHeight
          variables["--detail-text-align"] = style.textAlign
          variables["--detail-color"] = style.color
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
