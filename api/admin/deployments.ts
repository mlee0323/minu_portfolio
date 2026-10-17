import type { VercelRequest, VercelResponse } from "@vercel/node"
import { z } from "zod"
import {
  messageForAdminRequestError,
  statusForAdminRequestError,
  verifyAdminRequest,
} from "../../src/server/adminRequestAuth.ts"
import { readDeploymentHistory, readDeploymentStatus } from "../../src/server/deploymentHistory.ts"
import { readGitHubPublishConfig } from "../../src/server/githubPublish.ts"
import { publishedContentFilePath } from "../../src/server/publishedContentSource.ts"

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Cache-Control", "no-store")
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET")
    response.status(405).json({ ok: false, error: "Method not allowed" })
    return
  }
  try {
    await verifyAdminRequest(request.headers, process.env)
    const config = readGitHubPublishConfig(process.env, publishedContentFilePath)
    if (request.query["sha"] !== undefined) {
      const sha = z
        .string()
        .regex(/^[a-f0-9]{40}$/i)
        .parse(request.query["sha"])
      response.status(200).json({ ok: true, deployment: await readDeploymentStatus(config, sha) })
      return
    }
    const page = z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .parse(request.query["page"] ?? 1)
    const history = await readDeploymentHistory(config, page)
    response.status(200).json({
      ok: true,
      ...history,
      deployedCommitSha: process.env["VERCEL_GIT_COMMIT_SHA"] ?? null,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      response.status(400).json({ ok: false, error: "Invalid deployment history request" })
      return
    }
    const status = statusForAdminRequestError(error)
    console.error("[admin-deployments] lookup failed", {
      status,
      name: error instanceof Error ? error.name : "UnknownError",
    })
    response.status(status === 500 ? 502 : status).json({
      ok: false,
      error:
        status === 500
          ? "배포 기록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요."
          : messageForAdminRequestError(error),
    })
  }
}
