import { render, screen } from "@testing-library/react"
import { AudioManagerProvider } from "../audio/AudioManagerProvider"
import {
  createArchiveDetailCanvasElement,
  createDefaultArchiveDetailCanvas,
} from "../data/archiveDetailCanvas"
import { archiveReleases } from "../data/archiveTracks"
import { ArchiveDetail } from "./ArchiveDetail"

describe("ArchiveDetail", () => {
  it("renders custom detail below tracks while keeping the original fixed header and playback controls", () => {
    const release = archiveReleases[0]
    if (!release) throw new Error("Expected archive release")
    const detail = createDefaultArchiveDetailCanvas(release)
    const caption = {
      ...createArchiveDetailCanvasElement("text", "custom-caption"),
      text: "An editable detail caption",
    }
    render(
      <AudioManagerProvider>
        <ArchiveDetail
          release={{ ...release, detail: { ...detail, elements: [...detail.elements, caption] } }}
        />
      </AudioManagerProvider>,
    )
    expect(screen.getByRole("heading", { level: 1, name: release.title })).toBeInTheDocument()
    expect(screen.getByText("An editable detail caption")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 1 }).closest(".archive-detail__hero"),
    ).not.toBeNull()
    expect(
      screen
        .getByRole("heading", { name: "Track list" })
        .compareDocumentPosition(screen.getByText("An editable detail caption")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()

    expect(screen.getByRole("heading", { name: "Track list" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: `Play ${release.title} release with SoundCloud` }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: `Play ${release.tracks[0]?.title} with SoundCloud` }),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open on SoundCloud" })).toHaveAttribute(
      "target",
      "_blank",
    )
  })
  it("keeps an explicitly empty detail canvas empty instead of showing legacy images", () => {
    const release = archiveReleases[0]
    if (!release) throw new Error("Expected archive release")
    render(
      <AudioManagerProvider>
        <ArchiveDetail
          release={{
            ...release,
            images: [
              {
                id: "hidden-legacy",
                src: "/legacy.jpg",
                alt: "Removed legacy image",
                width: 100,
                height: 100,
                aspectRatio: "1 / 1",
                objectPosition: "center",
              },
            ],
            detail: { heights: { mobile: 720, desktop: 900 }, elements: [] },
          }}
        />
      </AudioManagerProvider>,
    )
    expect(screen.queryByRole("img", { name: "Removed legacy image" })).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: release.title })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Track list" })).toBeInTheDocument()
  })

  it("shows the album description, full track list, and detail images", () => {
    // Given
    const release = archiveReleases[0]

    if (release === undefined) {
      throw new Error("Expected published content to include an archive release")
    }

    // When
    const releaseWithImages = {
      ...release,
      images: [
        {
          id: "release-image-1",
          src: "/images/works/eye-stroll-telescope.jpg",
          alt: "Album installation image",
          width: 1113,
          height: 787,
          aspectRatio: "1113 / 787",
          objectPosition: "center",
        },
      ],
    }

    render(
      <AudioManagerProvider>
        <ArchiveDetail release={releaseWithImages} />
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
    expect(screen.getByRole("img", { name: "Album installation image" })).toHaveAttribute(
      "src",
      "/images/works/eye-stroll-telescope.jpg",
    )
  })
})
