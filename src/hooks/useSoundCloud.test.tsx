import { act, render, screen, waitFor } from "@testing-library/react"
import { useEffect, useRef } from "react"
import type { AudioProvider, AudioTrack } from "../audio/types"
import type {
  SoundCloudGlobal,
  SoundCloudLoadOptions,
  SoundCloudProgressEventData,
  SoundCloudWidget,
  SoundCloudWidgetEvents,
  SoundCloudWidgetFactory,
  SoundCloudWidgetListener,
} from "../lib/soundcloud"
import { useSoundCloud } from "./useSoundCloud"

const widgetEvents: SoundCloudWidgetEvents = {
  READY: "ready",
  PLAY: "play",
  PAUSE: "pause",
  FINISH: "finish",
  PLAY_PROGRESS: "play_progress",
  LOAD_PROGRESS: "load_progress",
  SEEK: "seek",
  ERROR: "error",
}

const initialTrack: AudioTrack = {
  id: "archive-initial",
  title: "Initial Track",
  artist: "Initial Artist",
  provider: "soundcloud",
  artworkUrl: "https://example.com/initial.jpg",
  durationMs: 1000,
  soundCloudUrl: "https://soundcloud.com/example/initial",
}

const nextTrack: AudioTrack = {
  id: "archive-next",
  title: "Next Track",
  artist: "Next Artist",
  provider: "soundcloud",
  artworkUrl: "https://example.com/next.jpg",
  durationMs: 2000,
  soundCloudUrl: "https://soundcloud.com/example/next",
}

const playlistTrack: AudioTrack = {
  id: "archive-playlist-track",
  title: "Playlist Track",
  artist: "Playlist Artist",
  provider: "soundcloud",
  artworkUrl: "https://example.com/playlist.jpg",
  durationMs: 3000,
  soundCloudUrl: "https://soundcloud.com/example/playlist-track",
  soundCloudPlaylistUrl: "https://soundcloud.com/example/sets/release",
  playlistIndex: 3,
  releaseId: "release-example",
  releaseTitle: "Release Example",
  trackNumber: 4,
}

type WidgetLoadCall = {
  readonly url: string
  readonly options?: SoundCloudLoadOptions
}

class FakeSoundCloudWidget implements SoundCloudWidget {
  readonly loadCalls: WidgetLoadCall[] = []
  playCalls = 0
  private readonly listeners = new Map<string, SoundCloudWidgetListener[]>()
  private readonly soundsByUrl = new Map<string, unknown>()
  private currentSound: unknown = {
    id: 7,
    title: "Initial Widget Title",
    permalink_url: initialTrack.soundCloudUrl,
    artwork_url: initialTrack.artworkUrl,
    duration: 1000,
    user: {
      username: "Initial Widget Artist",
    },
  }
  private currentIndex = 0
  private durationMs = 1000
  private positionMs = 0

  bind(eventName: string, listener: SoundCloudWidgetListener): void {
    const listeners = this.listeners.get(eventName)

    if (listeners === undefined) {
      this.listeners.set(eventName, [listener])
      return
    }

    listeners.push(listener)
  }

  unbind(eventName: string): void {
    this.listeners.delete(eventName)
  }

  load(url: string, options?: SoundCloudLoadOptions): void {
    this.loadCalls.push(options === undefined ? { url } : { url, options })
    this.currentIndex = options?.start_track ?? this.currentIndex + 1
    this.currentSound = this.soundsByUrl.get(url) ?? this.currentSound
    if (url === nextTrack.soundCloudUrl) {
      this.durationMs = 2000
    }
    if (url === playlistTrack.soundCloudPlaylistUrl) {
      this.durationMs = 3000
    }
    options?.callback?.()
  }

  play(): void {
    this.playCalls += 1
    this.emit(widgetEvents.PLAY)
  }

  pause(): void {
    this.emit(widgetEvents.PAUSE)
  }

  next(): void {
    this.currentIndex += 1
  }

  prev(): void {
    this.currentIndex = Math.max(this.currentIndex - 1, 0)
  }

  skip(soundIndex: number): void {
    this.currentIndex = soundIndex
  }

  getSounds(callback: (sounds: readonly unknown[]) => void): void {
    callback([])
  }

  getDuration(callback: (durationMs: number) => void): void {
    callback(this.durationMs)
  }

  getPosition(callback: (positionMs: number) => void): void {
    callback(this.positionMs)
  }

  getCurrentSound(callback: (sound: unknown) => void): void {
    callback(this.currentSound)
  }

  getCurrentSoundIndex(callback: (index: number) => void): void {
    callback(this.currentIndex)
  }

  setSoundForUrl(url: string, sound: unknown): void {
    this.soundsByUrl.set(url, sound)
  }

