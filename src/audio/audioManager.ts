import { AudioProviderUnavailableError } from "./audioErrors"
import type {
  AudioPlaybackState,
  AudioPlayRequest,
  AudioProvider,
  AudioProviderKind,
} from "./types"
import { idlePlaybackState } from "./types"

type RegisteredProvider = {
  readonly provider: AudioProvider
  readonly unsubscribe: () => void
}

export class AudioManager {
  private readonly providers = new Map<AudioProviderKind, RegisteredProvider>()
  private readonly listeners = new Set<() => void>()
  private activeProvider: AudioProviderKind | null = null

  readonly register = (provider: AudioProvider): (() => void) => {
    const previous = this.providers.get(provider.kind)
    previous?.unsubscribe()

    const unsubscribe = provider.subscribe(() => {
      this.emit()
    })

    this.providers.set(provider.kind, { provider, unsubscribe })
    this.emit()

    return () => {
      const current = this.providers.get(provider.kind)
      if (current?.provider === provider) {
        current.unsubscribe()
        this.providers.delete(provider.kind)
        if (this.activeProvider === provider.kind) {
          this.activeProvider = null
        }
        this.emit()
      }
    }
  }

  readonly play = async (request: AudioPlayRequest): Promise<void> => {
    const nextProvider = this.providers.get(request.provider)?.provider

    if (nextProvider === undefined) {
      throw new AudioProviderUnavailableError(request.provider)
    }

    if (this.activeProvider !== null && this.activeProvider !== request.provider) {
      this.providers.get(this.activeProvider)?.provider.pause()
    }

    this.activeProvider = request.provider
    this.emit()
    await nextProvider.play(request.track)
    this.emit()
  }

  readonly pauseActive = (): void => {
    if (this.activeProvider === null) {
      return
    }

    this.providers.get(this.activeProvider)?.provider.pause()
    this.emit()
  }

  readonly getSnapshot = (): AudioPlaybackState => {
    if (this.activeProvider === null) {
      return idlePlaybackState
    }

    return this.providers.get(this.activeProvider)?.provider.getSnapshot() ?? idlePlaybackState
  }

  readonly getServerSnapshot = (): AudioPlaybackState => idlePlaybackState

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
