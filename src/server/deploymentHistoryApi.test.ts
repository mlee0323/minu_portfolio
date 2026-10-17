// @vitest-environment node
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import handler from "../../api/admin/deployments"
import { AdminRequestUnauthorizedError } from "./adminRequestAuth"

const mocks = vi.hoisted(() => ({ verify: vi.fn(), history: vi.fn(), status: vi.fn() }))
vi.mock("./adminRequestAuth.ts", async (original) => ({
  ...(await original<typeof import("./adminRequestAuth")>()),
  verifyAdminRequest: mocks.verify,
}))
vi.mock("./deploymentHistory.ts", () => ({
  readDeploymentHistory: mocks.history,
  readDeploymentStatus: mocks.status,
}))
vi.mock("./githubPublish.ts", () => ({ readGitHubPublishConfig: () => ({ token: "server-only" }) }))
function request(query = {}, method = "GET") {
  return { method, query, headers: {} } as VercelRequest
}
function response() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), setHeader: vi.fn() }
  return res as typeof res & VercelResponse
}
beforeEach(() => {
  vi.resetAllMocks()
  mocks.verify.mockResolvedValue({ email: "owner@example.com" })
  mocks.history.mockResolvedValue({ entries: [], page: 1, hasMore: false })
  mocks.status.mockResolvedValue({
    state: "pending",
    description: "Building",
    detailsUrl: null,
    updatedAt: null,
  })
  vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "a".repeat(40))
})
afterEach(() => vi.unstubAllEnvs())
describe("protected deployment history API", () => {
  it("returns durable history and active deployment identity with no secrets", async () => {
    const res = response()
    await handler(request(), res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, deployedCommitSha: "a".repeat(40) }),
    )
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("server-only")
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store")
  })
  it("checks one exact commit for save completion", async () => {
    const res = response()
    await handler(request({ sha: "b".repeat(40) }), res)
    expect(mocks.status).toHaveBeenCalledWith(expect.anything(), "b".repeat(40))
    expect(mocks.history).not.toHaveBeenCalled()
  })
  it("rejects unauthenticated access before reading repository data", async () => {
    mocks.verify.mockRejectedValue(
      new AdminRequestUnauthorizedError("Cloudflare Access token missing"),
    )
    const res = response()
    await handler(request(), res)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(mocks.history).not.toHaveBeenCalled()
  })
  it.each([
    { page: "0" },
    { page: "nonsense" },
    { sha: "../../other-repo" },
  ])("rejects invalid query %j", async (query) => {
    const res = response()
    await handler(request(query), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(mocks.history).not.toHaveBeenCalled()
    expect(mocks.status).not.toHaveBeenCalled()
  })
})
