import {
  clampCanvasHeight,
  clampCanvasRect,
  createDefaultImageLayout,
  createDefaultWorkCanvas,
  getViewportRectForLayout,
  updateCanvasLayout,
} from "./adminCanvas"
import { createBlankWorkTextElement } from "./adminFactories"
import { createSeedAdminContent } from "./adminSeed"
import type { AdminWorkImage } from "./adminTypes"

function requireFirstImage(): AdminWorkImage {
  const firstWork = createSeedAdminContent().works[0]
  const firstImage = firstWork?.images[0]

  if (firstImage === undefined) {
    throw new Error("Expected seeded admin content to include a work image")
  }

  return firstImage
}

describe("adminCanvas", () => {
  it("creates one responsive image layout from seeded works", () => {
    const image = requireFirstImage()
    const canvas = createSeedAdminContent().works[0]?.canvas

    expect(canvas).toEqual(createDefaultWorkCanvas())
    expect(image.layout.width).toBeGreaterThan(0)
    expect(image.layout.height).toBeGreaterThan(0)

    const mobileRect = getViewportRectForLayout(image.layout, "mobile")
    const desktopRect = getViewportRectForLayout(image.layout, "desktop")

    expect(desktopRect.width).toBeGreaterThan(mobileRect.width)
    expect(desktopRect.y).toBe(mobileRect.y)
  })

  it("clamps canvas rectangles inside the selected viewport", () => {
    const rect = clampCanvasRect(
      {
        x: 9999,
        y: 9999,
        width: 9999,
        height: 9999,
      },
      "mobile",
    )

    expect(rect.x).toBe(0)
    expect(rect.y).toBe(0)
    expect(rect.width).toBe(390)
    expect(rect.height).toBe(720)
  })

  it("updates the same responsive layout from any selected viewport", () => {
    const layout = createDefaultImageLayout({
      align: "center",
      height: 800,
      scale: "medium",
      sortOrder: 0,
      width: 1200,
    })
    const updated = updateCanvasLayout("desktop", {
      x: 12,
      y: 24,
      width: 300,
      height: 200,
    })
    const desktopRect = getViewportRectForLayout(updated, "desktop")

    expect(updated).not.toEqual(layout)
    expect(desktopRect).toEqual({ x: 12, y: 24, width: 300, height: 200 })
  })

  it("supports taller work canvases when clamping rectangles", () => {
    const rect = clampCanvasRect(
      {
        x: 120,
        y: 960,
        width: 200,
        height: 160,
      },
      "mobile",
      { width: 390, height: 1400 },
    )

    expect(rect).toEqual({ x: 120, y: 960, width: 200, height: 160 })
    expect(clampCanvasHeight(9999)).toBe(2800)
  })

  it("creates editable text blocks with typography defaults", () => {
    const textElement = createBlankWorkTextElement(0)

    expect(textElement.fontWeight).toBe("bold")
    expect(textElement.textAlign).toBe("left")
    expect(textElement.lineHeight).toBeGreaterThan(0)
    expect(textElement.color).toBe("#f5f5f5")
  })
})
