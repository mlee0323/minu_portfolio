import { render, screen } from "@testing-library/react"
import { AudioManagerProvider } from "../audio/AudioManagerProvider"
import { IntroOverlay } from "./IntroOverlay"

describe("IntroOverlay", () => {
  it("renders the breathing dot inside the first-entry overlay", () => {
    render(
      <AudioManagerProvider>
        <IntroOverlay introTrack={undefined} onComplete={vi.fn()} />
      </AudioManagerProvider>,
    )

    const overlay = screen.getByRole("button", { name: "Start listening experience" })
    const svg = overlay.querySelector("svg")

    expect(svg).toHaveAttribute("viewBox", "0 0 220 220")
    expect(svg?.querySelector("path")).not.toBeNull()
  })
})
