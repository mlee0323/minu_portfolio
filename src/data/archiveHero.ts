export type ArchiveHeroViewport = "mobile" | "desktop"
export type ArchiveHeroElementKind =
  | "cover"
  | "metadata"
  | "title"
  | "artist"
  | "description"
  | "actions"
  | "image"
  | "text"
export type ArchiveHeroRect = {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}
export type ArchiveHeroStyle = {
  readonly fontSize: number
  readonly fontWeight: number
  readonly lineHeight: number
  readonly textAlign: "left" | "center" | "right"
  readonly color: string
}
export type ArchiveHeroElement = {
  readonly id: string
  readonly kind: ArchiveHeroElementKind
  readonly text: string
  readonly src: string
  readonly alt: string
  readonly layouts: Readonly<Record<ArchiveHeroViewport, ArchiveHeroRect>>
  readonly styles: Readonly<Record<ArchiveHeroViewport, ArchiveHeroStyle>>
}
export type ArchiveHeroDesign = {
  readonly heights: Readonly<Record<ArchiveHeroViewport, number>>
  readonly elements: readonly ArchiveHeroElement[]
}
export type ArchiveHeroRelease = {
  readonly id: string
  readonly title: string
  readonly artist: string
  readonly artworkUrl: string
  readonly type: string
  readonly year?: string
  readonly description?: string
  readonly tracks: readonly unknown[]
}

export const archiveHeroWidths = { mobile: 390, desktop: 1200 } as const
export const archiveHeroLabels: Record<ArchiveHeroElementKind, string> = {
  cover: "Cover image",
  metadata: "Release information",
  title: "Release title",
  artist: "Artist",
  description: "Description",
  actions: "Playback buttons",
  image: "Image",
  text: "Text",
}

export function archiveHeroText(element: ArchiveHeroElement, release: ArchiveHeroRelease): string {
  switch (element.kind) {
    case "title":
      return release.title
    case "artist":
      return release.artist
    case "description":
      return release.description || "No release description yet."
    case "metadata":
      return [release.type, release.year, `${release.tracks.length} tracks`]
        .filter(Boolean)
        .join(" / ")
    default:
      return element.text
  }
}

function style(fontSize: number, overrides: Partial<ArchiveHeroStyle> = {}): ArchiveHeroStyle {
  return {
    fontSize,
    fontWeight: 430,
    lineHeight: 1.15,
    textAlign: "left",
    color: "#f5f5f5",
    ...overrides,
  }
}

export function createArchiveHeroElement(
  kind: ArchiveHeroElementKind,
  id: string,
): ArchiveHeroElement {
  return {
    id,
    kind,
    text: kind === "text" ? "New text" : "",
    src: "",
    alt: "Image",
    layouts: {
      mobile: { x: 20, y: 450, width: 300, height: kind === "image" ? 200 : 80 },
      desktop: { x: 580, y: 100, width: 450, height: kind === "image" ? 300 : 100 },
    },
    styles: { mobile: style(24), desktop: style(36) },
  }
}

export function createDefaultArchiveHero(release: ArchiveHeroRelease): ArchiveHeroDesign {
  const description = release.description || "No release description yet."
  const mobileTitleHeight = Math.max(130, Math.ceil(release.title.length / 9) * 81)
  const desktopTitleHeight = Math.max(130, Math.ceil(release.title.length / 11) * 127)
  const mobileDescriptionHeight = Math.max(130, Math.ceil(description.length / 34) * 22)
  const desktopDescriptionHeight = Math.max(95, Math.ceil(description.length / 52) * 24)
  const mobileTextOffset = mobileTitleHeight - 130
  const desktopTextOffset = desktopTitleHeight - 130
  const mobileActionsY = 622 + mobileTextOffset + mobileDescriptionHeight + 34
  const desktopActionsY = 412 + desktopTextOffset + desktopDescriptionHeight + 33
  const kinds = ["cover", "metadata", "title", "artist", "description", "actions"] as const
  const mobile: ArchiveHeroRect[] = [
    { x: 20, y: 0, width: 350, height: 350 },
    { x: 20, y: 382, width: 350, height: 28 },
    { x: 20, y: 424, width: 350, height: mobileTitleHeight },
    { x: 20, y: 564 + mobileTextOffset, width: 350, height: 30 },
    { x: 20, y: 622 + mobileTextOffset, width: 350, height: mobileDescriptionHeight },
    { x: 20, y: mobileActionsY, width: 350, height: 100 },
  ]
  const desktop: ArchiveHeroRect[] = [
    { x: 0, y: 0, width: 480, height: 480 },
    { x: 590, y: 168, width: 610, height: 28 },
    { x: 590, y: 212, width: 610, height: desktopTitleHeight },
    { x: 590, y: 354 + desktopTextOffset, width: 610, height: 32 },
    { x: 590, y: 412 + desktopTextOffset, width: 610, height: desktopDescriptionHeight },
    { x: 590, y: desktopActionsY, width: 610, height: 60 },
  ]
  const sizes = { mobile: [16, 12, 70, 16, 18, 14], desktop: [16, 14, 110, 18, 20, 16] }
  return {
    heights: {
      mobile: Math.min(2800, Math.max(900, mobileActionsY + 114)),
      desktop: Math.min(2800, Math.max(610, desktopActionsY + 70)),
    },
    elements: kinds.map((kind, index) => {
      const mobileRect = mobile[index]
      const desktopRect = desktop[index]
      const mobileSize = sizes.mobile[index]
      const desktopSize = sizes.desktop[index]
      if (!mobileRect || !desktopRect || mobileSize === undefined || desktopSize === undefined)
        throw new Error("Missing header default")
      return {
        ...createArchiveHeroElement(kind, `${release.id}-hero-${kind}`),
        layouts: { mobile: mobileRect, desktop: desktopRect },
        styles: {
          mobile: style(
            mobileSize,
            kind === "metadata" ? { fontWeight: 760, color: "#a0a09c" } : {},
          ),
          desktop: style(
            desktopSize,
            kind === "metadata" ? { fontWeight: 760, color: "#a0a09c" } : {},
          ),
        },
      }
    }),
  }
}

export function clampArchiveHeroRect(
  rect: ArchiveHeroRect,
  width: number,
  height: number,
): ArchiveHeroRect {
  const nextWidth = Math.min(width, Math.max(32, Math.round(rect.width)))
  const nextHeight = Math.min(height, Math.max(24, Math.round(rect.height)))
  return {
    x: Math.min(width - nextWidth, Math.max(0, Math.round(rect.x))),
    y: Math.min(height - nextHeight, Math.max(0, Math.round(rect.y))),
    width: nextWidth,
    height: nextHeight,
  }
}
