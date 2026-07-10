import { render, screen } from "@testing-library/react"
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
})
