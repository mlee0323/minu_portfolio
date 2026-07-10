import type { AdminContent } from "../admin/adminTypes.ts"

export const publishedContentFilePath = "src/data/publishedContent.ts"

export function formatPublishedContentModule(content: AdminContent): string {
  return [
    'import type { AdminContent } from "../admin/adminTypes"',
    "",
    "// allow: SIZE_OK - generated published content table edited through the admin publish API.",
    `export const publishedAdminContent = ${JSON.stringify(content, null, 2)} satisfies AdminContent`,
    "",
  ].join("\n")
}
