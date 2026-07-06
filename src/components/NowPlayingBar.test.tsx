import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useEffect } from "react"
import { AudioManagerProvider, useAudioManager } from "../audio/AudioManagerProvider"
import type {
  AudioPlaybackState,
  AudioProvider,
  AudioProviderKind,
  AudioTrack,
} from "../audio/types"
import { idlePlaybackState } from "../audio/types"
import { NowPlayingBar } from "./NowPlayingBar"

const localTrack: AudioTrack = {
  id: "local-now-playing-test",
  title: "Threshold Study",
  artist: "Minu",
  provider: "local",
  artworkUrl: "/images/works/eye-stroll-detail.jpg",
  localAudioUrl: "/audio/threshold-study.mp3",
  durationMs: 12_000,
}

class TestProvider implements AudioProvider {
  private readonly listeners = new Set<() => void>()
  private snapshot: AudioPlaybackState = idlePlaybackState

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

  readonly pause = vi.fn(() => {
    this.snapshot = {
      ...this.snapshot,
      status: this.snapshot.currentTrack === null ? "idle" : "paused",
      lastEvent: "pause",
    }
    this.emit()
  })

  readonly getSnapshot = (): AudioPlaybackState => this.snapshot

  readonly subscribe = (listener: () => void): (() => void) => {
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

function NowPlayingHarness({ provider }: { readonly provider: TestProvider }) {
  const manager = useAudioManager()

  useEffect(() => {
    const unregister = manager.register(provider)
    void manager.play({ provider: "local", track: localTrack })

    return unregister
  }, [manager, provider])

  return <NowPlayingBar />
}

function renderNowPlayingBar(provider: TestProvider) {
  render(
    <AudioManagerProvider>
      <NowPlayingHarness provider={provider} />
    </AudioManagerProvider>,
  )
}

describe("NowPlayingBar", () => {
  it("resumes the current track after the bar pauses it", async () => {
    const provider = new TestProvider("local")

    renderNowPlayingBar(provider)

    const pauseButton = await screen.findByRole("button", {
      name: "Pause active audio source",
    })

    fireEvent.click(pauseButton)
    expect(provider.pause).toHaveBeenCalledTimes(1)

    const playButton = await screen.findByRole("button", {
      name: "Play current audio source",
    })

    fireEvent.click(playButton)

    await waitFor(() => {
      expect(provider.play).toHaveBeenCalledTimes(2)
    })
    expect(await screen.findByRole("button", { name: "Pause active audio source" })).toBeEnabled()
  })

  it("toggles playback with the Space key without checking audible output", async () => {
    const provider = new TestProvider("local")

    renderNowPlayingBar(provider)

    await screen.findByRole("button", { name: "Pause active audio source" })

    fireEvent.keyDown(window, { code: "Space", key: " " })

    await waitFor(() => {
      expect(provider.pause).toHaveBeenCalledTimes(1)
    })
    expect(await screen.findByRole("button", { name: "Play current audio source" })).toBeEnabled()

    fireEvent.keyDown(window, { code: "Space", key: " " })

    await waitFor(() => {
      expect(provider.play).toHaveBeenCalledTimes(2)
    })
  })
})
