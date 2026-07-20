import { render, screen } from "@testing-library/react"
import { AudioManagerProvider } from "../audio/AudioManagerProvider"
import { archiveReleases } from "../data/archiveTracks"
import { ArchiveDetail } from "./ArchiveDetail"

describe("ArchiveDetail", () => {
  it("shows the album description and its full track list", () => {
    // Given
    const release = archiveReleases[0]

    if (release === undefined) {
      throw new Error("Expected published content to include an archive release")
    }

    // When
    render(
      <AudioManagerProvider>
        <ArchiveDetail release={release} />
      </AudioManagerProvider>,
    )

    // Then
    expect(screen.getByRole("heading", { name: release.title })).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => element?.className === "archive-detail__description"),
    ).toHaveTextContent(
      (release.description ?? "No release description yet.").replace(/\s+/g, " ").trim(),
    )
    expect(
      screen.getByRole("button", { name: `Play ${release.tracks[0]?.title} with SoundCloud` }),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Back to archive" })).toHaveAttribute(
      "href",
      "/#archive",
    )
  })
})
