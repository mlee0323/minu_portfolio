import { fireEvent, render, screen } from "@testing-library/react"
import { AudioManagerProvider } from "../audio/AudioManagerProvider"
import type { AudioRelease } from "../audio/types"
import { archiveReleases } from "../data/archiveTracks"
import { Archive } from "./Archive"

function requireFirstRelease(): AudioRelease {
  const release = archiveReleases[0]

  if (release === undefined) {
    throw new Error("Expected published content to include an archive release")
  }

  return release
}

function renderArchive(releases: readonly AudioRelease[]) {
  return render(
    <AudioManagerProvider>
      <Archive releases={releases} />
    </AudioManagerProvider>,
  )
}

describe("Archive", () => {
  it("marks three or fewer releases as a centered wide-screen collection", () => {
    // Given
    const releases = archiveReleases.slice(0, 3)

    // When
    renderArchive(releases)

    // Then
    expect(screen.getByRole("list", { name: "Sound archive carousel" })).toHaveClass(
      "release-carousel--compact",
    )
  })

  it("keeps four or more releases in the scroll-led layout", () => {
    // Given
    const release = requireFirstRelease()
    const releases = Array.from({ length: 4 }, (_, index) => ({
      ...release,
      id: `${release.id}-${String(index)}`,
      title: `${release.title} ${String(index + 1)}`,
    }))

    // When
    renderArchive(releases)

    // Then
    expect(screen.getByRole("list", { name: "Sound archive carousel" })).not.toHaveClass(
      "release-carousel--compact",
    )
  })

  it("expands all album cards below without exposing track rows", () => {
    // Given
    const release = requireFirstRelease()
    renderArchive(
      Array.from({ length: 4 }, (_, index) => ({
        ...release,
        id: `${release.id}-${String(index)}`,
        title: `${release.title} ${String(index + 1)}`,
      })),
    )

    // When
    const carousel = screen.getByRole("list", { name: "Sound archive carousel" })
    expect(
      screen.queryByRole("button", { name: `Play ${release.tracks[0]?.title} with SoundCloud` }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "View all releases" }))

    // Then
    expect(carousel).toHaveClass("release-carousel--expanded")
    expect(screen.getByRole("list", { name: "All releases" })).toBe(carousel)
    expect(screen.getByRole("button", { name: "Hide all" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
    expect(
      screen.queryByRole("button", { name: `Play ${release.tracks[0]?.title} with SoundCloud` }),
    ).not.toBeInTheDocument()
  })

  it("links each album card to its own detail page and uses the footer SoundCloud account", () => {
    // Given
    const release = requireFirstRelease()

    // When
    renderArchive([release])

    // Then
    expect(screen.getByRole("link", { name: `Open ${release.title} album page` })).toHaveAttribute(
      "href",
      `/archive/${release.id}`,
    )
    expect(screen.getByRole("link", { name: "Full archive" })).toHaveAttribute(
      "href",
      "https://soundcloud.com/syawla_nnuu",
    )
    expect(
      screen.queryByRole("button", { name: `Play ${release.title} release with SoundCloud` }),
    ).not.toBeInTheDocument()
  })
})
