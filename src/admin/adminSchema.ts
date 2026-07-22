import { z } from "zod"
import {
  type AdminArchiveRelease,
  type AdminArchiveImage,
  type AdminArchiveTrack,
  type AdminAudioTrack,
  type AdminCanvasLayout,
  type AdminCanvasRect,
  type AdminContactLink,
  type AdminContent,
  type AdminIndexItem,
  type AdminWork,
  type AdminWorkCanvas,
  type AdminWorkImage,
  type AdminWorkTextElement,
  adminStatusOptions,
  imageAlignOptions,
  imageScaleOptions,
  textAlignOptions,
  textWeightOptions,
} from "./adminTypes.ts"

const providerSchema = z.enum(["local", "soundcloud", "spotify"])
const statusSchema = z.enum(adminStatusOptions)
const visibilitySchema = z.enum(["public", "private-link"])
const legacyDesktopLayoutScale = 760 / 390

export const AdminAudioTrackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  provider: providerSchema,
  artworkUrl: z.string(),
  durationMs: z.number().int().nonnegative(),
  localAudioUrl: z.string(),
  soundCloudUrl: z.string(),
  soundCloudPlaylistUrl: z.string(),
  playlistIndex: z.number().int().nonnegative().nullable(),
  visibility: visibilitySchema,
  description: z.string(),
}) satisfies z.ZodType<AdminAudioTrack>

export const AdminCanvasRectSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
}) satisfies z.ZodType<AdminCanvasRect>

export const AdminCanvasLayoutSchema = AdminCanvasRectSchema satisfies z.ZodType<AdminCanvasLayout>

export const AdminWorkCanvasSchema = z.object({
  height: z.number().int().positive(),
}) satisfies z.ZodType<AdminWorkCanvas>

export const AdminWorkImageSchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspectRatio: z.string().min(1),
  objectPosition: z.string().min(1),
  align: z.enum(imageAlignOptions),
  scale: z.enum(imageScaleOptions),
  sortOrder: z.number().int().nonnegative(),
  layout: AdminCanvasLayoutSchema,
}) satisfies z.ZodType<AdminWorkImage>

export const AdminWorkTextElementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  fontSize: z.number().int().positive(),
  fontWeight: z.enum(textWeightOptions),
  lineHeight: z.number().positive(),
  textAlign: z.enum(textAlignOptions),
  color: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  layout: AdminCanvasLayoutSchema,
}) satisfies z.ZodType<AdminWorkTextElement>

export const AdminWorkSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  year: z.string(),
  medium: z.string(),
  location: z.string(),
  caption: z.string(),
  status: statusSchema,
  isEntry: z.boolean(),
  sortOrder: z.number().int().nonnegative(),
  canvas: AdminWorkCanvasSchema,
  audio: AdminAudioTrackSchema,
  images: z.array(AdminWorkImageSchema),
  textElements: z.array(AdminWorkTextElementSchema),
}) satisfies z.ZodType<AdminWork>

export const AdminArchiveTrackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  artworkUrl: z.string(),
  durationMs: z.number().int().nonnegative(),
  soundCloudUrl: z.string(),
  soundCloudPlaylistUrl: z.string(),
  playlistIndex: z.number().int().nonnegative().nullable(),
  trackNumber: z.number().int().nonnegative().nullable(),
  visibility: visibilitySchema,
  description: z.string(),
  sortOrder: z.number().int().nonnegative(),
}) satisfies z.ZodType<AdminArchiveTrack>

export const AdminArchiveImageSchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspectRatio: z.string().min(1),
  objectPosition: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
}) satisfies z.ZodType<AdminArchiveImage>

export const AdminArchiveReleaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  type: z.enum(["single", "ep", "album", "playlist"]),
  provider: z.literal("soundcloud"),
  artworkUrl: z.string().min(1),
  year: z.string(),
  soundCloudPlaylistUrl: z.string(),
  visibility: visibilitySchema,
  description: z.string(),
  status: statusSchema,
  sortOrder: z.number().int().nonnegative(),
  images: z.array(AdminArchiveImageSchema),
  tracks: z.array(AdminArchiveTrackSchema),
}) satisfies z.ZodType<AdminArchiveRelease>

