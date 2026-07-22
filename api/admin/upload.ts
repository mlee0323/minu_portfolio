import { type HandleUploadBody, handleUpload } from "@vercel/blob/client"
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { z } from "zod"
import {
  adminImageContentTypes,
  maxProductionAdminImageUploadBytes,
} from "../../src/admin/adminImageUploadConfig.ts"
import {
  messageForAdminRequestError,
  statusForAdminRequestError,
  verifyAdminRequest,
} from "../../src/server/adminRequestAuth.ts"

const putBlobResultSchema = z.object({
  url: z.string().min(1),
  downloadUrl: z.string().min(1),
  pathname: z.string().min(1),
  contentType: z.string().min(1),
  contentDisposition: z.string(),
  etag: z.string().min(1),
})

const handleUploadBodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("blob.generate-client-token"),
    payload: z.object({
      pathname: z.string().min(1),
      multipart: z.boolean(),
      clientPayload: z.string().nullable(),
    }),
  }),
  z.object({
    type: z.literal("blob.upload-completed"),
    payload: z.object({
      blob: putBlobResultSchema,
      tokenPayload: z.string().nullable().optional(),
    }),
  }),
])

const allowedContentTypes: string[] = [...adminImageContentTypes]

function parseHandleUploadBody(body: unknown): HandleUploadBody {
  const parsed = handleUploadBodySchema.parse(body)

  if (parsed.type === "blob.generate-client-token") {
    return {
      type: parsed.type,
      payload: {
        pathname: parsed.payload.pathname,
        multipart: parsed.payload.multipart,
        clientPayload: parsed.payload.clientPayload,
      },
    }
  }

  return {
    type: parsed.type,
    payload: {
      blob: parsed.payload.blob,
      tokenPayload: parsed.payload.tokenPayload ?? null,
    },
  }
}

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
    const body = parseHandleUploadBody(request.body)
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => ({
        addRandomSuffix: true,
        allowedContentTypes,
        maximumSizeInBytes: maxProductionAdminImageUploadBytes,
        tokenPayload: JSON.stringify({ email: session.email }),
      }),
      onUploadCompleted: async () => {},
    })

    sendJson(response, 200, result)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      sendJson(response, 400, { ok: false, error: "Upload request is invalid" })
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
