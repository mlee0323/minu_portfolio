import { createRemoteJWKSet, type JWTPayload, jwtVerify } from "jose"

export const cloudflareAccessJwtHeader = "cf-access-jwt-assertion"

export type CloudflareAccessConfig = {
  readonly allowedEmail: string
  readonly audience: string
  readonly teamDomain: string
}

type CloudflareAccessPayload = JWTPayload & {
  readonly email?: unknown
}

export class CloudflareAccessConfigError extends Error {
  readonly name = "CloudflareAccessConfigError"
}

export class CloudflareAccessForbiddenError extends Error {
  readonly name = "CloudflareAccessForbiddenError"
}

function requiredEnv(name: string, env: Record<string, string | undefined>): string {
  const value = env[name]?.trim()

  if (value === undefined || value === "") {
    throw new CloudflareAccessConfigError(`${name} is required`)
  }

  return value
}

export function normalizeCloudflareTeamDomain(teamDomain: string): string {
  return teamDomain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/u, "")
    .toLowerCase()
}

export function readCloudflareAccessConfig(
  env: Record<string, string | undefined>,
): CloudflareAccessConfig {
  return {
    allowedEmail: requiredEnv("ADMIN_ALLOWED_EMAIL", env).toLowerCase(),
    audience: requiredEnv("CLOUDFLARE_ACCESS_AUD", env),
    teamDomain: normalizeCloudflareTeamDomain(requiredEnv("CLOUDFLARE_ACCESS_TEAM_DOMAIN", env)),
  }
}

export function getCloudflareAccessIssuer(teamDomain: string): string {
  return `https://${normalizeCloudflareTeamDomain(teamDomain)}`
}

export function getCloudflareAccessJwksUrl(teamDomain: string): URL {
  return new URL(`${getCloudflareAccessIssuer(teamDomain)}/cdn-cgi/access/certs`)
}

export function isAllowedAdminEmail(email: string, allowedEmail: string): boolean {
  return email.trim().toLowerCase() === allowedEmail.trim().toLowerCase()
}

function emailFromPayload(payload: CloudflareAccessPayload): string {
  return typeof payload.email === "string" ? payload.email.toLowerCase() : ""
}

export async function verifyCloudflareAccessJwt(
  token: string,
  config: CloudflareAccessConfig,
): Promise<{ readonly email: string }> {
  const jwks = createRemoteJWKSet(getCloudflareAccessJwksUrl(config.teamDomain))
  const { payload } = await jwtVerify(token, jwks, {
    audience: config.audience,
    issuer: getCloudflareAccessIssuer(config.teamDomain),
  })
  const email = emailFromPayload(payload)

  if (email === "" || !isAllowedAdminEmail(email, config.allowedEmail)) {
    throw new CloudflareAccessForbiddenError("This email is not allowed to access admin")
  }

  return { email }
}
