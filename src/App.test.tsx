import { fireEvent, render, screen } from "@testing-library/react"
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
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: createTestStorage(),
    })
    vi.spyOn(window, "scrollTo").mockImplementation(() => {})
    window.history.replaceState(null, "", "/")
  })

  afterEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it("shows the intro on first entry and skips it after a full page remount in the same visit", () => {
    const firstVisit = render(<App />)
    fireEvent.click(screen.getByRole("button", { name: "Start listening experience" }))
    // Remount immediately, before the confirmation animation finishes.
    firstVisit.unmount()
    render(<App />)
    expect(
      screen.queryByRole("button", { name: "Start listening experience" }),
    ).not.toBeInTheDocument()
    expect(document.querySelector(".app-shell")).toHaveClass("is-started")
    expect(document.body).not.toHaveClass("is-intro-active")
    expect(
      screen.queryByRole("button", { name: "Pause active audio source" }),
    ).not.toBeInTheDocument()
  })

  it("does not reopen the intro when returning from an archive detail via popstate", () => {
    window.history.replaceState(null, "", "/archive/release-soulhack")
    render(<App />)
    window.history.replaceState(null, "", "/")
    fireEvent(window, new PopStateEvent("popstate"))
    expect(screen.getByRole("region", { name: "Works" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Start listening experience" }),
    ).not.toBeInTheDocument()
    expect(document.querySelector(".app-shell")).toHaveClass("is-started")
  })

  it("also skips the intro after a full navigation from a directly opened archive detail", () => {
    window.history.replaceState(null, "", "/archive/release-soulhack")
    const detailVisit = render(<App />)
    detailVisit.unmount()
    window.history.replaceState(null, "", "/")
    const homeVisit = render(<App />)
    expect(
      screen.queryByRole("button", { name: "Start listening experience" }),
    ).not.toBeInTheDocument()
    homeVisit.unmount()
    window.sessionStorage.clear()
    render(<App />)
    expect(screen.getByRole("button", { name: "Start listening experience" })).toBeInTheDocument()
  })

  it("keeps the site usable when session storage is blocked", () => {
    vi.spyOn(window.sessionStorage, "getItem").mockImplementation(() => {
      throw new Error("Blocked")
    })
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("Blocked")
    })
    render(<App />)
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: "Start listening experience" })),
    ).not.toThrow()
    expect(screen.getByRole("region", { name: "Works" })).toBeInTheDocument()
  })

  it("ignores local draft changes on the public site", () => {
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
    expect(screen.getByTitle("SoundCloud playback transport")).toBeInTheDocument()
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
