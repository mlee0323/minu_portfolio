export type AudioProviderKind = "local" | "soundcloud" | "spotify"

export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "ended" | "error"

export type AudioReleaseType = "single" | "ep" | "album" | "playlist"

export type SoundCloudVisibility = "public" | "private-link"

export type AudioProviderEvent =
  | "idle"
  | "ready"
  | "play"
  | "pause"
  | "progress"
  | "finish"
  | "trackchange"
  | "error"

export type AudioTrack = {
  readonly id: string
  readonly title: string
  readonly artist: string
  readonly provider: AudioProviderKind
  readonly artworkUrl: string
  readonly durationMs?: number
  readonly localAudioUrl?: string
  readonly soundCloudUrl?: string
  readonly soundCloudPlaylistUrl?: string
  readonly playlistIndex?: number
  readonly releaseId?: string
  readonly releaseTitle?: string
  readonly trackNumber?: number
  readonly visibility?: SoundCloudVisibility
  readonly description?: string
}

export type AudioRelease = {
  readonly id: string
  readonly title: string
  readonly artist: string
  readonly type: AudioReleaseType
  readonly provider: AudioProviderKind
  readonly artworkUrl: string
  readonly tracks: readonly AudioTrack[]
  readonly year?: string
  readonly soundCloudPlaylistUrl?: string
  readonly visibility?: SoundCloudVisibility
  readonly description?: string
}

export type AudioPlaybackState = {
  readonly provider: AudioProviderKind | null
  readonly status: PlaybackStatus
  readonly currentTrack: AudioTrack | null
  readonly positionMs: number
  readonly durationMs: number
  readonly lastEvent: AudioProviderEvent
  readonly errorMessage: string | null
}

export type AudioPlayRequest = {
  readonly provider: AudioProviderKind
  readonly track: AudioTrack
}

export interface AudioProvider {
  readonly kind: AudioProviderKind
  play(track: AudioTrack): Promise<void>
  pause(): void
  getSnapshot(): AudioPlaybackState
  subscribe(listener: () => void): () => void
}

export const idlePlaybackState: AudioPlaybackState = {
  provider: null,
  status: "idle",
  currentTrack: null,
  positionMs: 0,
  durationMs: 0,
  lastEvent: "idle",
  errorMessage: null,
}
