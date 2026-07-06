import type { AudioTrack } from "../audio/types"

export const localTracks = [
  {
    id: "local-hero-field",
    title: "An Eye Stroll",
    artist: "Minu",
    provider: "local",
    artworkUrl: "/images/works/eye-stroll-telescope.jpg",
    durationMs: 12000,
    localAudioUrl: "/audio/field-notes.wav",
    description: "A low-frequency room tone used as the intro and hero sound bed.",
  },
  {
    id: "local-main-works-signal",
    title: "Lamp Shadow Study",
    artist: "Minu",
    provider: "local",
    artworkUrl: "/images/works/eye-stroll-lamps-01.jpg",
    durationMs: 14000,
    localAudioUrl: "/audio/signal-room.wav",
    description: "Short loop for an installation space where sound reacts to distance.",
  },
  {
    id: "local-main-works-threshold",
    title: "Viewing Aperture",
    artist: "Minu",
    provider: "local",
    artworkUrl: "/images/works/eye-stroll-eye-close.jpg",
    durationMs: 12000,
    localAudioUrl: "/audio/field-notes.wav",
    description: "A suspended tone for the moment before entering the lit field.",
  },
  {
    id: "local-main-works-afterimage",
    title: "Object Room",
    artist: "Minu",
    provider: "local",
    artworkUrl: "/images/works/eye-stroll-camera-installation.jpg",
    durationMs: 14000,
    localAudioUrl: "/audio/signal-room.wav",
    description: "Residual harmonics arranged for visitors moving across a corridor.",
  },
] satisfies readonly AudioTrack[]
