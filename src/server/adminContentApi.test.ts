// @vitest-environment node
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { beforeEach, describe, expect, it, vi } from "vitest"
import contentHandler from "../../api/admin/content"
import publishHandler from "../../api/admin/publish"
import { createSeedAdminContent } from "../admin/adminSeed"
import { AdminRequestUnauthorizedError } from "./adminRequestAuth"
import { GitHubPublishConflictError } from "./githubPublish"
import {
  formatPublishedContentModule,
  parsePublishedContentModule,
  publishedContentHash,
} from "./publishedContentSource"

const mocks = vi.hoisted(() => ({ verify: vi.fn(), read: vi.fn(), publish: vi.fn() }))
vi.mock("./adminRequestAuth.ts", async (original) => ({
  ...(await original<typeof import("./adminRequestAuth")>()),
  verifyAdminRequest: mocks.verify,
}))
vi.mock("./githubPublish.ts", async (original) => ({
  ...(await original<typeof import("./githubPublish")>()),
  readFileFromGitHub: mocks.read,
  publishFileToGitHub: mocks.publish,
  readGitHubPublishConfig: () => ({
    owner: "owner",
    repo: "repo",
    branch: "main",
    path: "src/data/publishedContent.ts",
    token: "server-only",
  }),
}))
const content = createSeedAdminContent()
function request(method = "GET", body?: unknown, query = {}): VercelRequest {
  return { method, body, query, headers: {} } as VercelRequest
}
function response() {
  const res = { status: vi.fn().mockReturnThis(), setHeader: vi.fn(), json: vi.fn() }
  return res as typeof res & VercelResponse
}
beforeEach(() => {
  vi.resetAllMocks()
  mocks.verify.mockResolvedValue({ email: "admin@example.com" })
  mocks.read.mockResolvedValue({ sha: "file-sha", source: formatPublishedContentModule(content) })
  mocks.publish.mockResolvedValue({
    contentSha: "new-sha",
    commitSha: "commit-sha",
    commitUrl: "https://github.com/test/commit/sha",
    path: "src/data/publishedContent.ts",
  })
})
describe("authenticated current content and publishing", () => {
  it("loads current repository content with its revision and deployed hash", async () => {
    const res = response()
    await contentHandler(request(), res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        sha: "file-sha",
        content,
        deployedContentHash: publishedContentHash(content),
      }),
    )
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store")
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("server-only")
  })
  it("checks active deployment without querying GitHub", async () => {
    const res = response()
    await contentHandler(request("GET", undefined, { deployment: "check" }), res)
    expect(mocks.read).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      deployedContentHash: publishedContentHash(content),
    })
  })
  it("rejects unauthenticated load and publish before repository access", async () => {
    mocks.verify.mockRejectedValue(
      new AdminRequestUnauthorizedError("Cloudflare Access token missing"),
    )
    const res = response()
    await contentHandler(request(), res)
    expect(res.status).toHaveBeenCalledWith(401)
    await publishHandler(request("POST", { content, baseSha: "old-sha" }), res)
    expect(res.status).toHaveBeenLastCalledWith(401)
    expect(mocks.read).not.toHaveBeenCalled()
    expect(mocks.publish).not.toHaveBeenCalled()
  })
  it("saves validated shared layouts with an optimistic revision and returns deployment fingerprint", async () => {
    const res = response()
    await publishHandler(request("POST", { content, baseSha: "old-sha" }), res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mocks.publish).toHaveBeenCalledWith(
      expect.anything(),
      formatPublishedContentModule(content),
      "old-sha",
    )
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ sha: "new-sha", contentHash: publishedContentHash(content) }),
    )
    expect(parsePublishedContentModule(formatPublishedContentModule(content))).toEqual(content)
  })
  it("returns a recoverable conflict instead of overwriting a newer revision", async () => {
    mocks.publish.mockRejectedValue(new GitHubPublishConflictError("conflict"))
    const res = response()
    await publishHandler(request("POST", { content, baseSha: "stale" }), res)
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("local draft is preserved") }),
    )
  })
  it("returns a field path for validation failures without publishing", async () => {
    const res = response()
    await publishHandler(
      request("POST", {
        content: { ...content, works: [{ ...content.works[0], title: "" }] },
        baseSha: "old",
      }),
      res,
    )
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("works.0.title") }),
    )
    expect(mocks.publish).not.toHaveBeenCalled()
  })
})
