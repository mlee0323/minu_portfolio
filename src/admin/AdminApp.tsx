import { ArrowLeft, Database, RotateCcw, Save } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { AdminArchivePanel } from "./AdminArchivePanel"
import { AdminDashboard } from "./AdminDashboard"
import { AdminDeploymentHistory } from "./AdminDeploymentHistory"
import { AdminIndexPanel } from "./AdminIndexPanel"
import { AdminWorksPanel } from "./AdminWorksPanel"
import {
  type AdminAccessSession,
  loadAdminAccessSession,
  shouldVerifyAdminAccess,
} from "./adminAccessClient"
import { AdminDeploymentFailedError } from "./adminDeploymentTypes"
import {
  loadPublishedAdminContent,
  publishAdminContent,
  waitForPublishedDeployment,
} from "./adminPublishClient"
import { AdminContentSchema } from "./adminSchema"
import { createSeedAdminContent } from "./adminSeed"
import {
  loadAdminContent,
  markAdminContentPublished,
  recoverableAdminContent,
  resetAdminContent,
  saveAdminContent,
} from "./adminStore"
import type { AdminContent } from "./adminTypes"
import "../styles/admin.css"
import "../styles/adminPremium.css"

const adminRoutes = ["dashboard", "works", "archive", "index-contact", "deployments"] as const
type AdminRoute = (typeof adminRoutes)[number]

function assertNever(value: never): never {
  throw new Error(`Unhandled admin route: ${value}`)
}

function routeFromPath(pathname: string): AdminRoute {
  if (pathname.endsWith("/deployments")) return "deployments"
  if (pathname.endsWith("/works")) {
    return "works"
  }
  if (pathname.endsWith("/archive")) {
    return "archive"
  }
  if (pathname.endsWith("/index-contact")) {
    return "index-contact"
  }
  return "dashboard"
}

function pathForRoute(route: AdminRoute): string {
  switch (route) {
    case "dashboard":
      return "/admin"
    case "works":
      return "/admin/works"
    case "archive":
      return "/admin/archive"
    case "index-contact":
      return "/admin/index-contact"
    case "deployments":
      return "/admin/deployments"
    default:
      return assertNever(route)
  }
}

function routeLabel(route: AdminRoute): string {
  switch (route) {
    case "dashboard":
      return "Overview"
    case "works":
      return "Works"
    case "archive":
      return "Archive & Sound"
    case "index-contact":
      return "Index"
    case "deployments":
      return "배포 히스토리"
    default:
      return assertNever(route)
  }
}

function contentSnapshot(content: AdminContent): string {
  const result = AdminContentSchema.safeParse(content)
  return JSON.stringify(result.success ? result.data : content)
}

