// @vitest-environment node
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import handler from "../../api/assets"

const mocks = vi.hoisted(() => ({ get: vi.fn(), verifyAdminRequest: vi.fn() }))
vi.mock("@vercel/blob", () => ({ get: mocks.get }))
vi.mock("./adminRequestAuth.ts", () => ({
  verifyAdminRequest: mocks.verifyAdminRequest,
}))
vi.mock("../data/publishedContent.ts", () => ({
  publishedAdminContent: {
    works: [
      {
        status: "published",
        images: [{ src: "/api/assets?pathname=admin-assets%2F123-public.jpg" }],
        audio: { artworkUrl: "" },
      },
      {
        status: "draft",
        images: [{ src: "/api/assets?pathname=admin-assets%2F123-draft.jpg" }],
        audio: { artworkUrl: "" },
      },
    ],
    archiveReleases: [],
  },
}))

function request(pathname: string, headers = {}, method = "GET"): VercelRequest {
  return { method, query: { pathname }, headers } as unknown as VercelRequest
}
function response() {
  const result = {
    status: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
    write: vi.fn().mockReturnValue(true),
    end: vi.fn(),
    headersSent: false,
  }
  return result as typeof result & VercelResponse
}
function image(contentType = "image/jpeg") {
  return {
    statusCode: 200,
    blob: { contentType, size: 3 },
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]))
        controller.close()
      },
    }),
  }
}

describe("private image delivery", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "server-only-test-token")
    mocks.verifyAdminRequest.mockRejectedValue(new Error("Invalid Access JWT"))
  })
  afterEach(() => vi.unstubAllEnvs())

  it("streams published images without admin login and keeps the token server-side", async () => {
    mocks.get.mockResolvedValue(image())
    const res = response()
    await handler(request("admin-assets/123-public.jpg"), res)
    expect(mocks.verifyAdminRequest).not.toHaveBeenCalled()
    expect(mocks.get).toHaveBeenCalledWith("admin-assets/123-public.jpg", {
      access: "private",
      token: "server-only-test-token",
    })
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/jpeg")
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store")
    expect(res.write).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]))
    expect(JSON.stringify(res.setHeader.mock.calls)).not.toContain("server-only-test-token")
  })

  it("denies anonymous access to drafts before contacting Blob", async () => {
    const res = response()
    await handler(request("admin-assets/123-draft.jpg"), res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(mocks.get).not.toHaveBeenCalled()
  })

  it("verifies the signed Access cookie before serving a draft preview", async () => {
    mocks.verifyAdminRequest.mockResolvedValue({ email: "admin@example.com" })
    mocks.get.mockResolvedValue(image())
    const res = response()
    await handler(
      request("admin-assets/123-draft.jpg", { cookie: "other=value; CF_Authorization=signed-jwt" }),
      res,
    )
    expect(mocks.verifyAdminRequest).toHaveBeenCalledWith(
      expect.objectContaining({ "cf-access-jwt-assertion": "signed-jwt" }),
      process.env,
    )
    expect(res.write).toHaveBeenCalled()
  })

  it.each([
    "../secret",
    "admin-assets/../secret",
    "other/123-image.jpg",
    "https://external.test/image.jpg",
  ])("rejects unsafe paths: %s", async (pathname) => {
    const res = response()
    await handler(request(pathname), res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(mocks.get).not.toHaveBeenCalled()
  })

  it("does not serve active content from the private store", async () => {
    mocks.get.mockResolvedValue(image("image/svg+xml"))
    const res = response()
    await handler(request("admin-assets/123-public.jpg"), res)
    expect(res.status).toHaveBeenCalledWith(415)
    expect(res.write).not.toHaveBeenCalled()
  })

  it("supports HEAD without streaming a response body", async () => {
    mocks.get.mockResolvedValue(image())
    const res = response()
    await handler(request("admin-assets/123-public.jpg", {}, "HEAD"), res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.write).not.toHaveBeenCalled()
  })
})
