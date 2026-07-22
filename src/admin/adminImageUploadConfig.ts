export const adminImageContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const

export const adminImageInputAccept = adminImageContentTypes.join(",")
export const maxAdminImageUploadBytes = 5 * 1024 * 1024
export const maxProductionAdminImageUploadBytes = 100 * 1024 * 1024
