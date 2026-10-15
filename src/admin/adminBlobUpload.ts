import { upload } from "@vercel/blob/client"
import { shouldVerifyAdminAccess } from "./adminAccessClient"
import {
  type AdminUploadedImage,
  readAdminImageMetadata,
  readAdminUploadedImage,
} from "./adminImageUpload"

const blobMultipartThresholdBytes = 4 * 1024 * 1024
const blobUploadTimeoutMs = 30_000

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
  onProgress?.(0)

  try {
    const uploadPromise = upload(`admin-assets/${Date.now()}-${safePathSegment(file.name)}`, file, {
      access: "public",
      contentType: file.type,
      handleUploadUrl: "/api/admin/upload",
      multipart: file.size >= blobMultipartThresholdBytes,
      onUploadProgress: (event) => onProgress?.(event.percentage),
      abortSignal: abortController.signal,
    })
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        abortController.abort()
        reject(new DOMException("Image upload timed out", "AbortError"))
      }, blobUploadTimeoutMs)
    })
    const blob = await Promise.race([uploadPromise, timeoutPromise])

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
