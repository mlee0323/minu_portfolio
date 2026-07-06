import type { AudioTrack } from "../audio/types"
import { localTracks } from "./localTracks"

export type MainWork = {
  readonly id: string
  readonly track: AudioTrack
  readonly year: string
  readonly medium: string
  readonly location: string
  readonly caption: string
  readonly images: readonly WorkImage[]
}

export type WorkImage = {
  readonly id: string
  readonly src: string
  readonly alt: string
  readonly width: number
  readonly height: number
  readonly aspectRatio: string
  readonly objectPosition: string
  readonly align: "left" | "center" | "right"
  readonly scale: "hero" | "large" | "medium" | "small"
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
  confirmationLabel: "headphones recommended",
  motionDelayMs: 5000,
  promptDelayMs: 8000,
  confirmationDelayMs: 2400,
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
  posterUrl: "/images/works/eye-stroll-lamps-02.jpg",
  videoUrl: null,
} as const

export const mainWorks: readonly MainWork[] = [
  {
    id: "work-field-study",
    track: getLocalTrack(0),
    year: "2025",
    medium: "size variable / astronomical telescope / mirror / other items",
    location: "installation view",
    caption: "A room where seeing is delayed, redirected, and scored as a listening path.",
    images: [
      {
        id: "eye-stroll-telescope",
        src: "/images/works/eye-stroll-telescope.jpg",
        alt: "An Eye Stroll installation with a telescope facing a small circular wall object",
        width: 1113,
        height: 787,
        aspectRatio: "1113 / 787",
        objectPosition: "center",
        align: "center",
        scale: "hero",
      },
      {
        id: "eye-stroll-room-wide",
        src: "/images/works/eye-stroll-room-wide.jpg",
        alt: "Wide exhibition room with suspended and freestanding installation objects",
        width: 1116,
        height: 498,
        aspectRatio: "1116 / 498",
        objectPosition: "center",
        align: "right",
        scale: "large",
      },
      {
        id: "eye-stroll-viewer",
        src: "/images/works/eye-stroll-viewer.jpg",
        alt: "Viewer looking toward a small eye aperture in a white panel",
        width: 378,
        height: 245,
        aspectRatio: "378 / 245",
        objectPosition: "center",
        align: "left",
        scale: "medium",
      },
    ],
  },
  {
    id: "work-signal-room",
    track: getLocalTrack(1),
    year: "2025",
    medium: "light object / reflected shadow",
    location: "black-box room",
    caption: "Two small lamps and their shadows turn the room into a measured interval.",
    images: [
      {
        id: "eye-stroll-lamps-01",
        src: "/images/works/eye-stroll-lamps-01.jpg",
        alt: "Two triangular lamp forms installed on a rail in a dark room",
        width: 570,
        height: 615,
        aspectRatio: "570 / 615",
        objectPosition: "center",
        align: "left",
        scale: "large",
      },
      {
        id: "eye-stroll-lamps-02",
        src: "/images/works/eye-stroll-lamps-02.jpg",
        alt: "Close view of white and black triangular lamp forms with shadows",
        width: 556,
        height: 752,
        aspectRatio: "556 / 752",
        objectPosition: "center",
        align: "right",
        scale: "medium",
      },
    ],
  },
  {
    id: "work-threshold-study",
    track: getLocalTrack(2),
    year: "2024",
    medium: "aperture / mirror / gaze",
    location: "white panel",
    caption: "A small eye becomes a room-scale signal when the body moves closer.",
    images: [
      {
        id: "eye-stroll-eye-close",
        src: "/images/works/eye-stroll-eye-close.jpg",
        alt: "Close view of an eye seen through a small circular aperture",
        width: 557,
        height: 785,
        aspectRatio: "557 / 785",
        objectPosition: "center",
        align: "center",
        scale: "medium",
      },
      {
        id: "eye-stroll-monitor-room",
        src: "/images/works/eye-stroll-monitor-room.jpg",
        alt: "Dark room with monitor, rail, and projected light",
        width: 556,
        height: 565,
        aspectRatio: "556 / 565",
        objectPosition: "center",
        align: "left",
        scale: "small",
      },
    ],
  },
  {
    id: "work-afterimage-hall",
    track: getLocalTrack(3),
    year: "2024",
    medium: "object / camera / projection",
    location: "installation frame",
    caption: "Objects, lens, and projected shadow hold the afterimage as a spatial score.",
    images: [
      {
        id: "eye-stroll-tower",
        src: "/images/works/eye-stroll-tower.jpg",
        alt: "Tall wooden installation object with a circular shadow form",
        width: 556,
        height: 747,
        aspectRatio: "556 / 747",
        objectPosition: "center",
        align: "center",
        scale: "medium",
      },
      {
        id: "eye-stroll-camera-installation",
        src: "/images/works/eye-stroll-camera-installation.jpg",
        alt: "Camera tripod and framed suspended object installation in a gallery",
        width: 1113,
        height: 558,
        aspectRatio: "1113 / 558",
        objectPosition: "center",
        align: "right",
        scale: "large",
      },
    ],
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
