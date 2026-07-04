import { AudioManager } from "./audioManager"
import type { AudioPlaybackState, AudioProvider, AudioProviderKind, AudioTrack } from "./types"
import { idlePlaybackState } from "./types"

const localTrack: AudioTrack = {
  id: "local-test",
  title: "Local Test",
  artist: "Test Artist",
  provider: "local",
  artworkUrl: "/artwork/local.png",
  localAudioUrl: "/audio/local.mp3",
}

const soundCloudTrack: AudioTrack = {
  id: "soundcloud-test",
  title: "SoundCloud Test",
  artist: "Test Artist",
  provider: "soundcloud",
  artworkUrl: "/artwork/soundcloud.png",
  soundCloudUrl: "https://soundcloud.com/example/test",
}

class TestProvider implements AudioProvider {
  private readonly listeners = new Set<() => void>()
  private snapshot: AudioPlaybackState = idlePlaybackState
  readonly pause = vi.fn(() => {
    this.snapshot = {
      ...this.snapshot,
      status: this.snapshot.currentTrack === null ? "idle" : "paused",
      lastEvent: "pause",
    }
    this.emit()
  })

  constructor(readonly kind: AudioProviderKind) {}

  readonly play = vi.fn(async (track: AudioTrack) => {
    this.snapshot = {
      provider: this.kind,
      status: "playing",
      currentTrack: track,
      positionMs: 0,
      durationMs: track.durationMs ?? 0,
      lastEvent: "play",
      errorMessage: null,
    }
    this.emit()
  })

  getSnapshot = (): AudioPlaybackState => this.snapshot

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

describe("AudioManager", () => {
  it("pauses the active provider before starting a different provider", async () => {
    const manager = new AudioManager()
    const localProvider = new TestProvider("local")
    const soundCloudProvider = new TestProvider("soundcloud")

    manager.register(localProvider)
    manager.register(soundCloudProvider)

    await manager.play({ provider: "local", track: localTrack })
    await manager.play({ provider: "soundcloud", track: soundCloudTrack })

    expect(localProvider.pause).toHaveBeenCalledTimes(1)
    expect(soundCloudProvider.play).toHaveBeenCalledWith(soundCloudTrack)
    expect(manager.getSnapshot()).toMatchObject({
      provider: "soundcloud",
      status: "playing",
      currentTrack: soundCloudTrack,
    })
  })
})
