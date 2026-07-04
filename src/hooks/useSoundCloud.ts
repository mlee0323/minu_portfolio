import { type RefObject, useEffect, useRef, useSyncExternalStore } from "react"
import { SoundCloudTrackUrlError } from "../audio/audioErrors"
import type { AudioPlaybackState, AudioProvider, AudioTrack } from "../audio/types"
import { idlePlaybackState } from "../audio/types"
import {
  isAllowedSoundCloudTrackUrl,
  loadSoundCloudWidgetScript,
  normalizeSoundCloudSound,
  type SoundCloudGlobal,
  type SoundCloudProgressEventData,
  type SoundCloudWidget,
  type SoundCloudWidgetEvents,
} from "../lib/soundcloud"

type SoundCloudHookResult = {
  readonly provider: AudioProvider
  readonly state: AudioPlaybackState
  readonly isReady: boolean
}

class SoundCloudWidgetStore implements AudioProvider {
  readonly kind = "soundcloud"
  private readonly listeners = new Set<() => void>()
  private widget: SoundCloudWidget | null = null
  private events: SoundCloudWidgetEvents | null = null
  private snapshot: AudioPlaybackState = idlePlaybackState
  private pendingTrack: AudioTrack | null = null
  private currentSoundIndex: number | null = null

  constructor(private readonly initialTrack: AudioTrack) {}

  readonly attach = (iframe: HTMLIFrameElement): void => {
    void loadSoundCloudWidgetScript()
      .then((soundCloud) => {
        this.connectWidget(soundCloud, iframe)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "SoundCloud Widget API failed"
        this.setSnapshot({
          ...this.snapshot,
          provider: "soundcloud",
          status: "error",
          currentTrack: this.snapshot.currentTrack ?? this.initialTrack,
          lastEvent: "error",
          errorMessage: message,
        })
      })
  }

  readonly detach = (): void => {
    if (this.widget !== null && this.events !== null) {
      this.widget.unbind(this.events.READY)
      this.widget.unbind(this.events.PLAY)
      this.widget.unbind(this.events.PAUSE)
      this.widget.unbind(this.events.FINISH)
      this.widget.unbind(this.events.PLAY_PROGRESS)
      this.widget.unbind(this.events.LOAD_PROGRESS)
      this.widget.unbind(this.events.SEEK)
      this.widget.unbind(this.events.ERROR)
    }
    this.widget = null
    this.events = null
  }

  async play(track: AudioTrack): Promise<void> {
    if (track.soundCloudUrl === undefined) {
      throw new SoundCloudTrackUrlError(track.id)
    }

    if (!isAllowedSoundCloudTrackUrl(track.soundCloudUrl)) {
      throw new SoundCloudTrackUrlError(track.id, "invalid")
    }

    const shouldLoadTrack = this.snapshot.currentTrack?.id !== track.id
    this.pendingTrack = track
    this.setSnapshot({
      ...this.snapshot,
      provider: "soundcloud",
      status: "loading",
      currentTrack: track,
      positionMs: 0,
      durationMs: track.durationMs ?? 0,
      lastEvent: "ready",
      errorMessage: null,
    })

    const widget = this.widget

    if (widget === null) {
      return
    }

    if (!shouldLoadTrack) {
      widget.play()
      return
    }

    widget.load(track.soundCloudUrl, {
      auto_play: true,
      buying: false,
      sharing: false,
      download: false,
      show_artwork: true,
      show_playcount: false,
      show_user: true,
      single_active: true,
      callback: () => {
        widget.play()
        this.refreshCurrentSound("trackchange")
      },
    })
  }

  pause(): void {
    this.widget?.pause()
    this.setSnapshot({
      ...this.snapshot,
      status: this.snapshot.currentTrack === null ? "idle" : "paused",
      lastEvent: "pause",
    })
  }

  getSnapshot = (): AudioPlaybackState => this.snapshot

