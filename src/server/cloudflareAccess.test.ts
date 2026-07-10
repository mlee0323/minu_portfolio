import { describe, expect, it } from "vitest"
import {
  getCloudflareAccessIssuer,
  getCloudflareAccessJwksUrl,
  isAllowedAdminEmail,
  normalizeCloudflareTeamDomain,
  readCloudflareAccessConfig,
} from "./cloudflareAccess"

describe("cloudflareAccess", () => {
  it("normalizes Cloudflare team domains", () => {
    expect(normalizeCloudflareTeamDomain("https://MINU.cloudflareaccess.com/")).toBe(
      "minu.cloudflareaccess.com",
    )
  })

  it("builds issuer and JWKS URLs from the team domain", () => {
    expect(getCloudflareAccessIssuer("minu.cloudflareaccess.com")).toBe(
      "https://minu.cloudflareaccess.com",
    )
    expect(getCloudflareAccessJwksUrl("minu.cloudflareaccess.com").toString()).toBe(
      "https://minu.cloudflareaccess.com/cdn-cgi/access/certs",
    )
  })

  it("matches the single admin email case-insensitively", () => {
    expect(isAllowedAdminEmail("Admin@Example.com", "admin@example.com")).toBe(true)
    expect(isAllowedAdminEmail("other@example.com", "admin@example.com")).toBe(false)
  })

  it("reads required Cloudflare Access environment config", () => {
    expect(
      readCloudflareAccessConfig({
        ADMIN_ALLOWED_EMAIL: "admin@example.com",
        CLOUDFLARE_ACCESS_AUD: "aud-value",
        CLOUDFLARE_ACCESS_TEAM_DOMAIN: "https://minu.cloudflareaccess.com",
      }),
    ).toEqual({
      allowedEmail: "admin@example.com",
      audience: "aud-value",
      teamDomain: "minu.cloudflareaccess.com",
    })
  })
})
