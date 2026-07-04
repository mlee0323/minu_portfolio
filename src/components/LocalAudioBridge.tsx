import { useEffect, useRef } from "react"
import { useAudioManager } from "../audio/AudioManagerProvider"
import { LocalAudioProvider } from "../audio/localAudioProvider"

export function LocalAudioBridge() {
  const manager = useAudioManager()
  const providerRef = useRef<LocalAudioProvider | null>(null)

  if (providerRef.current === null) {
    providerRef.current = new LocalAudioProvider()
  }

  useEffect(() => {
    const provider = providerRef.current

    if (provider === null) {
      return
    }

    return manager.register(provider)
  }, [manager])

  return null
}
