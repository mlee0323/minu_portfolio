import type { AudioTrack } from "../audio/types"

export const archiveTracks = [
  {
    id: "archive-flickermood",
    title: "Flickermood",
    artist: "Forss",
    provider: "soundcloud",
    artworkUrl: "https://picsum.photos/seed/archive-flickermood/640/640",
    durationMs: 269000,
    soundCloudUrl: "https://soundcloud.com/forss/flickermood",
    description: "A public SoundCloud track used to exercise Widget playback.",
  },
  {
    id: "archive-electric-relaxation",
    title: "Electric Relaxation",
    artist: "SoundCloud Archive",
    provider: "soundcloud",
    artworkUrl: "https://picsum.photos/seed/archive-electric-relaxation/640/640",
    durationMs: 196000,
    soundCloudUrl: "https://soundcloud.com/dj-jazzy-jeff/electric-relaxation",
    description: "Archive data file entry. Editing this file updates the section.",
  },
  {
    id: "archive-morning-loop",
    title: "Morning Loop",
    artist: "SoundCloud Archive",
    provider: "soundcloud",
    artworkUrl: "https://picsum.photos/seed/archive-morning-loop/640/640",
    durationMs: 241000,
    soundCloudUrl: "https://soundcloud.com/creative-commons/morning-loop",
    description: "Demonstrates track changes through Widget load calls.",
  },
] satisfies readonly AudioTrack[]
