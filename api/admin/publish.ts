import type { VercelRequest, VercelResponse } from "@vercel/node"
import { z } from "zod"
import { AdminContentSchema } from "../../src/admin/adminSchema.ts"
import {
  messageForAdminRequestError,
  statusForAdminRequestError,
  verifyAdminRequest,
} from "../../src/server/adminRequestAuth.ts"
import {
  GitHubPublishConfigError,
  publishFileToGitHub,
  readGitHubPublishConfig,
} from "../../src/server/githubPublish.ts"
import {
  formatPublishedContentModule,
  publishedContentFilePath,
} from "../../src/server/publishedContentSource.ts"

const publishRequestSchema = z.object({
  content: AdminContentSchema,
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
    )

    sendJson(response, 200, {
      ok: true,
      email: session.email,
      commitSha: result.commitSha,
      commitUrl: result.commitUrl,
      path: result.path,
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      sendJson(response, 400, { ok: false, error: "Published content is invalid" })
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

    throw error
  }
}
