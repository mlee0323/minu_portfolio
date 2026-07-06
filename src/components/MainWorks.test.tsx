import { act, render, screen, waitFor, within } from "@testing-library/react"
import { useEffect } from "react"
import { AudioManagerProvider, useAudioManager } from "../audio/AudioManagerProvider"
import type {
  AudioPlaybackState,
  AudioProvider,
  AudioProviderKind,
  AudioTrack,
} from "../audio/types"
import { idlePlaybackState } from "../audio/types"
import { localTracks } from "../data/localTracks"
import { MainWorks } from "./MainWorks"

let observerCallback: IntersectionObserverCallback | null = null
let latestObserver: IntersectionObserver | null = null

class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ""
  readonly thresholds: readonly number[] = [0]
  readonly observe = vi.fn()
  readonly unobserve = vi.fn()
  readonly disconnect = vi.fn()
  readonly takeRecords = vi.fn((): IntersectionObserverEntry[] => [])

  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback
    latestObserver = this
  }
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

function createEntry(target: Element): IntersectionObserverEntry {
  const rect = target.getBoundingClientRect()

  return {
    boundingClientRect: rect,
    intersectionRatio: 1,
    intersectionRect: rect,
    isIntersecting: true,
    rootBounds: null,
    target,
    time: 0,
  }
}

function getObserverCallback(): IntersectionObserverCallback {
  if (observerCallback === null) {
    throw new Error("IntersectionObserver callback was not registered")
  }

  return observerCallback
}

function getLatestObserver(): IntersectionObserver {
  if (latestObserver === null) {
    throw new Error("IntersectionObserver was not created")
  }

  return latestObserver
}

function getRequiredLocalTrack(): AudioTrack {
  const track = localTracks[0]

  if (track === undefined) {
    throw new Error("Expected at least one local track for the Works test")
  }

  return track
}

function getRequiredFigure(label: RegExp): HTMLElement {
  const figure = screen.getByRole("img", { name: label }).closest("figure")

  if (figure === null) {
    throw new Error(`Could not find work figure for ${label.source}`)
  }

  return figure
}

function getCurrentWorkPanel(): HTMLElement {
  const panel = screen.getByText("Current Work").closest("aside")

  if (panel === null) {
    throw new Error("Could not find Current Work panel")
  }

  return panel
}

function LocalProviderHarness({ provider }: { readonly provider: TestProvider }) {
  const manager = useAudioManager()

  useEffect(() => {
    const unregister = manager.register(provider)
    void manager.play({ provider: "local", track: getRequiredLocalTrack() })

    return unregister
  }, [manager, provider])

  return null
}

function renderMainWorks(provider: TestProvider) {
  render(
    <AudioManagerProvider>
      <LocalProviderHarness provider={provider} />
      <MainWorks experienceStarted />
    </AudioManagerProvider>,
  )
}

describe("MainWorks", () => {
  afterEach(() => {
    observerCallback = null
    latestObserver = null
    vi.unstubAllGlobals()
  })

  it("keeps the entry audio fixed when scrolling to another work", async () => {
    vi.stubGlobal("IntersectionObserver", TestIntersectionObserver)
    const provider = new TestProvider("local")

    renderMainWorks(provider)

    await waitFor(() => {
      expect(provider.play).toHaveBeenCalledTimes(1)
    })

    const nextWorkFigure = getRequiredFigure(/Two triangular lamp forms/)
    act(() => {
      getObserverCallback()([createEntry(nextWorkFigure)], getLatestObserver())
    })

    expect(within(getCurrentWorkPanel()).getByText("Lamp Shadow Study")).toBeInTheDocument()
    expect(provider.play).toHaveBeenCalledTimes(1)
  })
})