export const AdminIndexItemSchema = z.object({
  id: z.string().min(1),
  year: z.string().min(1),
  title: z.string().min(1),
  role: z.string().min(1),
  status: statusSchema,
  sortOrder: z.number().int().nonnegative(),
}) satisfies z.ZodType<AdminIndexItem>

export const AdminContactLinkSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
}) satisfies z.ZodType<AdminContactLink>

export const AdminContentSchema = z.object({
  works: z.array(AdminWorkSchema),
  archiveReleases: z.array(AdminArchiveReleaseSchema),
  indexItems: z.array(AdminIndexItemSchema),
  contactLinks: z.array(AdminContactLinkSchema),
}) satisfies z.ZodType<AdminContent>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function canvasHeightFrom(value: unknown): number | null {
  return isRecord(value) && typeof value["height"] === "number" ? value["height"] : null
}

function rectFrom(value: unknown): AdminCanvasRect | null {
  if (
    !isRecord(value) ||
    typeof value["x"] !== "number" ||
    typeof value["y"] !== "number" ||
    typeof value["width"] !== "number" ||
    typeof value["height"] !== "number"
  ) {
    return null
  }

  return {
    x: value["x"],
    y: value["y"],
    width: value["width"],
    height: value["height"],
  }
}

function normalizeLegacyWorkCanvas(canvas: unknown): unknown {
  if (!isRecord(canvas) || typeof canvas["height"] === "number") {
    return canvas
  }

  const migratedHeight = canvasHeightFrom(canvas["mobile"]) ?? canvasHeightFrom(canvas["desktop"])

  return migratedHeight === null ? canvas : { height: migratedHeight }
}

function normalizeLegacyLayout(layouts: unknown): AdminCanvasRect | null {
  if (!isRecord(layouts)) {
    return null
  }

  const mobile = rectFrom(layouts["mobile"])

  if (mobile !== null) {
    return mobile
  }

  const desktop = rectFrom(layouts["desktop"])

  if (desktop === null) {
    return null
  }

  return {
    x: Math.round(desktop.x / legacyDesktopLayoutScale),
    y: desktop.y,
    width: Math.round(desktop.width / legacyDesktopLayoutScale),
    height: desktop.height,
  }
}

function normalizeElementLayout(element: Record<string, unknown>): Record<string, unknown> {
  if (isRecord(element["layout"])) {
    return element
  }

  const layout = normalizeLegacyLayout(element["layouts"])

  return layout === null ? element : { ...element, layout }
}

function normalizeWork(work: Record<string, unknown>): Record<string, unknown> {
  return {
    ...work,
    canvas: normalizeLegacyWorkCanvas(work["canvas"]),
    images: Array.isArray(work["images"])
      ? work["images"].map((image) => (isRecord(image) ? normalizeElementLayout(image) : image))
      : work["images"],
    textElements: Array.isArray(work["textElements"])
      ? work["textElements"].map((textElement) =>
          isRecord(textElement) ? normalizeElementLayout(textElement) : textElement,
        )
      : work["textElements"],
  }
}

function normalizeArchiveRelease(release: Record<string, unknown>): Record<string, unknown> {
  return Array.isArray(release["images"]) ? release : { ...release, images: [] }
}

function normalizeAdminContentInput(input: unknown): unknown {
  if (!isRecord(input) || !Array.isArray(input["works"])) {
    return input
  }

  return {
    ...input,
    works: input["works"].map((work) => (isRecord(work) ? normalizeWork(work) : work)),
    archiveReleases: Array.isArray(input["archiveReleases"])
      ? input["archiveReleases"].map((release) =>
          isRecord(release) ? normalizeArchiveRelease(release) : release,
        )
      : input["archiveReleases"],
  }
}

export function parseAdminContent(input: unknown): AdminContent {
  return AdminContentSchema.parse(normalizeAdminContentInput(input))
}
