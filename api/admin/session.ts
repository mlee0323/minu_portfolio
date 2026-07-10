import type { VercelRequest, VercelResponse } from "@vercel/node"
import { errors } from "jose"
import {
  CloudflareAccessConfigError,
  CloudflareAccessForbiddenError,
  cloudflareAccessJwtHeader,
  readCloudflareAccessConfig,
  verifyCloudflareAccessJwt,
} from "../../src/server/cloudflareAccess.ts"

function headerValue(value: string | readonly string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? ""
  }

  return typeof value === "string" ? value : ""
}

function sendJson(
  response: VercelResponse,
  status: number,
  body: Record<string, boolean | string>,
): void {
  response.setHeader("Cache-Control", "no-store")
  response.status(status).json(body)
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET")
    sendJson(response, 405, { authenticated: false, error: "Method not allowed" })
    return
  }

  const token = headerValue(request.headers[cloudflareAccessJwtHeader])

  if (token === "") {
    sendJson(response, 401, { authenticated: false, error: "Cloudflare Access token missing" })
    return
  }

  try {
    const session = await verifyCloudflareAccessJwt(token, readCloudflareAccessConfig(process.env))
    sendJson(response, 200, { authenticated: true, email: session.email })
  } catch (error: unknown) {
    if (error instanceof CloudflareAccessConfigError) {
      sendJson(response, 500, { authenticated: false, error: error.message })
      return
    }

    if (error instanceof CloudflareAccessForbiddenError) {
      sendJson(response, 403, { authenticated: false, error: error.message })
      return
    }

    if (error instanceof errors.JOSEError) {
      sendJson(response, 401, { authenticated: false, error: "Cloudflare Access token invalid" })
      return
    }

    throw error
  }
}
