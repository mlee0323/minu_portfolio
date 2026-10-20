import { useEffect, useState } from "react"

export function AdminCanvasImageInfo({
  src,
  width,
  height,
  desktopWidth,
  onRestoreRatio,
}: {
  readonly src: string
  readonly width: number
  readonly height: number
  readonly desktopWidth: number
  readonly onRestoreRatio: (naturalWidth: number, naturalHeight: number) => void
}) {
  const [image, setImage] = useState<{ src: string; width: number; height: number } | null>(null)
  useEffect(() => {
    let active = true
    const original = new Image()
    original.onload = () => {
      if (active) setImage({ src, width: original.naturalWidth, height: original.naturalHeight })
    }
    original.src = src
    return () => {
      active = false
    }
  }, [src])
  const natural = image?.src === src ? image : null
  const webWidth = Math.round((width * desktopWidth) / 390)
  const webHeight = Math.round((height * desktopWidth) / 390)
  const density = natural ? Math.min(natural.width / webWidth, natural.height / webHeight) : null

  return (
    <div className="admin-canvas-image-info">
      <small>
        Original: {natural ? `${natural.width} × ${natural.height}px` : "Loading…"} · Web:{" "}
        {webWidth} × {webHeight}px
      </small>
      {density !== null && density < 2 ? (
        <small>
          For sharp 2× screens at this size, use at least {webWidth * 2} × {webHeight * 2}px or
          reduce the image size.
        </small>
      ) : null}
      <button
        className="pill-button"
        type="button"
        disabled={!natural}
        onClick={() => {
          if (natural) onRestoreRatio(natural.width, natural.height)
        }}
      >
        Restore original ratio
      </button>
    </div>
  )
}
