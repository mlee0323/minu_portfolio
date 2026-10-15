import { adminImageAssetPathFromSrc } from "../admin/adminImageAsset.ts"
import type { AdminContent } from "../admin/adminTypes.ts"

export function publishedImageAssetPaths(content: AdminContent): ReadonlySet<string> {
  const sources = [
    ...content.works
      .filter((work) => work.status === "published")
      .flatMap((work) => [...work.images.map((image) => image.src), work.audio.artworkUrl]),
    ...content.archiveReleases
      .filter((release) => release.status === "published")
      .flatMap((release) => [
        release.artworkUrl,
        ...release.images.map((image) => image.src),
        ...release.tracks.map((track) => track.artworkUrl),
      ]),
  ]
  return new Set(
    sources.flatMap((src) => {
      const pathname = adminImageAssetPathFromSrc(src)
      return pathname === null ? [] : [pathname]
    }),
  )
}

export function cloudflareAccessCookie(cookie: string | undefined): string | undefined {
  return cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("CF_Authorization="))
    ?.slice("CF_Authorization=".length)
}
