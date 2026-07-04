import { isAllowedSoundCloudTrackUrl } from "../lib/soundcloud"
import { archiveReleases, archiveTracks } from "./archiveTracks"

describe("archiveTracks", () => {
  it("contains release groups that can represent albums and playlists", () => {
    expect(archiveReleases.length).toBeGreaterThan(0)

    for (const release of archiveReleases) {
      expect(release.provider).toBe("soundcloud")
      expect(release.title.trim()).not.toHaveLength(0)
      expect(release.artist.trim()).not.toHaveLength(0)
      expect(release.artworkUrl.trim()).not.toHaveLength(0)
      expect(release.tracks.length).toBeGreaterThan(0)

      if (release.soundCloudPlaylistUrl !== undefined) {
        expect(isAllowedSoundCloudTrackUrl(release.soundCloudPlaylistUrl)).toBe(true)
      }

      for (const track of release.tracks) {
        expect(track.releaseId).toBe(release.id)
        expect(track.releaseTitle).toBe(release.title)

        if (track.soundCloudPlaylistUrl !== undefined) {
          expect(isAllowedSoundCloudTrackUrl(track.soundCloudPlaylistUrl)).toBe(true)
          expect(track.playlistIndex ?? -1).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

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
