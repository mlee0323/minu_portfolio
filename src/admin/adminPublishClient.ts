import { z } from "zod"
import { requestAdminJson } from "./adminApiClient"
import { loadDeploymentStatus } from "./adminDeploymentClient"
import { AdminDeploymentFailedError } from "./adminDeploymentTypes"
import { parseAdminContent } from "./adminSchema"
import type { AdminContent } from "./adminTypes"

const publishResponseSchema = z.object({
  ok: z.literal(true),
  sha: z.string().min(1),
  commitSha: z.string().min(1),
  commitUrl: z.string().min(1),
  path: z.string().min(1),
  contentHash: z.string().min(1),
})
const contentResponseSchema = z.object({
  ok: z.literal(true),
  content: z.unknown(),
  sha: z.string().min(1),
  contentHash: z.string(),
  deployedContentHash: z.string(),
})
const deploymentResponseSchema = z.object({ ok: z.literal(true), deployedContentHash: z.string() })
export type AdminPublishResult = z.infer<typeof publishResponseSchema>

export async function loadPublishedAdminContent() {
  const response = contentResponseSchema.parse(await requestAdminJson("/api/admin/content"))
  return { ...response, content: parseAdminContent(response.content) }
}

export async function publishAdminContent(
  content: AdminContent,
  baseSha: string,
): Promise<AdminPublishResult> {
  return publishResponseSchema.parse(
    await requestAdminJson("/api/admin/publish", { method: "POST", json: { content, baseSha } }),
  )
}

export async function waitForPublishedDeployment(
  contentHash: string,
  signal: AbortSignal,
  commitSha?: string,
): Promise<boolean> {
  const deadline = Date.now() + 180_000
  while (!signal.aborted && Date.now() < deadline) {
    const deployed = deploymentResponseSchema.parse(
      await requestAdminJson(`/api/admin/content?deployment=${encodeURIComponent(contentHash)}`, {
        signal,
      }),
    )
    const status = commitSha === undefined ? null : await loadDeploymentStatus(commitSha, signal)
    if (status?.state === "error") throw new AdminDeploymentFailedError(status.description)
    if (
      deployed.deployedContentHash === contentHash &&
      (status === null || status.state === "success")
    )
      return true
    await new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer)
        signal.removeEventListener("abort", done)
        resolve()
      }
      const timer = setTimeout(done, 3000)
      signal.addEventListener("abort", done, { once: true })
      if (signal.aborted) done()
    })
  }
  return false
}
