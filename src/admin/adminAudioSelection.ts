import type { AdminArchiveTrack, AdminAudioTrack, AdminContent } from "./adminTypes"

export function listArchiveAudioTracks(content: AdminContent): readonly AdminArchiveTrack[] {
  return content.archiveReleases.flatMap((release) => release.tracks)
}

export function createWorkAudioFromArchiveTrack(track: AdminArchiveTrack): AdminAudioTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    provider: "soundcloud",
    artworkUrl: track.artworkUrl,
    durationMs: track.durationMs,
    localAudioUrl: "",
    soundCloudUrl: track.soundCloudUrl,
    soundCloudPlaylistUrl: track.soundCloudPlaylistUrl,
    playlistIndex: track.playlistIndex,
    visibility: track.visibility,
    description: track.description,
  }
}
