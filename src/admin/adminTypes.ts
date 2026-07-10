import type { AudioProviderKind, AudioReleaseType, SoundCloudVisibility } from "../audio/types"
import type { WorkImage } from "../data/siteContent"

export const adminStatusOptions = ["draft", "published"] as const
export const imageAlignOptions = ["left", "center", "right"] as const
export const imageScaleOptions = ["hero", "large", "medium", "small"] as const
export const adminCanvasViewportOptions = ["mobile", "desktop"] as const
export const textAlignOptions = ["left", "center", "right"] as const
export const textWeightOptions = ["light", "regular", "bold", "black"] as const

export type AdminStatus = (typeof adminStatusOptions)[number]
export type ImageAlign = (typeof imageAlignOptions)[number]
export type ImageScale = (typeof imageScaleOptions)[number]
export type AdminCanvasViewport = (typeof adminCanvasViewportOptions)[number]
export type AdminTextAlign = (typeof textAlignOptions)[number]
export type AdminTextWeight = (typeof textWeightOptions)[number]

export type AdminWorkCanvas = {
  readonly height: number
}

export type AdminCanvasRect = {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export type AdminCanvasLayout = AdminCanvasRect

export type AdminAudioTrack = {
  readonly id: string
  readonly title: string
  readonly artist: string
  readonly provider: AudioProviderKind
  readonly artworkUrl: string
  readonly durationMs: number
  readonly localAudioUrl: string
  readonly soundCloudUrl: string
  readonly soundCloudPlaylistUrl: string
  readonly playlistIndex: number | null
  readonly visibility: SoundCloudVisibility
  readonly description: string
}

export type AdminWorkImage = Omit<WorkImage, "align" | "scale"> & {
  readonly align: ImageAlign
  readonly scale: ImageScale
  readonly sortOrder: number
  readonly layout: AdminCanvasLayout
}

export type AdminWorkTextElement = {
  readonly id: string
  readonly text: string
  readonly fontSize: number
  readonly fontWeight: AdminTextWeight
  readonly lineHeight: number
  readonly textAlign: AdminTextAlign
  readonly color: string
  readonly sortOrder: number
  readonly layout: AdminCanvasLayout
}

export type AdminWork = {
  readonly id: string
  readonly title: string
  readonly artist: string
  readonly year: string
  readonly medium: string
  readonly location: string
  readonly caption: string
  readonly status: AdminStatus
  readonly isEntry: boolean
  readonly sortOrder: number
  readonly canvas: AdminWorkCanvas
  readonly audio: AdminAudioTrack
  readonly images: readonly AdminWorkImage[]
  readonly textElements: readonly AdminWorkTextElement[]
}

export type AdminArchiveTrack = {
  readonly id: string
  readonly title: string
  readonly artist: string
  readonly artworkUrl: string
  readonly durationMs: number
  readonly soundCloudUrl: string
  readonly soundCloudPlaylistUrl: string
  readonly playlistIndex: number | null
  readonly trackNumber: number | null
  readonly visibility: SoundCloudVisibility
  readonly description: string
  readonly sortOrder: number
}

export type AdminArchiveRelease = {
  readonly id: string
  readonly title: string
  readonly artist: string
  readonly type: AudioReleaseType
  readonly provider: "soundcloud"
  readonly artworkUrl: string
  readonly year: string
  readonly soundCloudPlaylistUrl: string
  readonly visibility: SoundCloudVisibility
  readonly description: string
  readonly status: AdminStatus
  readonly sortOrder: number
  readonly tracks: readonly AdminArchiveTrack[]
}

export type AdminIndexItem = {
  readonly id: string
  readonly year: string
  readonly title: string
  readonly role: string
  readonly status: AdminStatus
  readonly sortOrder: number
}

export type AdminContactLink = {
  readonly id: string
  readonly label: string
  readonly href: string
  readonly sortOrder: number
}

export type AdminContent = {
  readonly works: readonly AdminWork[]
  readonly archiveReleases: readonly AdminArchiveRelease[]
  readonly indexItems: readonly AdminIndexItem[]
  readonly contactLinks: readonly AdminContactLink[]
}
