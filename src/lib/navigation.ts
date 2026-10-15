export function navigateWithinPublicApp(href: string): void {
  window.history.pushState(null, "", href)
  window.dispatchEvent(new PopStateEvent("popstate"))
}
