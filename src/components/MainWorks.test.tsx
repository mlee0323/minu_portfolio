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

    expect(firstFigure).not.toBeNull()
    expect(firstCanvas).not.toBeNull()
    expect(firstFigure).toHaveStyle({
      top: `${String((56 / 720) * 100)}%`,
      left: `${String((25 / 390) * 100)}%`,
      width: `${String((340 / 390) * 100)}%`,
      height: `${String((240 / 720) * 100)}%`,
    })
    expect(firstCanvas).toHaveStyle({ aspectRatio: "390 / 720" })
    expect(screen.queryByText("Current Work")).not.toBeInTheDocument()
    expect(document.querySelector("figcaption")).not.toBeInTheDocument()
    expect(document.querySelector(".is-current")).not.toBeInTheDocument()
  })
})
