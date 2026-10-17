// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"
import { readDeploymentHistory, readDeploymentStatus, statusFromGitHub } from "./deploymentHistory"

function status(
  state: string,
  context = "Vercel",
  description = "Deployment has completed",
  target_url = "https://vercel.com/team/project/deploy",
) {
  return { context, state, description, target_url, updated_at: "2026-10-17T08:00:00Z" }
}
function json(value: unknown, headers = {}) {
  return new Response(JSON.stringify(value), {
    headers: { "content-type": "application/json", ...headers },
  })
}
const config = {
  owner: "owner",
  repo: "repo",
  branch: "main",
  path: "src/data/publishedContent.ts",
  token: "server-only-token",
}
afterEach(() => vi.unstubAllGlobals())

describe("actual Vercel deployment status", () => {
  it.each([
    ["pending", "pending"],
    ["success", "success"],
    ["failure", "error"],
    ["error", "error"],
  ])("maps %s to %s", (provider, expected) => {
    expect(statusFromGitHub({ statuses: [status(provider)] }).state).toBe(expected)
  })
  it("does not use unrelated CI success to report a completed deployment", () => {
    expect(statusFromGitHub({ statuses: [status("success", "CI")] }).state).toBe("unknown")
    expect(statusFromGitHub({ statuses: [status("failure", "CI"), status("pending")] }).state).toBe(
      "pending",
    )
  })
  it("distinguishes a new deployment waiting for its status from an old commit without a deployment", () => {
    expect(statusFromGitHub({ statuses: [] }, new Date().toISOString()).state).toBe("pending")
    expect(statusFromGitHub({ statuses: [] }, "2020-01-01T00:00:00Z").state).toBe("unknown")
  })
  it("rejects unsafe external detail links", () => {
    expect(
      statusFromGitHub({ statuses: [status("error", "Vercel", "Error", "javascript:alert(1)")] })
        .detailsUrl,
    ).toBeNull()
    expect(
      statusFromGitHub({
        statuses: [status("error", "Vercel", "Error", "https://example.com/redirect")],
      }).detailsUrl,
    ).toBeNull()
  })
  it("loads persistent commit history, paginates, and keeps lookup errors distinct from build failures", async () => {
    const sha = "a".repeat(40)
    const failed = "b".repeat(40)
    const fetch = vi.fn(async (request: Request) => {
      const url = new URL(request.url)
      if (url.pathname.endsWith("/commits"))
        return json(
          [
            {
              sha,
              html_url: `https://github.com/owner/repo/commit/${sha}`,
              commit: {
                message: "Publish portfolio content from admin",
                author: { name: "Owner", date: "2026-10-17T08:00:00Z" },
              },
            },
            {
              sha: failed,
              html_url: `https://github.com/owner/repo/commit/${failed}`,
              commit: {
                message: "Code change",
                author: { name: "Owner", date: "2026-10-17T08:00:00Z" },
              },
            },
          ],
          { link: '<https://api.github.com/next>; rel="next"' },
        )
      if (url.pathname.includes(sha)) return json({ statuses: [status("success")] })
      return new Response("Unavailable", { status: 503 })
    })
    vi.stubGlobal("fetch", fetch)
    const result = await readDeploymentHistory({ ...config, repo: "history-test" }, 2)
    expect(result.page).toBe(2)
    expect(result.hasMore).toBe(true)
    expect(result.entries[0]).toMatchObject({ sha, source: "admin", state: "success" })
    expect(result.entries[1]).toMatchObject({ source: "code", state: "unknown" })
    expect(new URL((fetch.mock.calls[0]?.[0] as Request).url).searchParams.get("page")).toBe("2")
  })
  it("does not fall back to unauthenticated requests for a private repository", async () => {
    const fetch = vi.fn(async (request: Request) =>
      request.url.endsWith("/status")
        ? new Response("Forbidden", { status: 403 })
        : json({ private: true }),
    )
    vi.stubGlobal("fetch", fetch)
    await expect(
      readDeploymentStatus({ ...config, repo: "private-test" }, "c".repeat(40)),
    ).rejects.toThrow()
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
