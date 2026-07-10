export type AdminAccessSession =
  | {
      readonly status: "allowed"
      readonly email: string
    }
  | {
      readonly status: "blocked"
      readonly message: string
    }

type AdminSessionResponse = {
  readonly authenticated?: unknown
  readonly email?: unknown
  readonly error?: unknown
}

function isLocalAdminHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
}

export function shouldVerifyAdminAccess(): boolean {
  return typeof window !== "undefined" && !isLocalAdminHost(window.location.hostname)
}

function blockedSession(message: string): AdminAccessSession {
  return { status: "blocked", message }
}

export async function loadAdminAccessSession(): Promise<AdminAccessSession> {
  const response = await fetch("/api/admin/session", {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  })
  const body = (await response.json().catch(() => ({}))) as AdminSessionResponse

  if (response.ok && body.authenticated === true && typeof body.email === "string") {
    return { status: "allowed", email: body.email }
  }

  if (typeof body.error === "string") {
    return blockedSession(body.error)
  }

  return blockedSession("Admin access could not be verified.")
}
