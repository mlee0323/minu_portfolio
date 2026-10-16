export type ArchiveDetailCanvasViewport = "mobile" | "desktop"
export type ArchiveDetailCanvasElementKind = "image" | "text"
export type ArchiveDetailCanvasRect = {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}
export type ArchiveDetailCanvasStyle = {
  readonly fontSize: number
  readonly fontWeight: number
  readonly lineHeight: number
  readonly textAlign: "left" | "center" | "right"
  readonly color: string
}
export type ArchiveDetailCanvasElement = {
  readonly id: string
  readonly kind: ArchiveDetailCanvasElementKind
  readonly text: string
  readonly src: string
  readonly alt: string
  readonly objectPosition: string
  readonly layouts: Readonly<Record<ArchiveDetailCanvasViewport, ArchiveDetailCanvasRect>>
  readonly styles: Readonly<Record<ArchiveDetailCanvasViewport, ArchiveDetailCanvasStyle>>
}
export type ArchiveDetailCanvasDesign = {
  readonly heights: Readonly<Record<ArchiveDetailCanvasViewport, number>>
  readonly elements: readonly ArchiveDetailCanvasElement[]
}
type DetailImage = {
  readonly id: string
  readonly src: string
  readonly alt: string
  readonly width: number
  readonly height: number
  readonly objectPosition: string
}

export const archiveDetailCanvasWidths = { mobile: 390, desktop: 1200 } as const
export const archiveDetailCanvasLabels = { image: "Image", text: "Text" } as const
export const archiveDetailCanvasMaxHeight = 24000

export function createArchiveDetailCanvasElement(
  kind: ArchiveDetailCanvasElementKind,
  id: string,
): ArchiveDetailCanvasElement {
  const style = {
    fontSize: 24,
    fontWeight: 430,
    lineHeight: 1.15,
    textAlign: "left",
    color: "#f5f5f5",
  } as const
  return {
    id,
    kind,
    text: kind === "text" ? "New text" : "",
    src: "",
    alt: "Image",
    objectPosition: "center",
    layouts: {
      mobile: { x: 20, y: 20, width: 350, height: kind === "image" ? 230 : 100 },
      desktop: { x: 40, y: 40, width: 560, height: kind === "image" ? 370 : 140 },
    },
    styles: { mobile: style, desktop: { ...style, fontSize: 36 } },
  }
}

// Import existing gallery images when the first detail edit is made.
// Releases without a saved canvas continue to use the original gallery renderer.
export function createDefaultArchiveDetailCanvas(release: {
  readonly images: readonly DetailImage[]
}): ArchiveDetailCanvasDesign {
  let mobileY = 0
  let desktopY = 0
  const elements = release.images.map((image) => {
    const mobileHeight = Math.max(24, Math.round((350 * image.height) / image.width))
    const desktopHeight = Math.max(24, Math.round((1000 * image.height) / image.width))
    const element = {
      ...createArchiveDetailCanvasElement("image", image.id),
      src: image.src,
      alt: image.alt,
      objectPosition: image.objectPosition,
      layouts: {
        mobile: { x: 20, y: mobileY, width: 350, height: mobileHeight },
        desktop: { x: 100, y: desktopY, width: 1000, height: desktopHeight },
      },
    }
    mobileY += mobileHeight + 24
    desktopY += desktopHeight + 40
    return element
  })
  return {
    heights: { mobile: Math.max(720, mobileY), desktop: Math.max(900, desktopY) },
    elements,
  }
}

export function clampArchiveDetailCanvasRect(
  rect: ArchiveDetailCanvasRect,
  width: number,
  height: number,
): ArchiveDetailCanvasRect {
  const nextWidth = Math.min(width, Math.max(32, Math.round(rect.width)))
  const nextHeight = Math.min(height, Math.max(24, Math.round(rect.height)))
  return {
    x: Math.min(width - nextWidth, Math.max(0, Math.round(rect.x))),
    y: Math.min(height - nextHeight, Math.max(0, Math.round(rect.y))),
    width: nextWidth,
    height: nextHeight,
  }
}
