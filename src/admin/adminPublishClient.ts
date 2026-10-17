import ky, { HTTPError } from "ky"
import { z } from "zod"
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

async function requestJson(path: string, options: Parameters<typeof ky>[1] = {}) {
  try {
    const response = await ky(path, {
      ...options,
      credentials: "include",
      retry: 0,
      timeout: 60_000,
      headers: { Accept: "application/json" },
    })
    if (!response.headers.get("content-type")?.includes("application/json")) {
      throw new Error(
        "Admin authentication expired or returned a login page. Sign in again; your local draft is preserved.",
      )
    }
    return await response.json()
  } catch (error) {
    if (error instanceof HTTPError) {
      const body: unknown = await error.response.json().catch(() => null)
      if (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof body.error === "string"
      )
        throw new Error(body.error)
      throw new Error(
        `Admin request failed (HTTP ${error.response.status}). Your local draft is preserved.`,
      )
    }
    throw error
  }
}

export async function loadPublishedAdminContent() {
  const response = contentResponseSchema.parse(await requestJson("/api/admin/content"))
  return { ...response, content: parseAdminContent(response.content) }
}

export async function publishAdminContent(
  content: AdminContent,
  baseSha: string,
): Promise<AdminPublishResult> {
  return publishResponseSchema.parse(
    await requestJson("/api/admin/publish", { method: "POST", json: { content, baseSha } }),
  )
}

export async function waitForPublishedDeployment(
  contentHash: string,
  signal: AbortSignal,
): Promise<boolean> {
  const deadline = Date.now() + 180_000
  while (!signal.aborted && Date.now() < deadline) {
    const deployed = deploymentResponseSchema.parse(
      await requestJson(`/api/admin/content?deployment=${encodeURIComponent(contentHash)}`, {
        signal,
      }),
    )
    if (deployed.deployedContentHash === contentHash) return true
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
