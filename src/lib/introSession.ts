const introSessionKey = "minu-intro-completed:v1"

export function hasCompletedIntro(): boolean {
  try {
    return window.sessionStorage.getItem(introSessionKey) === "1"
  } catch {
    return false
  }
}

export function rememberIntroEntry(): void {
  try {
    window.sessionStorage.setItem(introSessionKey, "1")
  } catch {
    // Storage restrictions must not prevent entry or playback.
  }
}
