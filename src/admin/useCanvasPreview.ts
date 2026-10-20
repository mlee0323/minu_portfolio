import { useEffect, useRef, useState } from "react"

// Render at the displayed size instead of scaling a rasterized 390px layer.
// Geometry remains in 390 design units; pointer positions convert back on edit.
export function useCanvasPreview(viewport: "mobile" | "desktop", desktopWidth: number) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState(390)
  const targetWidth = viewport === "mobile" ? 390 : desktopWidth
  const width = Math.min(targetWidth, Math.max(1, availableWidth))

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const measure = () => setAvailableWidth(frame.clientWidth)
    measure()
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure)
      return () => window.removeEventListener("resize", measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  return { frameRef, width, scale: width / 390, targetWidth }
}
