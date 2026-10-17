import type { VercelRequest, VercelResponse } from "@vercel/node"
import { HTTPError } from "ky"
import { z } from "zod"
import { AdminContentSchema } from "../../src/admin/adminSchema.ts"
import {
  messageForAdminRequestError,
  statusForAdminRequestError,
  verifyAdminRequest,
} from "../../src/server/adminRequestAuth.ts"
import {
  GitHubPublishConfigError,
  GitHubPublishConflictError,
  publishFileToGitHub,
  readGitHubPublishConfig,
} from "../../src/server/githubPublish.ts"
import {
  formatPublishedContentModule,
  publishedContentFilePath,
  publishedContentHash,
} from "../../src/server/publishedContentSource.ts"

const publishRequestSchema = z.object({
  content: AdminContentSchema,
  baseSha: z.string().min(1),
})

function sendJson(response: VercelResponse, status: number, body: Record<string, unknown>): void {
  response.setHeader("Cache-Control", "no-store")
  response.status(status).json(body)
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST")
    sendJson(response, 405, { ok: false, error: "Method not allowed" })
    return
  }

  try {
    const session = await verifyAdminRequest(request.headers, process.env)
    const body = publishRequestSchema.parse(request.body)
    const result = await publishFileToGitHub(
      readGitHubPublishConfig(process.env, publishedContentFilePath),
      formatPublishedContentModule(body.content),
      body.baseSha,
    )

    console.info("[admin-publish] saved", {
      commitSha: result.commitSha,
      contentHash: publishedContentHash(body.content),
    })
    sendJson(response, 200, {
      ok: true,
      email: session.email,
      sha: result.contentSha,
      commitSha: result.commitSha,
      commitUrl: result.commitUrl,
      path: result.path,
      contentHash: publishedContentHash(body.content),
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      sendJson(response, 400, {
        ok: false,
        error: `Content validation failed at ${error.issues[0]?.path.join(".") || "request"}: ${error.issues[0]?.message ?? "Invalid content"}`,
      })
      return
    }

    if (
      error instanceof GitHubPublishConflictError ||
      (error instanceof HTTPError && [409, 422].includes(error.response.status))
    ) {
      sendJson(response, 409, {
        ok: false,
        error:
          "The published content changed. Reload published content before saving; your local draft is preserved.",
      })
      return
    }

    if (error instanceof GitHubPublishConfigError) {
      sendJson(response, 500, { ok: false, error: error.message })
      return
    }

    const status = statusForAdminRequestError(error)

    if (status !== 500) {
      sendJson(response, status, { ok: false, error: messageForAdminRequestError(error) })
      return
    }

    console.error("[admin-publish] failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    })
    sendJson(response, 502, {
      ok: false,
      error:
        "Could not save to GitHub. Your local draft is preserved. Reload published content before retrying.",
    })
  }
}
