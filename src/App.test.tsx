import { render, screen } from "@testing-library/react"
import { App } from "./App"
import { saveAdminContent } from "./admin/adminStore"
import type { AdminContent } from "./admin/adminTypes"
import { publishedAdminContent } from "./data/publishedContent"

function createTestStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear() {
      values.clear()
    },
    getItem(key: string) {
      return values.get(key) ?? null
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null
    },
    removeItem(key: string) {
      values.delete(key)
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}

describe("App", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createTestStorage(),
    })
    window.history.replaceState(null, "", "/")
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("keeps the public site available when published Archive tracks have no playable URL", () => {
    const contentWithoutPlayableArchive: AdminContent = {
      ...publishedAdminContent,
      archiveReleases: publishedAdminContent.archiveReleases.map((release) => ({
        ...release,
        soundCloudPlaylistUrl: "",
        tracks: release.tracks.map((track) => ({
          ...track,
          soundCloudUrl: "",
          soundCloudPlaylistUrl: "",
        })),
      })),
    }

    saveAdminContent(contentWithoutPlayableArchive)
    render(<App />)

    expect(screen.getByRole("region", { name: "Works" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Archive & Sound" })).toBeInTheDocument()
    expect(screen.queryByTitle("SoundCloud playback transport")).not.toBeInTheDocument()
  })

  it("renders an archive release as a separate detail page", () => {
    // Given
    window.history.replaceState(null, "", "/archive/release-soulhack")

    // When
    render(<App />)

    // Then
    expect(screen.getByRole("heading", { name: "The Point-" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Back to archive" })).toHaveAttribute(
      "href",
      "/#archive",
    )
    expect(screen.queryByRole("region", { name: "Works" })).not.toBeInTheDocument()
  })
})
