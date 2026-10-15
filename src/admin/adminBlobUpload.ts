import { upload } from "@vercel/blob/client"
import { shouldVerifyAdminAccess } from "./adminAccessClient"
import {
  AdminImageUploadError,
  type AdminUploadedImage,
  readAdminImageMetadata,
  readAdminUploadedImage,
} from "./adminImageUpload"

const blobMultipartThresholdBytes = 4 * 1024 * 1024
const blobUploadIdleTimeoutMs = 30_000

function safePathSegment(fileName: string): string {
  const cleaned = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return cleaned.length > 0 ? cleaned : "upload"
}

export async function uploadAdminImageAsset(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<AdminUploadedImage> {
  if (!shouldVerifyAdminAccess()) {
    return readAdminUploadedImage(file)
  }

  const metadata = await readAdminImageMetadata(file)
  const abortController = new AbortController()
  let timeoutId: number | undefined
  let lastProgress = 0
  onProgress?.(0)

  try {
    let resetIdleTimeout = () => {}
    const timeoutPromise = new Promise<never>((_, reject) => {
      resetIdleTimeout = () => {
        window.clearTimeout(timeoutId)
        timeoutId = window.setTimeout(() => {
          reject(
            new AdminImageUploadError(
              "Image upload stalled: no progress for 30 seconds. Try again.",
            ),
          )
          abortController.abort()
        }, blobUploadIdleTimeoutMs)
      }
      resetIdleTimeout()
    })
    const uploadPromise = upload(`admin-assets/${Date.now()}-${safePathSegment(file.name)}`, file, {
      access: "public",
      contentType: file.type,
      handleUploadUrl: "/api/admin/upload",
      multipart: file.size >= blobMultipartThresholdBytes,
      onUploadProgress: (event) => {
        const progress = Math.min(100, Math.max(lastProgress, event.percentage))
        if (progress > lastProgress) {
          lastProgress = progress
          resetIdleTimeout()
        }
        onProgress?.(progress)
      },
      abortSignal: abortController.signal,
    })
    const blob = await Promise.race([uploadPromise, timeoutPromise])
    onProgress?.(100)

    return {
      ...metadata,
      src: blob.url,
    }
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId)
    }
  }
}
