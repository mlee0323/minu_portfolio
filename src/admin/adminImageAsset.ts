const imageAssetPathPattern = /^admin-assets\/[0-9]+-[a-zA-Z0-9.-]+$/

export function isAdminImageAssetPath(pathname: string): boolean {
  return imageAssetPathPattern.test(pathname)
}

export function adminImageAssetSrc(pathname: string): string {
  if (!isAdminImageAssetPath(pathname)) {
    throw new Error("Invalid image asset path")
  }
  return `/api/assets?pathname=${encodeURIComponent(pathname)}`
}

export function adminImageAssetPathFromSrc(src: string): string | null {
  if (!src.startsWith("/api/assets?")) return null
  const url = new URL(src, "https://portfolio.invalid")
  const pathname = url.searchParams.get("pathname")
  return pathname !== null && isAdminImageAssetPath(pathname) ? pathname : null
}
