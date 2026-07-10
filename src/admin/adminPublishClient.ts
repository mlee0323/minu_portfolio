import ky from "ky"
import { z } from "zod"
import type { AdminContent } from "./adminTypes"

const publishResponseSchema = z.object({
  ok: z.literal(true),
  commitSha: z.string().min(1),
  commitUrl: z.string().min(1),
  path: z.string().min(1),
})

export type AdminPublishResult = z.infer<typeof publishResponseSchema>

export async function publishAdminContent(content: AdminContent): Promise<AdminPublishResult> {
  return publishResponseSchema.parse(
    await ky
      .post("/api/admin/publish", {
        json: { content },
        retry: { limit: 1 },
        timeout: 30_000,
      })
      .json(),
  )
}
