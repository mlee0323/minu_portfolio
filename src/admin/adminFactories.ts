import {
  createDefaultImageLayout,
  createDefaultTextLayout,
  createDefaultWorkCanvas,
} from "./adminCanvas"
import type {
  AdminArchiveImage,
  AdminArchiveRelease,
  AdminArchiveTrack,
  AdminAudioTrack,
  AdminContactLink,
  AdminIndexItem,
  AdminWork,
  AdminWorkImage,
  AdminWorkTextElement,
} from "./adminTypes"

export function createAdminId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now().toString(36)}`
}

export function createBlankAudioTrack(title: string): AdminAudioTrack {
  return {
    id: createAdminId("audio"),
    title,
    artist: "Minu",
    provider: "local",
    artworkUrl: "",
    durationMs: 0,
    localAudioUrl: "",
    soundCloudUrl: "",
    soundCloudPlaylistUrl: "",
    playlistIndex: null,
    visibility: "public",
    description: "",
  }
}

export function createBlankWork(sortOrder: number): AdminWork {
  const title = "Untitled Work"

  return {
    id: createAdminId("work"),
    title,
    artist: "Minu",
    year: "",
    medium: "",
    location: "",
    caption: "",
    status: "draft",
    isEntry: false,
    sortOrder,
    canvas: createDefaultWorkCanvas(),
    audio: createBlankAudioTrack(title),
    images: [],
    textElements: [],
  }
}

export function createBlankWorkImage(sortOrder: number): AdminWorkImage {
  const width = 1200
  const height = 800
  const scale = "medium"
  const align = "center"

  return {
    id: createAdminId("image"),
    src: "/images/works/eye-stroll-telescope.jpg",
    alt: "Installation image",
    width,
    height,
    aspectRatio: `${width} / ${height}`,
    objectPosition: "center",
    align,
    scale,
    sortOrder,
    layout: createDefaultImageLayout({ align, height, scale, sortOrder, width }),
  }
}

export function createWorkImageFromAsset({
  alt,
  height,
  sortOrder,
  src,
  width,
}: {
  readonly alt: string
  readonly height: number
  readonly sortOrder: number
  readonly src: string
  readonly width: number
}): AdminWorkImage {
  const scale = "medium"
  const align = "center"

  return {
    id: createAdminId("image"),
    src,
    alt,
    width,
    height,
    aspectRatio: `${width} / ${height}`,
    objectPosition: "center",
    align,
    scale,
    sortOrder,
    layout: createDefaultImageLayout({ align, height, scale, sortOrder, width }),
  }
}

export function createBlankWorkTextElement(sortOrder: number): AdminWorkTextElement {
  return {
    id: createAdminId("text"),
    text: "New text",
    fontSize: 34,
    fontWeight: "bold",
    lineHeight: 1.05,
    textAlign: "left",
    color: "#f5f5f5",
    sortOrder,
    layout: createDefaultTextLayout(sortOrder),
  }
}

export function createBlankArchiveTrack(sortOrder: number): AdminArchiveTrack {
  return {
    id: createAdminId("archive-track"),
    title: "Untitled Track",
    artist: "Minu",
    artworkUrl: "/images/works/eye-stroll-telescope.jpg",
    durationMs: 0,
    soundCloudUrl: "",
    soundCloudPlaylistUrl: "",
    playlistIndex: null,
    trackNumber: sortOrder + 1,
    visibility: "public",
    description: "",
    sortOrder,
  }
}

export function createArchiveImageFromAsset({
  alt,
  height,
  sortOrder,
  src,
  width,
}: {
  readonly alt: string
  readonly height: number
  readonly sortOrder: number
  readonly src: string
  readonly width: number
}): AdminArchiveImage {
  return {
    id: createAdminId("archive-image"),
    src,
    alt,
    width,
    height,
    aspectRatio: `${width} / ${height}`,
    objectPosition: "center",
    sortOrder,
  }
}

export function createBlankArchiveRelease(sortOrder: number): AdminArchiveRelease {
  return {
    id: createAdminId("release"),
    title: "Untitled Release",
    artist: "Minu",
    type: "album",
    provider: "soundcloud",
    artworkUrl: "/images/works/eye-stroll-telescope.jpg",
    year: "",
    soundCloudPlaylistUrl: "",
    visibility: "public",
    description: "",
    status: "draft",
    sortOrder,
    images: [],
    tracks: [createBlankArchiveTrack(0)],
  }
}

export function createBlankIndexItem(sortOrder: number): AdminIndexItem {
  return {
    id: createAdminId("index"),
    year: new Date().getFullYear().toString(),
    title: "Untitled project",
    role: "sound direction",
    status: "draft",
    sortOrder,
  }
}

export function createBlankContactLink(sortOrder: number): AdminContactLink {
  return {
    id: createAdminId("contact"),
    label: "link",
    href: "https://",
    sortOrder,
  }
}
