import type { AdminContent } from "../admin/adminTypes.ts"

export const publishedContentFilePath = "src/data/publishedContent.ts"

export function formatPublishedContentModule(content: AdminContent): string {
  return [
    'import type { AdminContent } from "../admin/adminTypes"',
    "",
    "// allow: SIZE_OK - generated published content table edited through the admin publish API.",
    `export const publishedAdminContent = ${JSON.stringify(parseAdminContent(content), null, 2)} satisfies AdminContent`,
    "",
  ].join("\n")
}

export function parsePublishedContentModule(source: string): AdminContent {
  const match = /export const publishedAdminContent = ([\s\S]+) satisfies AdminContent\s*$/.exec(
    source,
  )
  if (match?.[1] === undefined)
    throw new Error("Published content source has an unsupported format")
  return parseAdminContent(JSON.parse(match[1]))
}

export function publishedContentHash(content: AdminContent): string {
  return createHash("sha256")
    .update(JSON.stringify(parseAdminContent(content)))
    .digest("hex")
}

import { createHash } from "node:crypto"
import { parseAdminContent } from "../admin/adminSchema.ts"
