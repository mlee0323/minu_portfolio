import type {
  AdminCanvasLayout,
  AdminCanvasRect,
  AdminCanvasViewport,
  AdminWork,
  AdminWorkCanvas,
  ImageAlign,
  ImageScale,
} from "./adminTypes"

export type CanvasDimensions = {
  readonly width: number
  readonly height: number
}

export const adminCanvasDimensions: Record<AdminCanvasViewport, CanvasDimensions> = {
  mobile: { width: 390, height: 720 },
  desktop: { width: 760, height: 520 },
}

export const adminCanvasHeightLimits = {
  min: 520,
  max: 2800,
} as const

const adminCanvasLayoutBaseWidth = adminCanvasDimensions.mobile.width

function assertNever(value: never): never {
  throw new Error(`Unhandled canvas value: ${value}`)
}

function canvasWidthFor(viewport: AdminCanvasViewport): number {
  switch (viewport) {
    case "mobile":
      return adminCanvasDimensions.mobile.width
    case "desktop":
      return adminCanvasDimensions.desktop.width
    default:
      return assertNever(viewport)
  }
}

function layoutScaleFor(viewport: AdminCanvasViewport): number {
  return canvasWidthFor(viewport) / adminCanvasLayoutBaseWidth
}

function baseDimensionsFor(height: number): CanvasDimensions {
  return {
    width: adminCanvasLayoutBaseWidth,
    height: clampCanvasHeight(height),
  }
}

export function createDefaultWorkCanvas(): AdminWorkCanvas {
  return {
    height: adminCanvasDimensions.mobile.height,
  }
}

export function clampCanvasHeight(height: number): number {
  return Math.min(
    Math.max(Math.round(height), adminCanvasHeightLimits.min),
    adminCanvasHeightLimits.max,
  )
}

export function updateWorkCanvasHeight(height: number): AdminWorkCanvas {
  return {
    height: clampCanvasHeight(height),
  }
}

export function getWorkCanvasDimensions(
  work: AdminWork,
  viewport: AdminCanvasViewport,
): CanvasDimensions {
  return {
    width: canvasWidthFor(viewport),
    height: clampCanvasHeight(work.canvas.height),
  }
}

function widthForScale(scale: ImageScale): number {
  switch (scale) {
    case "hero":
      return 340
    case "large":
      return 310
    case "medium":
      return 250
    case "small":
      return 180
    default:
      return assertNever(scale)
  }
}

function xForAlign(align: ImageAlign, canvasWidth: number, itemWidth: number): number {
  switch (align) {
    case "left":
      return 24
    case "center":
      return Math.round((canvasWidth - itemWidth) / 2)
    case "right":
      return Math.max(24, canvasWidth - itemWidth - 24)
    default:
      return assertNever(align)
  }
}

function heightFromAspectRatio(width: number, naturalWidth: number, naturalHeight: number): number {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return Math.round(width * 0.75)
  }

  return Math.round(width / (naturalWidth / naturalHeight))
}

export function clampCanvasRect(
  rect: AdminCanvasRect,
  viewport: AdminCanvasViewport,
  dimensions = adminCanvasDimensions[viewport],
): AdminCanvasRect {
  const canvasWidth = dimensions.width
  const canvasHeight = dimensions.height
  const width = Math.min(Math.max(Math.round(rect.width), 48), canvasWidth)
  const height = Math.min(Math.max(Math.round(rect.height), 32), canvasHeight)

  return {
    x: Math.min(Math.max(Math.round(rect.x), 0), canvasWidth - width),
    y: Math.min(Math.max(Math.round(rect.y), 0), canvasHeight - height),
    width,
    height,
  }
}

export function updateCanvasLayout(
  viewport: AdminCanvasViewport,
  rect: AdminCanvasRect,
  dimensions = adminCanvasDimensions[viewport],
): AdminCanvasLayout {
  const scale = layoutScaleFor(viewport)
  const nextRect = clampCanvasRect(rect, viewport, dimensions)

  return clampCanvasRect(
    {
      x: Math.round(nextRect.x / scale),
      y: nextRect.y,
      width: Math.round(nextRect.width / scale),
      height: nextRect.height,
    },
    "mobile",
    baseDimensionsFor(dimensions.height),
  )
}

export function getViewportRectForLayout(
  layout: AdminCanvasLayout,
  viewport: AdminCanvasViewport,
  dimensions = adminCanvasDimensions[viewport],
): AdminCanvasRect {
  const scale = layoutScaleFor(viewport)

  return clampCanvasRect(
    {
      x: Math.round(layout.x * scale),
      y: layout.y,
      width: Math.round(layout.width * scale),
      height: layout.height,
    },
    viewport,
    dimensions,
  )
}

export function createDefaultImageLayout({
  align,
  height,
  scale,
  sortOrder,
  width,
}: {
  readonly align: ImageAlign
  readonly height: number
  readonly scale: ImageScale
  readonly sortOrder: number
  readonly width: number
}): AdminCanvasLayout {
  const imageWidth = widthForScale(scale)
  const imageHeight = heightFromAspectRatio(imageWidth, width, height)

  return clampCanvasRect(
    {
      x: xForAlign(align, adminCanvasLayoutBaseWidth, imageWidth),
      y: 56 + sortOrder * 132,
      width: imageWidth,
      height: imageHeight,
    },
    "mobile",
  )
}

export function createDefaultTextLayout(sortOrder: number): AdminCanvasLayout {
  return {
    x: 28,
    y: 40 + sortOrder * 72,
    width: 260,
    height: 72,
  }
}
