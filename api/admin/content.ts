import type { VercelRequest, VercelResponse } from "@vercel/node"
import { parseAdminContent } from "../../src/admin/adminSchema.ts"
import { publishedAdminContent } from "../../src/data/publishedContent.ts"
import {
  messageForAdminRequestError,
  statusForAdminRequestError,
  verifyAdminRequest,
} from "../../src/server/adminRequestAuth.ts"
import { readFileFromGitHub, readGitHubPublishConfig } from "../../src/server/githubPublish.ts"
import {
  parsePublishedContentModule,
  publishedContentFilePath,
  publishedContentHash,
} from "../../src/server/publishedContentSource.ts"

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Cache-Control", "no-store")
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET")
    response.status(405).json({ ok: false, error: "Method not allowed" })
    return
  }
  try {
    await verifyAdminRequest(request.headers, process.env)
    const deployedContentHash = publishedContentHash(parseAdminContent(publishedAdminContent))
    // Poll the deployed version without repeatedly downloading the repository file.
    if (request.query["deployment"] !== undefined) {
      response.status(200).json({ ok: true, deployedContentHash })
      return
    }
    const file = await readFileFromGitHub(
      readGitHubPublishConfig(process.env, publishedContentFilePath),
    )
    const content = parsePublishedContentModule(file.source)
    response.status(200).json({
      ok: true,
      content,
      sha: file.sha,
      contentHash: publishedContentHash(content),
      deployedContentHash,
    })
  } catch (error) {
    const status = statusForAdminRequestError(error)
    console.error("[admin-content] load failed", {
      status,
      name: error instanceof Error ? error.name : "UnknownError",
    })
    response.status(status === 500 ? 502 : status).json({
      ok: false,
      error:
        status === 500
          ? "Could not load published content. Your browser draft is preserved; retry loading before publishing."
          : messageForAdminRequestError(error),
    })
  }
}
