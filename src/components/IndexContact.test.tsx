import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { ContactLink, IndexItem } from "../data/siteContent"
import { IndexContact } from "./IndexContact"

const contactLinks: readonly ContactLink[] = [
  { label: "Email", href: "llsyawla@gmail.com" },
  { label: "Instagram", href: "https://www.instagram.com/nnuu_lee" },
  { label: "Soundcloud", href: "https://soundcloud.com/syawla_nnuu" },
]

const indexItems: readonly IndexItem[] = [
  { year: "2025", title: "Selected record", role: "Sound director" },
]

describe("IndexContact", () => {
  it("shows the email address and external social logo links", () => {
    render(<IndexContact contactLinks={contactLinks} indexItems={indexItems} />)

    expect(screen.getByRole("button", { name: "Email llsyawla@gmail.com" })).toBeInTheDocument()

    const instagramLink = screen.getByRole("link", {
      name: "Open Instagram in a new window",
    })
    const soundCloudLink = screen.getByRole("link", {
      name: "Open SoundCloud in a new window",
    })

    expect(instagramLink).toHaveAttribute("target", "_blank")
    expect(instagramLink).toHaveAttribute("rel", "noreferrer noopener")
    expect(soundCloudLink).toHaveAttribute("target", "_blank")
    expect(soundCloudLink).toHaveAttribute("rel", "noreferrer noopener")
    expect(instagramLink.querySelector("svg")).not.toBeNull()
    expect(soundCloudLink.querySelector("svg")).not.toBeNull()
  })

  it("restores the SoundCloud footer link when an older content draft only has Instagram", () => {
    render(
      <IndexContact
        contactLinks={contactLinks.filter((link) => link.label !== "Soundcloud")}
        indexItems={indexItems}
      />,
    )

    expect(screen.getByRole("link", { name: "Open SoundCloud in a new window" })).toHaveAttribute(
      "href",
      "https://soundcloud.com/syawla_nnuu",
    )
  })

  it("opens a mail composer and launches a mailto draft", async () => {
    const openWindow = vi.spyOn(window, "open").mockImplementation(() => null)

    render(<IndexContact contactLinks={contactLinks} indexItems={indexItems} />)
    fireEvent.click(screen.getByRole("button", { name: "Email llsyawla@gmail.com" }))

    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveTextContent("To llsyawla@gmail.com")

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Installation collaboration" },
    })
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Hello Minu" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Open email client" }))

    await waitFor(() => {
      expect(openWindow).toHaveBeenCalledWith(
        "mailto:llsyawla@gmail.com?subject=Installation+collaboration&body=Hello+Minu",
        "_blank",
        "noopener,noreferrer",
      )
    })
    openWindow.mockRestore()
  })
})
