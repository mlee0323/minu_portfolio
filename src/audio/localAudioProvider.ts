import { LocalAudioPlaybackError, LocalAudioSourceError } from "./audioErrors"
import type { AudioPlaybackState, AudioProvider, AudioTrack } from "./types"
import { idlePlaybackState } from "./types"

type AudioElementFactory = () => HTMLAudioElement

export class LocalAudioProvider implements AudioProvider {
  readonly kind = "local"
  private readonly listeners = new Set<() => void>()
  private readonly createAudioElement: AudioElementFactory
  private audio: HTMLAudioElement | null = null
  private cleanupAudio: (() => void) | null = null
  private snapshot: AudioPlaybackState = idlePlaybackState

  constructor(createAudioElement: AudioElementFactory = () => new Audio()) {
    this.createAudioElement = createAudioElement
  }

  async play(track: AudioTrack): Promise<void> {
    if (track.localAudioUrl === undefined) {
      throw new LocalAudioSourceError(track.id)
    }

    if (this.snapshot.currentTrack?.id !== track.id) {
      this.replaceAudio(track)
    }

    const audio = this.audio
    if (audio === null) {
      throw new LocalAudioSourceError(track.id)
    }

    this.setSnapshot({
      ...this.snapshot,
      provider: "local",
      status: "loading",
      currentTrack: track,
      lastEvent: "ready",
      errorMessage: null,
    })

    try {
      await audio.play()
      this.setSnapshot({
        ...this.snapshot,
        status: "playing",
        lastEvent: "play",
        errorMessage: null,
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown playback error"
      this.setSnapshot({
        ...this.snapshot,
        status: "error",
        lastEvent: "error",
        errorMessage: reason,
      })
      throw new LocalAudioPlaybackError(track.id, reason)
    }
  }

  pause(): void {
    this.audio?.pause()
    this.setSnapshot({
      ...this.snapshot,
      status: this.snapshot.currentTrack === null ? "idle" : "paused",
      lastEvent: "pause",
    })
  }

  getSnapshot(): AudioPlaybackState {
    return this.snapshot
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  private replaceAudio(track: AudioTrack): void {
    this.cleanupAudio?.()
    this.audio?.pause()

    const audio = this.createAudioElement()
    audio.src = track.localAudioUrl ?? ""
    audio.preload = "metadata"

    const updateProgress = () => {
      this.setSnapshot({
        ...this.snapshot,
        positionMs: Math.round(audio.currentTime * 1000),
        durationMs: Number.isFinite(audio.duration) ? Math.round(audio.duration * 1000) : 0,
        lastEvent: "progress",
      })
    }
    const finish = () => {
      this.setSnapshot({
        ...this.snapshot,
        status: "ended",
        positionMs: this.snapshot.durationMs,
        lastEvent: "finish",
      })
    }

    audio.addEventListener("timeupdate", updateProgress)
    audio.addEventListener("loadedmetadata", updateProgress)
    audio.addEventListener("ended", finish)

    this.cleanupAudio = () => {
      audio.removeEventListener("timeupdate", updateProgress)
      audio.removeEventListener("loadedmetadata", updateProgress)
      audio.removeEventListener("ended", finish)
    }
    this.audio = audio
    this.snapshot = {
      provider: "local",
      status: "idle",
      currentTrack: track,
      positionMs: 0,
      durationMs: track.durationMs ?? 0,
      lastEvent: "ready",
      errorMessage: null,
    }
  }

  private setSnapshot(snapshot: AudioPlaybackState): void {
    this.snapshot = snapshot
    for (const listener of this.listeners) {
      listener()
    }
  }
}
