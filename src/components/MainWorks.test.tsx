import { render, screen } from "@testing-library/react"
import { publishedWorks } from "../data/publishedSiteContent"
import { MainWorks } from "./MainWorks"

describe("MainWorks", () => {
  it("renders the Admin Mobile canvas as an image-only public sequence", () => {
    render(<MainWorks works={publishedWorks} />)

    const firstImage = screen.getByRole("img", {
      name: /An Eye Stroll installation with a telescope/,
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
    expect(document.querySelector("figcaption")).not.toBeInTheDocument()
    expect(document.querySelector(".is-current")).not.toBeInTheDocument()
  })
})
