import { upload } from "@vercel/blob/client"
import { shouldVerifyAdminAccess } from "./adminAccessClient"
import { type AdminUploadedImage, readAdminUploadedImage } from "./adminImageUpload"

const blobMultipartThresholdBytes = 4 * 1024 * 1024

function safePathSegment(fileName: string): string {
  const cleaned = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return cleaned.length > 0 ? cleaned : "upload"
}

export async function uploadAdminImageAsset(file: File): Promise<AdminUploadedImage> {
  if (!shouldVerifyAdminAccess()) {
    return readAdminUploadedImage(file)
  }

  const preview = await readAdminUploadedImage(file)
  const blob = await upload(`admin-assets/${Date.now()}-${safePathSegment(file.name)}`, file, {
    access: "public",
    contentType: file.type,
    handleUploadUrl: "/api/admin/upload",
    multipart: file.size >= blobMultipartThresholdBytes,
  })

  return {
    ...preview,
    src: blob.url,
  }
}
