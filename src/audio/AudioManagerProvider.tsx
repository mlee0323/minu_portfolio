import { createContext, type ReactNode, useContext, useMemo, useSyncExternalStore } from "react"
import { AudioManager } from "./audioManager"
import type { AudioPlaybackState } from "./types"

const AudioManagerContext = createContext<AudioManager | null>(null)

export function AudioManagerProvider({ children }: { readonly children: ReactNode }) {
  const manager = useMemo(() => new AudioManager(), [])

  return <AudioManagerContext.Provider value={manager}>{children}</AudioManagerContext.Provider>
}

export function useAudioManager(): AudioManager {
  const manager = useContext(AudioManagerContext)

  if (manager === null) {
    throw new Error("useAudioManager must be used inside AudioManagerProvider")
  }

  return manager
}

export function useAudioPlayback(): AudioPlaybackState {
  const manager = useAudioManager()

  return useSyncExternalStore(manager.subscribe, manager.getSnapshot, manager.getServerSnapshot)
}