export function AdminApp() {
  const [accessSession, setAccessSession] = useState<AdminAccessSession | null>(() =>
    shouldVerifyAdminAccess() ? null : { status: "allowed", email: "local" },
  )
  const [content, setContent] = useState<AdminContent>(() =>
    shouldVerifyAdminAccess() ? createSeedAdminContent() : loadAdminContent(),
  )
  const [route, setRoute] = useState<AdminRoute>(() => routeFromPath(window.location.pathname))
  const [message, setMessage] = useState("Local draft is ready.")
  const [isSaving, setIsSaving] = useState(false)
  const [latestCommitSha, setLatestCommitSha] = useState<string | null>(null)
  const [baseSha, setBaseSha] = useState<string | null>(null)
  const [loadingContent, setLoadingContent] = useState(shouldVerifyAdminAccess())
  const [loadError, setLoadError] = useState("")
  const [recoveryDraft, setRecoveryDraft] = useState<AdminContent | null>(null)
  const contentRef = useRef(content)
  contentRef.current = content
  const savedSnapshot = useRef(contentSnapshot(content))
  const publishing = useRef(false)
  const deploymentCheck = useRef<AbortController | null>(null)

  const loadPublished = useCallback(async () => {
    setLoadingContent(true)
    setLoadError("")
    try {
      // Keep local changes recoverable when explicitly reloading current published content.
      if (contentSnapshot(contentRef.current) !== savedSnapshot.current) {
        try {
          saveAdminContent(contentRef.current)
        } catch {
          /* Do not block loading current server content. */
        }
      }
      const current = await loadPublishedAdminContent()
      setRecoveryDraft(recoverableAdminContent(current.content))
      setContent(current.content)
      savedSnapshot.current = contentSnapshot(current.content)
      setBaseSha(current.sha)
      setMessage(
        current.contentHash === current.deployedContentHash
          ? "Current published content loaded. Website is up to date."
          : "Latest saved content loaded. Website deployment is still updating.",
      )
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load published content.")
      setBaseSha(null)
    } finally {
      setLoadingContent(false)
    }
  }, [])

  useEffect(() => {
    if (shouldVerifyAdminAccess() && accessSession?.status === "allowed") void loadPublished()
    return () => {
      deploymentCheck.current?.abort()
    }
  }, [accessSession, loadPublished])

  const updateContent = (next: AdminContent) => {
    setContent(next)
    if (!publishing.current) setMessage("Unsaved changes. Save & publish to update the website.")
  }

  useEffect(() => {
    if (!shouldVerifyAdminAccess()) {
      return
    }

    let isActive = true

    void loadAdminAccessSession()
      .then((session) => {
        if (isActive) {
          setAccessSession(session)
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setAccessSession({
            status: "blocked",
            message: error instanceof Error ? error.message : "Admin access could not be verified.",
          })
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => setRoute(routeFromPath(window.location.pathname))
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const navigate = (nextRoute: AdminRoute) => {
    window.history.pushState(null, "", pathForRoute(nextRoute))
    setRoute(nextRoute)
  }
  const saveDraft = async () => {
    if (publishing.current) return
    const result = AdminContentSchema.safeParse(content)
    if (!result.success) {
      const issue = result.error.issues[0]
      setMessage(
        `${issue?.path.join(".") || "Content"}: ${issue?.message ?? "Draft validation failed."}`,
      )
      return
    }
    let localSaved = false
    try {
      saveAdminContent(result.data)
      localSaved = true
    } catch {
      /* Server save can still succeed if browser storage is full. */
    }
    if (!shouldVerifyAdminAccess()) {
      setMessage(
        localSaved
          ? "Draft saved locally. Production publish runs after Cloudflare login."
          : "Could not save the local draft. Browser storage is unavailable.",
      )
      return
    }
    if (baseSha === null) {
      setMessage("Load current published content before publishing. Your draft is preserved.")
      return
    }
    publishing.current = true
    setIsSaving(true)
    setMessage("Saving content to the server…")
    let savedCommit = ""
    try {
      const published = await publishAdminContent(result.data, baseSha)
      savedCommit = published.commitSha.slice(0, 7)
      setLatestCommitSha(published.commitSha)
      setBaseSha(published.sha)
      savedSnapshot.current = contentSnapshot(result.data)
      try {
        markAdminContentPublished(result.data)
      } catch {
        /* Publishing already succeeded. */
      }
      setMessage(`Saved ${savedCommit}. Updating the website…`)
      const check = new AbortController()
      deploymentCheck.current = check
      const ready = await waitForPublishedDeployment(
        published.contentHash,
        check.signal,
        published.commitSha,
      )
      if (check.signal.aborted) return
      const dirty = contentSnapshot(contentRef.current) !== savedSnapshot.current
      setMessage(
        ready
          ? `Saved ${savedCommit}. Website updated.${dirty ? " New edits remain unsaved." : ""}`
          : `Saved ${savedCommit}. Deployment is still pending. Your content is saved; refresh later to check the website.`,
      )
      setRecoveryDraft(null)
    } catch (error) {
      setMessage(
        savedCommit
          ? error instanceof AdminDeploymentFailedError
            ? `Saved ${savedCommit}. Deployment failed: ${error.message} 배포 히스토리에서 상세 내용을 확인하세요.`
            : `Saved ${savedCommit}, but deployment verification failed. ${error instanceof Error ? error.message : "Check the website later."}`
          : `${error instanceof Error ? error.message : "Publish failed."}${localSaved ? " Your local draft is saved." : " Keep this page open to preserve your edits."}`,
      )
    } finally {
      publishing.current = false
      setIsSaving(false)
    }
  }
  const resetDraft = () => {
    const nextContent = resetAdminContent()
    setContent(nextContent)
    setMessage("Draft reset to the current hardcoded site content.")
  }

  if (accessSession === null) {
    return (
      <main className="admin-shell admin-access">
        <p className="admin-status">
          <Database size={15} />
          Checking admin access...
        </p>
      </main>
    )
  }

  if (accessSession.status === "blocked") {
    return (
      <main className="admin-shell admin-access">
        <p className="admin-status">
          <Database size={15} />
          {accessSession.message}
        </p>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <a className="admin-brand" href="/">
          <ArrowLeft size={16} />
          <span>Public site</span>
        </a>
        <div className="admin-topbar__route">
          <span>
            {accessSession.email === "local" ? "Minu content studio" : accessSession.email}
          </span>
          <strong>{routeLabel(route)}</strong>
        </div>
        {route !== "deployments" ? (
          <div className="admin-actions">
            <button
              className="pill-button"
              type="button"
              disabled={isSaving || loadingContent}
              onClick={shouldVerifyAdminAccess() ? () => void loadPublished() : resetDraft}
            >
              <RotateCcw size={15} />
              {shouldVerifyAdminAccess() ? "Reload published" : "Reset"}
            </button>
            <button
              className="pill-button pill-button--accent"
              type="button"
              disabled={
                isSaving || loadingContent || (shouldVerifyAdminAccess() && baseSha === null)
              }
              onClick={saveDraft}
            >
              <Save size={15} />
              {isSaving
                ? "Saving / updating site…"
                : shouldVerifyAdminAccess()
                  ? "Save & publish"
                  : "Save draft"}
            </button>
          </div>
        ) : null}
      </header>

      <div className="admin-layout">
        <nav className="admin-sidebar" aria-label="Admin sections">
          {adminRoutes.map((adminRoute) => (
            <button
              className={route === adminRoute ? "is-active" : ""}
              key={adminRoute}
              type="button"
              onClick={() => navigate(adminRoute)}
            >
              {routeLabel(adminRoute)}
            </button>
          ))}
        </nav>

        <div className="admin-content">
          <p className="admin-status admin-status--rail" aria-live="polite">
            <Database size={15} />
            {message}
          </p>
          {latestCommitSha !== null && route !== "deployments" ? (
            <button
              className="pill-button admin-deployments__shortcut"
              type="button"
              onClick={() => navigate("deployments")}
            >
              배포 상태 보기
            </button>
          ) : null}
          {recoveryDraft !== null ? (
            <div className="admin-recovery" role="status">
              <p>
                A different browser draft is preserved. The editor shows current published content.
              </p>
              <button
                className="pill-button"
                type="button"
                disabled={isSaving}
                onClick={() => {
                  updateContent(recoveryDraft)
                  setRecoveryDraft(null)
                }}
              >
                Restore browser draft
              </button>
            </div>
          ) : null}
          {route === "deployments" ? (
            <AdminDeploymentHistory latestCommitSha={latestCommitSha} />
          ) : loadingContent ? (
            <p>Loading current published content…</p>
          ) : loadError ? (
            <div className="admin-recovery" role="alert">
              <p>{loadError}</p>
              <button className="pill-button" type="button" onClick={() => void loadPublished()}>
                Retry loading published content
              </button>
            </div>
          ) : (
            <>
              {route === "dashboard" ? <AdminDashboard content={content} /> : null}
              {route === "works" ? (
                <AdminWorksPanel content={content} onChange={updateContent} />
              ) : null}
              {route === "archive" ? (
                <AdminArchivePanel content={content} onChange={updateContent} />
              ) : null}
              {route === "index-contact" ? (
                <AdminIndexPanel content={content} onChange={updateContent} />
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
