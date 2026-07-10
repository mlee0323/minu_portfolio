import type {
  AdminArchiveRelease,
  AdminArchiveTrack,
  AdminAudioTrack,
  AdminContactLink,
  AdminContent,
  AdminIndexItem,
  AdminWork,
  AdminWorkImage,
} from "../admin/adminTypes"
import type { AudioRelease, AudioTrack } from "../audio/types"
import { publishedAdminContent } from "./publishedContent"
import type { ContactLink, IndexItem, MainWork, WorkImage } from "./siteContent"
import { mainWorksClosingCaption } from "./siteContent"

function optionalString(value: string): string | undefined {
  return value.trim() === "" ? undefined : value
}

function optionalNumber(value: number | null): number | undefined {
  return value === null ? undefined : value
}

function sortByOrder<TItem extends { readonly sortOrder: number }>(
  items: readonly TItem[],
): readonly TItem[] {
  return [...items].sort((left, right) => left.sortOrder - right.sortOrder)
}

function toWorkImage(image: AdminWorkImage): WorkImage {
  return {
    id: image.id,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    aspectRatio: image.aspectRatio,
    objectPosition: image.objectPosition,
    align: image.align,
    scale: image.scale,
  }
}

function toAudioTrack(track: AdminAudioTrack, work: AdminWork): AudioTrack {
  const description = optionalString(track.description)
  const localAudioUrl = optionalString(track.localAudioUrl)
  const soundCloudUrl = optionalString(track.soundCloudUrl)
  const soundCloudPlaylistUrl = optionalString(track.soundCloudPlaylistUrl)
  const playlistIndex = optionalNumber(track.playlistIndex)

  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    provider: track.provider,
    artworkUrl: track.artworkUrl,
    durationMs: track.durationMs,
    visibility: track.visibility,
    releaseId: work.id,
    releaseTitle: work.title,
    ...(description === undefined ? {} : { description }),
    ...(localAudioUrl === undefined ? {} : { localAudioUrl }),
    ...(soundCloudUrl === undefined ? {} : { soundCloudUrl }),
    ...(soundCloudPlaylistUrl === undefined ? {} : { soundCloudPlaylistUrl }),
    ...(playlistIndex === undefined ? {} : { playlistIndex }),
  }
}

function toArchiveTrack(track: AdminArchiveTrack, release: AdminArchiveRelease): AudioTrack {
  const description = optionalString(track.description)
  const soundCloudUrl = optionalString(track.soundCloudUrl)
  const soundCloudPlaylistUrl = optionalString(
    track.soundCloudPlaylistUrl || release.soundCloudPlaylistUrl,
  )
  const playlistIndex = optionalNumber(track.playlistIndex)
  const trackNumber = optionalNumber(track.trackNumber)

  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    provider: "soundcloud",
    artworkUrl: track.artworkUrl || release.artworkUrl,
    durationMs: track.durationMs,
    visibility: track.visibility,
    releaseId: release.id,
    releaseTitle: release.title,
    ...(description === undefined ? {} : { description }),
    ...(soundCloudUrl === undefined ? {} : { soundCloudUrl }),
    ...(soundCloudPlaylistUrl === undefined ? {} : { soundCloudPlaylistUrl }),
    ...(playlistIndex === undefined ? {} : { playlistIndex }),
    ...(trackNumber === undefined ? {} : { trackNumber }),
  }
}

function toMainWork(work: AdminWork): MainWork {
  return {
    id: work.id,
    track: toAudioTrack(work.audio, work),
    year: work.year,
    medium: work.medium,
    location: work.location,
    caption: work.caption,
    images: sortByOrder(work.images).map(toWorkImage),
  }
}

function toAudioRelease(release: AdminArchiveRelease): AudioRelease {
  const year = optionalString(release.year)
  const description = optionalString(release.description)
  const soundCloudPlaylistUrl = optionalString(release.soundCloudPlaylistUrl)

  return {
    id: release.id,
    title: release.title,
    artist: release.artist,
    type: release.type,
    provider: "soundcloud",
    artworkUrl: release.artworkUrl,
    visibility: release.visibility,
    tracks: sortByOrder(release.tracks).map((track) => toArchiveTrack(track, release)),
    ...(year === undefined ? {} : { year }),
    ...(description === undefined ? {} : { description }),
    ...(soundCloudPlaylistUrl === undefined ? {} : { soundCloudPlaylistUrl }),
  }
}

export type PublishedSiteContent = {
  readonly works: readonly AdminWork[]
  readonly mainWorks: readonly MainWork[]
  readonly archiveReleases: readonly AudioRelease[]
  readonly archiveTracks: readonly AudioTrack[]
  readonly indexItems: readonly IndexItem[]
  readonly contactLinks: readonly ContactLink[]
}

function toIndexItem(item: AdminIndexItem): IndexItem {
  return {
    year: item.year,
    title: item.title,
    role: item.role,
  }
}

function toContactLink(link: AdminContactLink): ContactLink {
  return {
    label: link.label,
    href: link.href,
  }
}

export function createPublishedSiteContent(content: AdminContent): PublishedSiteContent {
  const works = sortByOrder(content.works.filter((work) => work.status === "published"))
  const archiveReleases = sortByOrder(
    content.archiveReleases.filter((release) => release.status === "published"),
  ).map(toAudioRelease)

  return {
    works,
    mainWorks: works.map(toMainWork),
    archiveReleases,
    archiveTracks: archiveReleases.flatMap((release) => release.tracks),
    indexItems: sortByOrder(content.indexItems.filter((item) => item.status === "published")).map(
      toIndexItem,
    ),
    contactLinks: sortByOrder(content.contactLinks).map(toContactLink),
  }
}

const builtPublishedSiteContent = createPublishedSiteContent(publishedAdminContent)

export const publishedWorks = builtPublishedSiteContent.works

export const mainWorks = builtPublishedSiteContent.mainWorks

export const archiveReleases = builtPublishedSiteContent.archiveReleases

export const archiveTracks = builtPublishedSiteContent.archiveTracks

export const indexItems = builtPublishedSiteContent.indexItems

export const contactLinks = builtPublishedSiteContent.contactLinks

export { mainWorksClosingCaption }
