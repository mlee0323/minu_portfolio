import { errors } from "jose"
import {
  CloudflareAccessConfigError,
  CloudflareAccessForbiddenError,
  cloudflareAccessJwtHeader,
  readCloudflareAccessConfig,
  verifyCloudflareAccessJwt,
} from "./cloudflareAccess"

export type AdminRequestSession = {
  readonly email: string
}

export class AdminRequestUnauthorizedError extends Error {
  readonly name = "AdminRequestUnauthorizedError"
}

export async function verifyAdminRequest(
  headers: Record<string, string | readonly string[] | undefined>,
  env: Record<string, string | undefined>,
): Promise<AdminRequestSession> {
  const rawToken = headers[cloudflareAccessJwtHeader]
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken

  if (token === undefined || token === "") {
    throw new AdminRequestUnauthorizedError("Cloudflare Access token missing")
  }

  return verifyCloudflareAccessJwt(token, readCloudflareAccessConfig(env))
}

export function statusForAdminRequestError(error: unknown): number {
  if (error instanceof CloudflareAccessConfigError) {
    return 500
  }

  if (error instanceof CloudflareAccessForbiddenError) {
    return 403
  }

  if (error instanceof AdminRequestUnauthorizedError || error instanceof errors.JOSEError) {
    return 401
  }

  return 500
}

export function messageForAdminRequestError(error: unknown): string {
  if (
    error instanceof CloudflareAccessConfigError ||
    error instanceof CloudflareAccessForbiddenError ||
    error instanceof AdminRequestUnauthorizedError
  ) {
    return error.message
  }

  if (error instanceof errors.JOSEError) {
    return "Cloudflare Access token invalid"
  }

  return "Admin request failed"
}
