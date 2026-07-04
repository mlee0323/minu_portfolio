import ky from "ky"
import { z } from "zod"
import type { AudioTrack } from "../audio/types"

export type SoundCloudLoadOptions = {
  readonly auto_play?: boolean
  readonly buying?: boolean
  readonly sharing?: boolean
  readonly download?: boolean
  readonly show_artwork?: boolean
  readonly show_playcount?: boolean
  readonly show_user?: boolean
  readonly single_active?: boolean
  readonly start_track?: number
  readonly callback?: () => void
}

export type SoundCloudProgressEventData = {
  readonly relativePosition?: number
  readonly loadProgress?: number
  readonly currentPosition?: number
}

export type SoundCloudWidgetEvents = {
  readonly READY: string
  readonly PLAY: string
  readonly PAUSE: string
  readonly FINISH: string
  readonly PLAY_PROGRESS: string
  readonly LOAD_PROGRESS: string
  readonly SEEK: string
  readonly ERROR: string
}

export type SoundCloudWidgetListener = (eventData?: SoundCloudProgressEventData) => void

export interface SoundCloudWidget {
  bind(eventName: string, listener: SoundCloudWidgetListener): void
  unbind(eventName: string): void
  load(url: string, options?: SoundCloudLoadOptions): void
  play(): void
  pause(): void
  next(): void
  prev(): void
  skip(soundIndex: number): void
  getSounds(callback: (sounds: readonly unknown[]) => void): void
  getDuration(callback: (durationMs: number) => void): void
  getPosition(callback: (positionMs: number) => void): void
  getCurrentSound(callback: (sound: unknown) => void): void
  getCurrentSoundIndex(callback: (index: number) => void): void
}

export interface SoundCloudWidgetFactory {
  (iframe: HTMLIFrameElement | string): SoundCloudWidget
  readonly Events: SoundCloudWidgetEvents
}

export type SoundCloudGlobal = {
  readonly Widget: SoundCloudWidgetFactory
}

declare global {
  interface Window {
    SC?: SoundCloudGlobal
  }
}

const widgetScriptUrl = "https://w.soundcloud.com/player/api.js"
const allowedSoundCloudHosts = new Set(["soundcloud.com", "www.soundcloud.com"])

const soundCloudUserSchema = z
  .object({
    username: z.string().optional(),
  })
  .passthrough()

const soundCloudSoundSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    title: z.string().optional(),
    permalink_url: z.string().url().optional(),
    artwork_url: z.string().url().nullable().optional(),
    duration: z.number().nonnegative().optional(),
    user: soundCloudUserSchema.optional(),
  })
  .passthrough()

export type SoundCloudMetadataResult =
  | { readonly ok: true; readonly track: AudioTrack }
  | {
      readonly ok: false
      readonly reason:
        | "missing_client_id"
        | "invalid_track_url"
        | "request_failed"
        | "invalid_response"
    }

export function buildSoundCloudEmbedUrl(
  trackUrl: string,
  options: SoundCloudLoadOptions = {},
): string {
  if (!isAllowedSoundCloudTrackUrl(trackUrl)) {
    throw new SoundCloudUrlSecurityError()
  }

  const url = new URL("https://w.soundcloud.com/player/")
  url.searchParams.set("url", trackUrl)
  url.searchParams.set("auto_play", String(options.auto_play ?? false))
  url.searchParams.set("buying", String(options.buying ?? false))
  url.searchParams.set("sharing", String(options.sharing ?? false))
  url.searchParams.set("download", String(options.download ?? false))
  url.searchParams.set("show_artwork", String(options.show_artwork ?? true))
  url.searchParams.set("show_playcount", String(options.show_playcount ?? false))
  url.searchParams.set("show_user", String(options.show_user ?? true))
  url.searchParams.set("single_active", String(options.single_active ?? true))

  if (options.start_track !== undefined) {
    url.searchParams.set("start_track", String(options.start_track))
  }

  return url.toString()
}

export function getSoundCloudClientId(): string | null {
  const clientId = import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID.trim()
  return clientId.length > 0 ? clientId : null
}

export function isAllowedSoundCloudTrackUrl(trackUrl: string): boolean {
  try {
    const url = new URL(trackUrl)
    const pathSegments = url.pathname.split("/").filter(Boolean)

    return (
      url.protocol === "https:" &&
      allowedSoundCloudHosts.has(url.hostname) &&
      url.username.length === 0 &&
      url.password.length === 0 &&
      pathSegments.length >= 2
    )
  } catch (error) {
    if (error instanceof TypeError) {
      return false
    }
    throw error
  }
}

