import type { AudioTrack } from "../audio/types"

export const localTracks = [
  {
    id: "local-hero-field",
    title: "Field Notes",
    artist: "Minu",
    provider: "local",
    artworkUrl: "https://picsum.photos/seed/minu-field-notes/640/640",
    durationMs: 12000,
    localAudioUrl: "/audio/field-notes.wav",
    description: "A compact local source used by Hero playback.",
  },
  {
    id: "local-main-works-signal",
    title: "Signal Room",
    artist: "Minu",
    provider: "local",
    artworkUrl: "https://picsum.photos/seed/minu-signal-room/640/640",
    durationMs: 14000,
    localAudioUrl: "/audio/signal-room.wav",
    description: "A Main Works local source sharing the same audio manager.",
  },
] satisfies readonly AudioTrack[]
