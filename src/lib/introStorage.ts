const INTRO_SEEN_KEY = "minu:intro-seen:v1"
const INTRO_COOKIE_NAME = "minu_intro_seen"
const INTRO_COOKIE_VALUE = "1"
const INTRO_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined"
}

function hasCookieMarker(): boolean {
  if (!canUseBrowserStorage()) {
    return false
  }

  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie === `${INTRO_COOKIE_NAME}=${INTRO_COOKIE_VALUE}`)
}

export function hasSeenIntro(): boolean {
  if (!canUseBrowserStorage()) {
    return false
  }

  try {
    if (window.localStorage.getItem(INTRO_SEEN_KEY) === INTRO_COOKIE_VALUE) {
      return true
    }
  } catch (error: unknown) {
    if (!(error instanceof DOMException)) {
      throw error
    }
  }

  return hasCookieMarker()
}

export function markIntroSeen(): void {
  if (!canUseBrowserStorage()) {
    return
  }

  try {
    window.localStorage.setItem(INTRO_SEEN_KEY, INTRO_COOKIE_VALUE)
  } catch (error: unknown) {
    if (!(error instanceof DOMException)) {
      throw error
    }
  }

  // biome-ignore lint/suspicious/noDocumentCookie: This is a non-sensitive first-visit marker, not identity or auth data.
  document.cookie = `${INTRO_COOKIE_NAME}=${INTRO_COOKIE_VALUE}; Max-Age=${String(
    INTRO_MAX_AGE_SECONDS,
  )}; Path=/; SameSite=Lax`
}
