import { z } from "zod"
import { requestAdminJson } from "./adminApiClient"
import { deploymentHistorySchema, deploymentStatusSchema } from "./adminDeploymentTypes"

export async function loadDeploymentHistory(page: number, signal?: AbortSignal) {
  return deploymentHistorySchema.parse(
    await requestAdminJson(`/api/admin/deployments?page=${page}`, signal ? { signal } : {}),
  )
}

export async function loadDeploymentStatus(sha: string, signal?: AbortSignal) {
  const response = z
    .object({ ok: z.literal(true), deployment: deploymentStatusSchema })
    .parse(
      await requestAdminJson(
        `/api/admin/deployments?sha=${encodeURIComponent(sha)}`,
        signal ? { signal } : {},
      ),
    )
  return response.deployment
}
