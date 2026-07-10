import { useEffect, useState } from "react"
import {
  adminContentChangedEvent,
  adminContentStorageKey,
  loadAdminContent,
} from "../admin/adminStore"
import { createPublishedSiteContent, type PublishedSiteContent } from "./publishedSiteContent"

export function loadRuntimeSiteContent(): PublishedSiteContent {
  return createPublishedSiteContent(loadAdminContent())
}

export function useRuntimeSiteContent(): PublishedSiteContent {
  const [content, setContent] = useState<PublishedSiteContent>(loadRuntimeSiteContent)

  useEffect(() => {
    const refreshContent = () => setContent(loadRuntimeSiteContent())
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === adminContentStorageKey) {
        refreshContent()
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(adminContentChangedEvent, refreshContent)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(adminContentChangedEvent, refreshContent)
    }
  }, [])

  return content
}
