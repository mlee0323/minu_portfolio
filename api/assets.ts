import { once } from "node:events"
import { get } from "@vercel/blob"
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { isAdminImageAssetPath } from "../src/admin/adminImageAsset.ts"
import { adminImageContentTypes } from "../src/admin/adminImageUploadConfig.ts"
import { publishedAdminContent } from "../src/data/publishedContent.ts"
import { verifyAdminRequest } from "../src/server/adminRequestAuth.ts"
import { cloudflareAccessJwtHeader } from "../src/server/cloudflareAccess.ts"
import {
  cloudflareAccessCookie,
  publishedImageAssetPaths,
} from "../src/server/privateImageAssets.ts"

const publishedPaths = publishedImageAssetPaths(publishedAdminContent)

export default async function handler(request: VercelRequest, response: VercelResponse) {
  // Never cache private previews or keep serving an image after it is unpublished.
  response.setHeader("Cache-Control", "private, no-store")
  response.setHeader("X-Content-Type-Options", "nosniff")
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD")
    response.status(405).end()
    return
  }
  const pathname = request.query["pathname"]
  if (typeof pathname !== "string" || !isAdminImageAssetPath(pathname)) {
    response.status(404).end()
    return
  }

  if (!publishedPaths.has(pathname)) {
    try {
      // This public route is outside the Access app. Verify the signed Access
      // cookie for draft previews using the same issuer, audience and email checks.
      await verifyAdminRequest(
        {
          ...request.headers,
          [cloudflareAccessJwtHeader]:
            request.headers[cloudflareAccessJwtHeader] ??
            cloudflareAccessCookie(request.headers.cookie),
        },
        process.env,
      )
    } catch {
      response.status(404).end()
      return
    }
  }

  try {
    const token = process.env["BLOB_READ_WRITE_TOKEN"]
    if (!token) throw new Error("Blob storage is not configured")
    const blob = await get(pathname, { access: "private", token })
    if (blob === null || blob.statusCode !== 200) {
      response.status(404).end()
      return
    }
    const contentType = blob.blob.contentType
    if (!adminImageContentTypes.some((type) => type === contentType.split(";")[0])) {
      await blob.stream.cancel()
      response.status(415).end()
      return
    }
    response.setHeader("Content-Type", blob.blob.contentType)
    response.setHeader("Content-Length", blob.blob.size)
    if (request.method === "HEAD") {
      await blob.stream.cancel()
      response.status(200).end()
      return
    }
    const reader = blob.stream.getReader()
    try {
      while (true) {
        const chunk = await reader.read()
        if (chunk.done) break
        if (!response.write(chunk.value)) await once(response, "drain")
      }
    } finally {
      reader.releaseLock()
    }
    response.end()
  } catch (error: unknown) {
    console.error("admin.blob.image.failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    })
    if (!response.headersSent) response.status(502)
    response.end()
  }
}
