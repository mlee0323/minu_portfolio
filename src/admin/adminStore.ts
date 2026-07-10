import { ZodError } from "zod"
import { AdminContentSchema, parseAdminContent } from "./adminSchema"
import { createSeedAdminContent } from "./adminSeed"
import type { AdminContent } from "./adminTypes"

export const adminContentStorageKey = "minu-admin-content:v1"
export const adminContentChangedEvent = "minu:admin-content-changed"

export class AdminContentStorageError extends Error {
  readonly name = "AdminContentStorageError"
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && window.localStorage !== undefined
}

function readStoredContent(): string | null {
  if (!canUseLocalStorage()) {
    return null
  }

  try {
    return window.localStorage.getItem(adminContentStorageKey)
  } catch (error: unknown) {
    if (error instanceof DOMException) {
      return null
    }

    throw error
  }
}

function notifyAdminContentChanged(): void {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(adminContentChangedEvent))
}

export function loadAdminContent(): AdminContent {
  const stored = readStoredContent()

  if (stored === null) {
    return createSeedAdminContent()
  }

  try {
    return parseAdminContent(JSON.parse(stored))
  } catch (error: unknown) {
    if (
      error instanceof SyntaxError ||
      error instanceof DOMException ||
      error instanceof ZodError
    ) {
      return createSeedAdminContent()
    }

    throw error
  }
}

export function saveAdminContent(content: AdminContent): void {
  if (!canUseLocalStorage()) {
    throw new AdminContentStorageError("Local draft storage is unavailable")
  }

  const parsed = AdminContentSchema.parse(content)

  try {
    window.localStorage.setItem(adminContentStorageKey, JSON.stringify(parsed))
    notifyAdminContentChanged()
  } catch (error: unknown) {
    if (error instanceof DOMException) {
      throw new AdminContentStorageError("Could not save the admin draft in this browser")
    }

    throw error
  }
}

export function resetAdminContent(): AdminContent {
  const content = createSeedAdminContent()

  if (!canUseLocalStorage()) {
    return content
  }

  try {
    window.localStorage.removeItem(adminContentStorageKey)
    notifyAdminContentChanged()
  } catch (error: unknown) {
    if (error instanceof DOMException) {
      return content
    }

    throw error
  }

  return content
}
