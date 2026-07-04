import type { AudioTrack } from "../audio/types"
import {
  buildSoundCloudEmbedUrl,
  isAllowedSoundCloudTrackUrl,
  normalizeSoundCloudSound,
} from "./soundcloud"

const fallbackTrack: AudioTrack = {
  id: "archive-track",
  title: "Archive Track",
  artist: "Archive Artist",
  provider: "soundcloud",
  artworkUrl: "https://example.com/fallback.jpg",
  durationMs: 123000,
  soundCloudUrl: "https://soundcloud.com/archive/track",
}

describe("SoundCloud utilities", () => {
  it("builds the official SoundCloud iframe URL with widget options", () => {
    const embedUrl = buildSoundCloudEmbedUrl(fallbackTrack.soundCloudUrl ?? "", {
      auto_play: true,
      show_artwork: false,
      show_user: false,
      single_active: true,
      start_track: 2,
    })
    const url = new URL(embedUrl)

    expect(url.origin).toBe("https://w.soundcloud.com")
    expect(url.pathname).toBe("/player/")
    expect(url.searchParams.get("url")).toBe(fallbackTrack.soundCloudUrl)
    expect(url.searchParams.get("auto_play")).toBe("true")
    expect(url.searchParams.get("show_artwork")).toBe("false")
    expect(url.searchParams.get("show_user")).toBe("false")
    expect(url.searchParams.get("single_active")).toBe("true")
    expect(url.searchParams.get("start_track")).toBe("2")
  })

  it("rejects non-SoundCloud track URLs before embedding", () => {
    expect(isAllowedSoundCloudTrackUrl("https://soundcloud.com/archive/track")).toBe(true)
    expect(isAllowedSoundCloudTrackUrl("http://soundcloud.com/archive/track")).toBe(false)
    expect(isAllowedSoundCloudTrackUrl("https://w.soundcloud.com/player/")).toBe(false)
    expect(isAllowedSoundCloudTrackUrl("https://example.com/archive/track")).toBe(false)
    expect(() => buildSoundCloudEmbedUrl("https://example.com/archive/track")).toThrow(
      "Unsafe SoundCloud URL was blocked",
    )
  })

  it("normalizes Widget sound metadata while preserving safe fallbacks", () => {
    const normalized = normalizeSoundCloudSound(
      {
        id: 42,
        title: "Widget Title",
        permalink_url: "https://soundcloud.com/widget/title",
        artwork_url: null,
        duration: 456000,
        user: {
          username: "Widget Artist",
        },
      },
      fallbackTrack,
    )

    expect(normalized).toMatchObject({
      id: "soundcloud-42",
      title: "Widget Title",
      artist: "Widget Artist",
      provider: "soundcloud",
      artworkUrl: fallbackTrack.artworkUrl,
      durationMs: 456000,
      soundCloudUrl: "https://soundcloud.com/widget/title",
    })
  })

  it("returns the fallback track for invalid Widget sound payloads", () => {
    expect(normalizeSoundCloudSound({ permalink_url: "not a url" }, fallbackTrack)).toBe(
      fallbackTrack,
    )
  })

  it("falls back when Widget metadata points to non-allowed origins", () => {
    const normalized = normalizeSoundCloudSound(
      {
        id: 42,
        title: "Widget Title",
        permalink_url: "https://example.com/widget/title",
        artwork_url: "https://example.com/artwork.jpg",
        duration: 456000,
      },
      fallbackTrack,
    )

    expect(normalized.soundCloudUrl).toBe(fallbackTrack.soundCloudUrl)
    expect(normalized.artworkUrl).toBe(fallbackTrack.artworkUrl)
  })
})
