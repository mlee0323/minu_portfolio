import { ArrowLeft, Database, RotateCcw, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { AdminArchivePanel } from "./AdminArchivePanel"
import { AdminDashboard } from "./AdminDashboard"
import { AdminIndexPanel } from "./AdminIndexPanel"
import { AdminWorksPanel } from "./AdminWorksPanel"
import {
  type AdminAccessSession,
  loadAdminAccessSession,
  shouldVerifyAdminAccess,
} from "./adminAccessClient"
import { publishAdminContent } from "./adminPublishClient"
import { AdminContentSchema } from "./adminSchema"
import { loadAdminContent, resetAdminContent, saveAdminContent } from "./adminStore"
import type { AdminContent } from "./adminTypes"
import "../styles/admin.css"
import "../styles/adminPremium.css"

const adminRoutes = ["dashboard", "works", "archive", "index-contact"] as const
type AdminRoute = (typeof adminRoutes)[number]

function assertNever(value: never): never {
  throw new Error(`Unhandled admin route: ${value}`)
}

function routeFromPath(pathname: string): AdminRoute {
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
    default:
      return assertNever(route)
  }
}

export function AdminApp() {
  const [accessSession, setAccessSession] = useState<AdminAccessSession | null>(() =>
    shouldVerifyAdminAccess() ? null : { status: "allowed", email: "local" },
  )
  const [content, setContent] = useState<AdminContent>(() => loadAdminContent())
  const [route, setRoute] = useState<AdminRoute>(() => routeFromPath(window.location.pathname))
  const [message, setMessage] = useState("Local draft is ready.")
  const [isSaving, setIsSaving] = useState(false)

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
  const saveDraft = () => {
    const result = AdminContentSchema.safeParse(content)
    if (!result.success) {
      setMessage(result.error.issues[0]?.message ?? "Draft validation failed.")
      return
    }

    try {
      saveAdminContent(result.data)
      if (!shouldVerifyAdminAccess()) {
        setMessage("Draft saved locally. Production publish runs after Cloudflare login.")
        return
      }

      setIsSaving(true)
      setMessage("Publishing content...")
      void publishAdminContent(result.data)
        .then((publishResult) => {
          setMessage(`Published ${publishResult.path} at ${publishResult.commitSha.slice(0, 7)}.`)
        })
        .catch((error: unknown) => {
          setMessage(error instanceof Error ? error.message : "Publish failed.")
        })
        .finally(() => {
          setIsSaving(false)
        })
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message)
        return
      }
      throw error
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
        <div className="admin-actions">
          <button className="pill-button" type="button" onClick={resetDraft}>
            <RotateCcw size={15} />
            Reset
          </button>
          <button
            className="pill-button pill-button--accent"
            type="button"
            disabled={isSaving}
            onClick={saveDraft}
          >
            <Save size={15} />
            {isSaving ? "Publishing" : "Save draft"}
          </button>
        </div>
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
          {route === "dashboard" ? <AdminDashboard content={content} /> : null}
          {route === "works" ? <AdminWorksPanel content={content} onChange={setContent} /> : null}
          {route === "archive" ? (
            <AdminArchivePanel content={content} onChange={setContent} />
          ) : null}
          {route === "index-contact" ? (
            <AdminIndexPanel content={content} onChange={setContent} />
          ) : null}
        </div>
      </div>
    </main>
  )
}
