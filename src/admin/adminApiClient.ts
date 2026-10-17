import ky, { HTTPError } from "ky"

export async function requestAdminJson(path: string, options: Parameters<typeof ky>[1] = {}) {
  try {
    const response = await ky(path, {
      ...options,
      credentials: "include",
      retry: 0,
      timeout: 60_000,
      headers: { Accept: "application/json" },
    })
    if (!response.headers.get("content-type")?.includes("application/json")) {
      throw new Error(
        "Admin authentication expired or returned a login page. Sign in again; your local draft is preserved.",
      )
    }
    return await response.json()
  } catch (error) {
    if (error instanceof HTTPError) {
      const body: unknown = await error.response.json().catch(() => null)
      if (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof body.error === "string"
      )
        throw new Error(body.error)
      throw new Error(
        `Admin request failed (HTTP ${error.response.status}). Your local draft is preserved.`,
      )
    }
    throw error
  }
}
