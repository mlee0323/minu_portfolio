import type { AudioProviderKind } from "./types"

export class AudioProviderUnavailableError extends Error {
  readonly name = "AudioProviderUnavailableError"

  constructor(readonly provider: AudioProviderKind) {
    super(`Audio provider is not registered: ${provider}`)
  }
}

export class LocalAudioSourceError extends Error {
  readonly name = "LocalAudioSourceError"

  constructor(readonly trackId: string) {
    super(`Local audio URL is missing for track: ${trackId}`)
  }
}

export class LocalAudioPlaybackError extends Error {
  readonly name = "LocalAudioPlaybackError"

  constructor(
    readonly trackId: string,
    readonly reason: string,
  ) {
    super(`Local audio playback failed for ${trackId}: ${reason}`)
  }
}

export class SoundCloudTrackUrlError extends Error {
  readonly name = "SoundCloudTrackUrlError"

  constructor(
    readonly trackId: string,
    readonly reason: "missing" | "invalid" = "missing",
  ) {
    super(`SoundCloud URL is ${reason} for track: ${trackId}`)
  }
}
