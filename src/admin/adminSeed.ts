import { publishedAdminContent } from "../data/publishedContent"
import type { AdminContent } from "./adminTypes"

export function createSeedAdminContent(): AdminContent {
  return publishedAdminContent
}