export function getSoundCloudPlaybackUrl(track: AudioTrack): string | null {
  const soundCloudUrl = track.soundCloudPlaylistUrl ?? track.soundCloudUrl

  if (soundCloudUrl === undefined || !isAllowedSoundCloudTrackUrl(soundCloudUrl)) {
    return null
  }

  return soundCloudUrl
}

function isAllowedSoundCloudArtworkUrl(artworkUrl: string): boolean {
  try {
    const url = new URL(artworkUrl)
    const hostname = url.hostname.toLowerCase()

    return (
      url.protocol === "https:" && (hostname === "sndcdn.com" || hostname.endsWith(".sndcdn.com"))
    )
  } catch (error) {
    if (error instanceof TypeError) {
      return false
    }
    throw error
  }
}

export function loadSoundCloudWidgetScript(): Promise<SoundCloudGlobal> {
  if (window.SC !== undefined) {
    return Promise.resolve(window.SC)
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${widgetScriptUrl}"]`,
    )

    if (existingScript !== null) {
      existingScript.addEventListener("load", () => {
        if (window.SC !== undefined) {
          resolve(window.SC)
          return
        }
        reject(new SoundCloudWidgetLoadError())
      })
      existingScript.addEventListener("error", () => reject(new SoundCloudWidgetLoadError()))
      return
    }

    const script = document.createElement("script")
    script.src = widgetScriptUrl
    script.async = true
    script.referrerPolicy = "strict-origin-when-cross-origin"
    script.addEventListener("load", () => {
      if (window.SC !== undefined) {
        resolve(window.SC)
        return
      }
      reject(new SoundCloudWidgetLoadError())
    })
    script.addEventListener("error", () => reject(new SoundCloudWidgetLoadError()))
    document.head.append(script)
  })
}

export async function fetchSoundCloudTrackMetadata(
  track: AudioTrack,
): Promise<SoundCloudMetadataResult> {
  const clientId = getSoundCloudClientId()

  if (clientId === null || track.soundCloudUrl === undefined) {
    return { ok: false, reason: "missing_client_id" }
  }

  if (!isAllowedSoundCloudTrackUrl(track.soundCloudUrl)) {
    return { ok: false, reason: "invalid_track_url" }
  }

  const url = new URL("https://api.soundcloud.com/resolve")
  url.searchParams.set("url", track.soundCloudUrl)
  url.searchParams.set("client_id", clientId)

  try {
    const response = await ky.get(url, { timeout: 5000 }).json<unknown>()
    const parsed = soundCloudSoundSchema.safeParse(response)

    if (!parsed.success) {
      return { ok: false, reason: "invalid_response" }
    }

    return { ok: true, track: normalizeSoundCloudSound(parsed.data, track) }
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, reason: "request_failed" }
    }
    throw error
  }
}

export function normalizeSoundCloudSound(sound: unknown, fallback: AudioTrack): AudioTrack {
  const parsed = soundCloudSoundSchema.safeParse(sound)

  if (!parsed.success) {
    return fallback
  }

  const data = parsed.data
  const artworkUrl =
    data.artwork_url !== null &&
    data.artwork_url !== undefined &&
    isAllowedSoundCloudArtworkUrl(data.artwork_url)
      ? data.artwork_url
      : fallback.artworkUrl
  const soundCloudUrl =
    data.permalink_url !== undefined && isAllowedSoundCloudTrackUrl(data.permalink_url)
      ? data.permalink_url
      : fallback.soundCloudUrl
  const artist = data.user?.username ?? fallback.artist
  const id = data.id === undefined ? fallback.id : `soundcloud-${String(data.id)}`
  const durationMs = data.duration ?? fallback.durationMs

  return {
    ...fallback,
    id,
    title: data.title ?? fallback.title,
    artist,
    provider: "soundcloud",
    artworkUrl,
    ...(durationMs === undefined ? {} : { durationMs }),
    ...(soundCloudUrl === undefined ? {} : { soundCloudUrl }),
  }
}

export class SoundCloudWidgetLoadError extends Error {
  readonly name = "SoundCloudWidgetLoadError"

  constructor() {
    super("SoundCloud Widget API failed to load")
  }
}

export class SoundCloudUrlSecurityError extends Error {
  readonly name = "SoundCloudUrlSecurityError"

  constructor() {
    super("Unsafe SoundCloud URL was blocked")
  }
}
