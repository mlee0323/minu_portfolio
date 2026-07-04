import type { AudioTrack } from "../audio/types"
import { localTracks } from "./localTracks"

export type MainWork = {
  readonly id: string
  readonly track: AudioTrack
  readonly year: string
  readonly medium: string
  readonly location: string
  readonly caption: string
}

export type IndexItem = {
  readonly year: string
  readonly title: string
  readonly role: string
}

export type ContactLink = {
  readonly label: string
  readonly href: string
}

class SiteContentDataError extends Error {
  readonly name = "SiteContentDataError"

  constructor(readonly trackIndex: number) {
    super(`Main work track is missing at index: ${trackIndex}`)
  }
}

function getLocalTrack(trackIndex: number): AudioTrack {
  const track = localTracks[trackIndex]

  if (track === undefined) {
    throw new SiteContentDataError(trackIndex)
  }

  return track
}

export const introContent = {
  prompt: "Tap to start",
  label: "listening opens before the image",
  delayMs: 2400,
} as const

export const navItems = [
  { label: "Works", href: "#main-works" },
  { label: "Archive", href: "#archive" },
  { label: "Index", href: "#index" },
] as const

export const heroContent = {
  kicker: "Headphones recommended",
  statement: "space is scored before it is seen.",
  body: "A portfolio for spatial music, installation sound, and production work that treats listening as the first room of the exhibition.",
  posterUrl: "https://picsum.photos/seed/minu-spatial-sound-hero/1200/1600",
  videoUrl: "/video/space-sound-loop.mp4",
} as const

export const mainWorks: readonly MainWork[] = [
  {
    id: "work-field-study",
    track: getLocalTrack(0),
    year: "2025",
    medium: "installation sound",
    location: "black-box room",
    caption: "A slow sound bed composed for a dark room before the first image appears.",
  },
  {
    id: "work-signal-room",
    track: getLocalTrack(1),
    year: "2025",
    medium: "interactive media",
    location: "motion-responsive corridor",
    caption: "A responsive loop that shifts attention as a visitor crosses the room.",
  },
  {
    id: "work-threshold-study",
    track: getLocalTrack(2),
    year: "2024",
    medium: "spatial composition",
    location: "entry threshold",
    caption: "A suspended tone for the second before the installation becomes visible.",
  },
  {
    id: "work-afterimage-hall",
    track: getLocalTrack(3),
    year: "2024",
    medium: "sound directing",
    location: "projection hall",
    caption: "Residual harmonics designed to remain after the viewer leaves the image.",
  },
] as const

export const mainWorksClosingCaption =
  "이 작업은 전시 공간 안에서 사운드가 공간을 채우는 방식으로 설계되었으며, 본 사이트의 기록은 흔적일 뿐입니다."

export const indexItems: readonly IndexItem[] = [
  {
    year: "2025",
    title: "[전시 프로젝트명]",
    role: "사운드 디렉팅 / 설치작가 콜라보레이션",
  },
  {
    year: "2024",
    title: "[인터랙티브 미디어 프로젝트]",
    role: "전체 공간 사운드 디자인 및 오디오 프로듀싱",
  },
  {
    year: "2024",
    title: "site-specific audio study",
    role: "composition / field recording / mix",
  },
] as const

export const contactLinks: readonly ContactLink[] = [
  { label: "hello@minu.audio", href: "mailto:hello@minu.audio" },
  { label: "instagram", href: "https://www.instagram.com/" },
] as const
