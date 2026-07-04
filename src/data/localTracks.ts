import type { AudioTrack } from "../audio/types"

export const localTracks = [
  {
    id: "local-hero-field",
    title: "Field Study",
    artist: "Minu",
    provider: "local",
    artworkUrl: "https://picsum.photos/seed/minu-field-study/960/1280",
    durationMs: 12000,
    localAudioUrl: "/audio/field-notes.wav",
    description: "A low-frequency room tone used as the intro and hero sound bed.",
  },
  {
    id: "local-main-works-signal",
    title: "Signal Room",
    artist: "Minu",
    provider: "local",
    artworkUrl: "https://picsum.photos/seed/minu-signal-room/960/1280",
    durationMs: 14000,
    localAudioUrl: "/audio/signal-room.wav",
    description: "Short loop for an installation space where sound reacts to distance.",
  },
  {
    id: "local-main-works-threshold",
    title: "Threshold Study",
    artist: "Minu",
    provider: "local",
    artworkUrl: "https://picsum.photos/seed/minu-threshold-study/960/1280",
    durationMs: 12000,
    localAudioUrl: "/audio/field-notes.wav",
    description: "A suspended tone for the moment before entering the lit field.",
  },
  {
    id: "local-main-works-afterimage",
    title: "Afterimage Hall",
    artist: "Minu",
    provider: "local",
    artworkUrl: "https://picsum.photos/seed/minu-afterimage-hall/960/1280",
    durationMs: 14000,
    localAudioUrl: "/audio/signal-room.wav",
    description: "Residual harmonics arranged for visitors moving across a corridor.",
  },
] satisfies readonly AudioTrack[]
