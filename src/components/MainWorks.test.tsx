import { render, screen } from "@testing-library/react"
import {
  createBlankWork,
  createBlankWorkTextElement,
  createWorkImageFromAsset,
} from "../admin/adminFactories"
import { MainWorks } from "./MainWorks"

describe("MainWorks", () => {
  it("renders published images and text with the same responsive canvas geometry", () => {
    const publishedWorks = [
      {
        ...createBlankWork(0),
        images: [
          {
            ...createWorkImageFromAsset({
              src: "/fixture.jpg",
              alt: "Canvas image fixture",
              width: 1200,
              height: 800,
              sortOrder: 0,
            }),
            layout: { x: 24, y: 64, width: 300, height: 200 },
          },
        ],
        textElements: [{ ...createBlankWorkTextElement(0), text: "Published text fixture" }],
      },
    ]
    render(<MainWorks works={publishedWorks} />)

    const firstImage = screen.getByRole("img", {
      name: "Canvas image fixture",
    })
    const firstFigure = firstImage.closest("figure")
    const firstCanvas = firstImage.closest("article")
    const firstLayout = publishedWorks[0]?.images[0]?.layout

    if (firstLayout === undefined) {
      throw new Error("Expected first published work image to have a layout")
    }

    expect(firstFigure).not.toBeNull()
    expect(firstCanvas).not.toBeNull()
    expect(firstFigure).toHaveStyle({
      top: `${String((firstLayout.y / 720) * 100)}%`,
      left: `${String((firstLayout.x / 390) * 100)}%`,
      width: `${String((firstLayout.width / 390) * 100)}%`,
      height: `${String((firstLayout.height / 720) * 100)}%`,
    })
    expect(firstCanvas).toHaveStyle({ aspectRatio: "390 / 720" })
    expect(firstImage).toHaveClass("work-canvas-image")
    expect(screen.queryByText("Current Work")).not.toBeInTheDocument()
    expect(screen.getByText("Published text fixture")).toHaveClass("canvas-text")
    expect(screen.getByText("Published text fixture")).toHaveStyle({
      fontWeight: "500",
      fontSize: "calc(24 / 390 * 100cqw)",
    })
    expect(document.querySelector("figcaption")).not.toBeInTheDocument()
    expect(document.querySelector(".is-current")).not.toBeInTheDocument()
  })
})