  getServerSnapshot = (): AudioPlaybackState => idlePlaybackState

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  private connectWidget(soundCloud: SoundCloudGlobal, iframe: HTMLIFrameElement): void {
    this.events = soundCloud.Widget.Events
    this.widget = soundCloud.Widget(iframe)
    this.bindWidgetEvents(this.widget, this.events)
  }

  private bindWidgetEvents(widget: SoundCloudWidget, events: SoundCloudWidgetEvents): void {
    widget.bind(events.READY, () => {
      this.refreshCurrentSound("ready")
      const pendingTrack = this.pendingTrack
      if (pendingTrack !== null) {
        void this.play(pendingTrack)
      }
    })
    widget.bind(events.PLAY, () => {
      this.refreshCurrentSound("play")
    })
    widget.bind(events.PAUSE, () => {
      this.setSnapshot({
        ...this.snapshot,
        status: this.snapshot.currentTrack === null ? "idle" : "paused",
        lastEvent: "pause",
      })
    })
    widget.bind(events.FINISH, () => {
      this.setSnapshot({
        ...this.snapshot,
        status: "ended",
        positionMs: this.snapshot.durationMs,
        lastEvent: "finish",
      })
    })
    widget.bind(events.PLAY_PROGRESS, (eventData) => {
      this.updateProgress(eventData)
    })
    widget.bind(events.LOAD_PROGRESS, (eventData) => {
      this.updateProgress(eventData)
    })
    widget.bind(events.SEEK, (eventData) => {
      this.updateProgress(eventData)
    })
    widget.bind(events.ERROR, () => {
      this.setSnapshot({
        ...this.snapshot,
        status: "error",
        lastEvent: "error",
        errorMessage: "SoundCloud reported a widget error",
      })
    })
  }

  private updateProgress(eventData?: SoundCloudProgressEventData): void {
    const currentPosition = eventData?.currentPosition ?? this.snapshot.positionMs
    this.setSnapshot({
      ...this.snapshot,
      positionMs: Math.round(currentPosition),
      status: this.snapshot.status === "loading" ? "playing" : this.snapshot.status,
      lastEvent: "progress",
    })
  }

  private refreshCurrentSound(eventName: AudioPlaybackState["lastEvent"]): void {
    const widget = this.widget

    if (widget === null) {
      return
    }

    widget.getCurrentSound((sound) => {
      widget.getCurrentSoundIndex((index) => {
        widget.getDuration((durationMs) => {
          const fallback = this.pendingTrack ?? this.snapshot.currentTrack ?? this.initialTrack
          const currentTrack = normalizeSoundCloudSound(sound, fallback)
          const changedTrack = this.currentSoundIndex !== null && this.currentSoundIndex !== index
          const status =
            eventName === "play" || eventName === "trackchange" ? "playing" : this.snapshot.status
          this.currentSoundIndex = index
          this.setSnapshot({
            ...this.snapshot,
            provider: "soundcloud",
            status,
            currentTrack,
            durationMs,
            lastEvent: changedTrack ? "trackchange" : eventName,
            errorMessage: null,
          })
        })
      })
    })
  }

  private setSnapshot(snapshot: AudioPlaybackState): void {
    this.snapshot = snapshot
    for (const listener of this.listeners) {
      listener()
    }
  }
}

export function useSoundCloud(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  initialTrack: AudioTrack,
): SoundCloudHookResult {
  const storeRef = useRef<SoundCloudWidgetStore | null>(null)
  let store = storeRef.current

  if (store === null) {
    store = new SoundCloudWidgetStore(initialTrack)
    storeRef.current = store
  }

  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)

  useEffect(() => {
    const iframe = iframeRef.current

    if (iframe === null) {
      return
    }

    store.attach(iframe)

    return () => {
      store.detach()
    }
  }, [iframeRef, store])

  return {
    provider: store,
    state,
    isReady: state.status !== "idle" && state.status !== "error",
  }
}
