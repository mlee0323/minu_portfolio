import { z } from "zod"

export const deploymentStateSchema = z.enum(["pending", "success", "error", "unknown"])
export type DeploymentState = z.infer<typeof deploymentStateSchema>
export const deploymentStateLabels: Record<DeploymentState, string> = {
  pending: "진행중",
  success: "완료",
  error: "오류",
  unknown: "확인 필요",
}
export const deploymentStatusSchema = z.object({
  state: deploymentStateSchema,
  description: z.string(),
  detailsUrl: z.string().nullable(),
  updatedAt: z.string().nullable(),
})
export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>
export const deploymentRecordSchema = deploymentStatusSchema.extend({
  sha: z.string(),
  title: z.string(),
  createdAt: z.string(),
  author: z.string(),
  commitUrl: z.string(),
  source: z.enum(["admin", "code"]),
})
export type DeploymentRecord = z.infer<typeof deploymentRecordSchema>
export const deploymentHistorySchema = z.object({
  ok: z.literal(true),
  entries: z.array(deploymentRecordSchema),
  page: z.number(),
  hasMore: z.boolean(),
  deployedCommitSha: z.string().nullable(),
  checkedAt: z.string(),
})
export type DeploymentHistory = z.infer<typeof deploymentHistorySchema>
export class AdminDeploymentFailedError extends Error {
  readonly name = "AdminDeploymentFailedError"
}
