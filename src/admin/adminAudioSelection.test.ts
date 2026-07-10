import { describe, expect, it } from "vitest"
import { createWorkAudioFromArchiveTrack, listArchiveAudioTracks } from "./adminAudioSelection"
import { createSeedAdminContent } from "./adminSeed"

describe("admin audio selection", () => {
  it("lists tracks from archive releases in release order", () => {
    const content = createSeedAdminContent()
    const tracks = listArchiveAudioTracks(content)

    expect(tracks.map((track) => track.id)).toEqual(
      content.archiveReleases.flatMap((release) => release.tracks.map((track) => track.id)),
    )
  })

  it("creates work audio from the selected archive track", () => {
    const [track] = listArchiveAudioTracks(createSeedAdminContent())

    expect(track).toBeDefined()

    if (track === undefined) {
      return
    }

    expect(createWorkAudioFromArchiveTrack(track)).toMatchObject({
      id: track.id,
      title: track.title,
      artist: track.artist,
      provider: "soundcloud",
      artworkUrl: track.artworkUrl,
      localAudioUrl: "",
      soundCloudUrl: track.soundCloudUrl,
      soundCloudPlaylistUrl: track.soundCloudPlaylistUrl,
      playlistIndex: track.playlistIndex,
      visibility: track.visibility,
    })
  })
})
