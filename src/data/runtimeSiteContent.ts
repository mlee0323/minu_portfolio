import { publishedAdminContent } from "./publishedContent"
import { createPublishedSiteContent, type PublishedSiteContent } from "./publishedSiteContent"

// Public pages reflect the content included in the current deployment.
// Browser drafts belong to the editor until the publish API commits them.
const deployedSiteContent = createPublishedSiteContent(publishedAdminContent)

export function loadRuntimeSiteContent(): PublishedSiteContent {
  return deployedSiteContent
}

export function useRuntimeSiteContent(): PublishedSiteContent {
  return deployedSiteContent
}