  emit(eventName: string, eventData?: SoundCloudProgressEventData): void {
    if (eventData?.currentPosition !== undefined) {
      this.positionMs = eventData.currentPosition
    }

    for (const listener of this.listeners.get(eventName) ?? []) {
      listener(eventData)
    }
  }
}

function installSoundCloudGlobal(widget: FakeSoundCloudWidget): void {
  const factory: SoundCloudWidgetFactory = Object.assign(
    (_iframe: HTMLIFrameElement | string) => widget,
    { Events: widgetEvents },
  )
  const soundCloud: SoundCloudGlobal = {
    Widget: factory,
  }

  window.SC = soundCloud
}

function getProvider(provider: AudioProvider | null): AudioProvider {
  if (provider === null) {
    throw new Error("SoundCloud provider was not exposed")
  }

  return provider
}

type HarnessProps = {
  readonly exposeProvider: (provider: AudioProvider) => void
}

function Harness({ exposeProvider }: HarnessProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const { provider, state } = useSoundCloud(iframeRef, initialTrack)

  useEffect(() => {
    exposeProvider(provider)
  }, [exposeProvider, provider])

  return (
    <div>
      <iframe ref={iframeRef} title="SoundCloud Test Widget" />
      <span data-testid="title">{state.currentTrack?.title ?? "none"}</span>
      <span data-testid="status">{state.status}</span>
      <span data-testid="event">{state.lastEvent}</span>
      <span data-testid="position">{state.positionMs}</span>
    </div>
  )
}

describe("useSoundCloud", () => {
  afterEach(() => {
    delete window.SC
  })

  it("syncs Widget events and derives track changes from sound index changes", async () => {
    const widget = new FakeSoundCloudWidget()
    let provider: AudioProvider | null = null

    widget.setSoundForUrl(nextTrack.soundCloudUrl ?? "", {
      id: 99,
      title: "Next Widget Title",
      permalink_url: nextTrack.soundCloudUrl,
      artwork_url: nextTrack.artworkUrl,
      duration: 2000,
      user: {
        username: "Next Widget Artist",
      },
    })
    installSoundCloudGlobal(widget)
    render(
      <Harness
        exposeProvider={(nextProvider) => {
          provider = nextProvider
        }}
      />,
    )

    await waitFor(() => expect(provider).not.toBeNull())

    act(() => {
      widget.emit(widgetEvents.READY)
    })

    await waitFor(() => {
      expect(screen.getByTestId("title")).toHaveTextContent("Initial Widget Title")
    })

    await act(async () => {
      await getProvider(provider).play(nextTrack)
    })

    expect(widget.loadCalls).toEqual([
      expect.objectContaining({
        url: nextTrack.soundCloudUrl,
      }),
    ])
    expect(widget.playCalls).toBeGreaterThan(0)
    await waitFor(() => {
      expect(screen.getByTestId("title")).toHaveTextContent("Next Widget Title")
      expect(screen.getByTestId("status")).toHaveTextContent("playing")
      expect(screen.getByTestId("event")).toHaveTextContent("trackchange")
    })

    act(() => {
      widget.emit(widgetEvents.PLAY_PROGRESS, { currentPosition: 1250 })
    })

    await waitFor(() => {
      expect(screen.getByTestId("position")).toHaveTextContent("1250")
      expect(screen.getByTestId("event")).toHaveTextContent("progress")
    })

    act(() => {
      widget.emit(widgetEvents.PAUSE)
    })

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("paused")
    })

    act(() => {
      widget.emit(widgetEvents.FINISH)
    })

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("ended")
    })
  })

  it("loads playlist-backed tracks with a SoundCloud start_track index", async () => {
    const widget = new FakeSoundCloudWidget()
    let provider: AudioProvider | null = null

    widget.setSoundForUrl(playlistTrack.soundCloudPlaylistUrl ?? "", {
      id: 303,
      title: "Playlist Widget Title",
      permalink_url: playlistTrack.soundCloudUrl,
      artwork_url: playlistTrack.artworkUrl,
      duration: 3000,
      user: {
        username: "Playlist Widget Artist",
      },
    })
    installSoundCloudGlobal(widget)
    render(
      <Harness
        exposeProvider={(nextProvider) => {
          provider = nextProvider
        }}
      />,
    )

    await waitFor(() => expect(provider).not.toBeNull())

    await act(async () => {
      await getProvider(provider).play(playlistTrack)
    })

    expect(widget.loadCalls).toEqual([
      expect.objectContaining({
        url: playlistTrack.soundCloudPlaylistUrl,
        options: expect.objectContaining({
          start_track: playlistTrack.playlistIndex,
        }),
      }),
    ])
    await waitFor(() => {
      expect(screen.getByTestId("title")).toHaveTextContent("Playlist Widget Title")
      expect(screen.getByTestId("status")).toHaveTextContent("playing")
    })
  })
})
