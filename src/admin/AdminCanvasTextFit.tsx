import { type CSSProperties, useLayoutEffect, useRef, useState } from "react"

export function AdminCanvasTextFit({
  text,
  style,
  width,
  height,
  maxHeight,
  onFit,
}: {
  readonly text: string
  readonly style: CSSProperties
  readonly width: number
  readonly height: number
  readonly maxHeight: number
  readonly onFit: (height: number) => void
}) {
  const measureRef = useRef<HTMLSpanElement>(null)
  const [neededHeight, setNeededHeight] = useState(0)
  const { fontSize, fontWeight, lineHeight } = style
  // Remeasure after content or typography changes update the rendered measurement node.
  // biome-ignore lint/correctness/useExhaustiveDependencies: these values change DOM text metrics
  useLayoutEffect(() => {
    let active = true
    const measure = () => {
      if (active && measureRef.current)
        setNeededHeight(Math.ceil(measureRef.current.getBoundingClientRect().height))
    }
    measure()
    void document.fonts?.ready.then(measure)
    return () => {
      active = false
    }
  }, [text, width, fontSize, fontWeight, lineHeight])

  return (
    <div className="admin-canvas-text-fit">
      <span
        aria-hidden="true"
        ref={measureRef}
        className="canvas-text admin-text-measure"
        style={{ ...style, width }}
      >
        {text || "\u00a0"}
      </span>
      <small>Font size is measured on the shared 390px canvas and scales with images.</small>
      {neededHeight > height ? (
        <small role="status">
          Text is clipped: needs {neededHeight}px height; current {height}px.
        </small>
      ) : null}
      <button
        className="pill-button"
        type="button"
        disabled={neededHeight === 0}
        onClick={() => onFit(Math.min(maxHeight, neededHeight))}
      >
        Fit text height
      </button>
      {neededHeight > maxHeight ? <small>Increase the canvas height to fit all text.</small> : null}
    </div>
  )
}
