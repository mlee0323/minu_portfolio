import { isAllowedSoundCloudTrackUrl } from "../lib/soundcloud"
import { archiveTracks } from "./archiveTracks"

describe("archiveTracks", () => {
  it("contains SoundCloud tracks with safe UI fallbacks", () => {
    expect(archiveTracks.length).toBeGreaterThan(0)

    for (const track of archiveTracks) {
      expect(track.provider).toBe("soundcloud")
      expect(track.title.trim()).not.toHaveLength(0)
      expect(track.artist.trim()).not.toHaveLength(0)
      expect(track.artworkUrl.trim()).not.toHaveLength(0)
      expect(isAllowedSoundCloudTrackUrl(track.soundCloudUrl ?? "")).toBe(true)
      expect(track.durationMs ?? 1).toBeGreaterThan(0)
    }
  })
})
