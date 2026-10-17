import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AdminApp } from "./AdminApp"
import {
  loadPublishedAdminContent,
  publishAdminContent,
  waitForPublishedDeployment,
} from "./adminPublishClient"
import { createSeedAdminContent } from "./adminSeed"
import { adminContentStorageKey } from "./adminStore"

vi.mock("./adminAccessClient", () => ({
  shouldVerifyAdminAccess: () => true,
  loadAdminAccessSession: async () => ({ status: "allowed", email: "admin@example.com" }),
}))
vi.mock("./adminPublishClient", () => ({
  loadPublishedAdminContent: vi.fn(),
  publishAdminContent: vi.fn(),
  waitForPublishedDeployment: vi.fn(),
}))

const seed = createSeedAdminContent()
const release = seed.archiveReleases[1]
if (release === undefined) throw new Error("Expected seeded archive release")
const current = {
  ...seed,
  archiveReleases: [{ ...release, title: "Current published release" }],
}

beforeEach(() => {
  vi.resetAllMocks()
  window.localStorage.clear()
  window.history.replaceState(null, "", "/admin/archive")
  vi.mocked(loadPublishedAdminContent).mockResolvedValue({
    ok: true,
    content: current,
    sha: "current-sha",
    contentHash: "saved-hash",
    deployedContentHash: "saved-hash",
  })
  vi.mocked(publishAdminContent).mockResolvedValue({
    ok: true,
    sha: "new-sha",
    commitSha: "1234567890",
    commitUrl: "https://github.com/example/commit/1234567890",
    path: "src/data/publishedContent.ts",
    contentHash: "next-hash",
  })
  vi.mocked(waitForPublishedDeployment).mockResolvedValue(true)
})

describe("production admin content and publishing", () => {
  it("opens current server content and preserves an old browser draft for recovery", async () => {
    window.localStorage.setItem(adminContentStorageKey, JSON.stringify(seed))
    render(<AdminApp />)
    expect(await screen.findByRole("textbox", { name: "Release title", exact: true })).toHaveValue(
      "Current published release",
    )
    expect(screen.getByRole("button", { name: "Restore browser draft" })).toBeInTheDocument()
    expect(
      screen.getByRole("group", { name: "Web archive detail canvas" }).querySelectorAll("img"),
    ).toHaveLength(5)
    expect(window.localStorage.getItem(adminContentStorageKey)).toBe(JSON.stringify(seed))
  })
  it("saves the original file revision and waits for the deployed content before reporting completion", async () => {
    let done!: (ready: boolean) => void
    vi.mocked(waitForPublishedDeployment).mockImplementation(
      () =>
        new Promise((resolve) => {
          done = resolve
        }),
    )
    render(<AdminApp />)
    await screen.findByRole("textbox", { name: "Release title", exact: true })
    fireEvent.change(screen.getByRole("textbox", { name: "Release title", exact: true }), {
      target: { value: "New saved title" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save & publish" }))
    await screen.findByText("Saved 1234567. Updating the website…")
    expect(publishAdminContent).toHaveBeenCalledWith(
      expect.objectContaining({
        archiveReleases: [expect.objectContaining({ title: "New saved title" })],
      }),
      "current-sha",
    )
    expect(screen.queryByText(/Website updated/)).not.toBeInTheDocument()
    done(true)
    expect(await screen.findByText("Saved 1234567. Website updated.")).toBeInTheDocument()
    expect(
      JSON.parse(window.localStorage.getItem(adminContentStorageKey) ?? "{}").archiveReleases[0]
        .title,
    ).toBe("New saved title")
  })
  it("preserves a failed publish locally and displays the server error", async () => {
    vi.mocked(publishAdminContent).mockRejectedValue(
      new Error("The published content changed. Reload published content before saving."),
    )
    render(<AdminApp />)
    await screen.findByRole("textbox", { name: "Release title", exact: true })
    fireEvent.change(screen.getByRole("textbox", { name: "Release title", exact: true }), {
      target: { value: "Preserved title" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save & publish" }))
    expect(
      await screen.findByText(/The published content changed.*Your local draft is saved/),
    ).toBeInTheDocument()
    expect(
      JSON.parse(window.localStorage.getItem(adminContentStorageKey) ?? "{}").archiveReleases[0]
        .title,
    ).toBe("Preserved title")
    expect(waitForPublishedDeployment).not.toHaveBeenCalled()
  })
  it("does not enable publishing when current server content cannot load", async () => {
    vi.mocked(loadPublishedAdminContent).mockRejectedValue(
      new Error("Could not load published content"),
    )
    render(<AdminApp />)
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load published content")
    expect(screen.getByRole("button", { name: "Save & publish" })).toBeDisabled()
  })
  it("reports a deployment-check failure as saved content rather than a failed save", async () => {
    vi.mocked(waitForPublishedDeployment).mockRejectedValue(new Error("Connection lost"))
    render(<AdminApp />)
    await screen.findByRole("textbox", { name: "Release title", exact: true })
    fireEvent.click(screen.getByRole("button", { name: "Save & publish" }))
    expect(
      await screen.findByText("Saved 1234567, but deployment verification failed. Connection lost"),
    ).toBeInTheDocument()
  })
  it("distinguishes a saved commit from a deployment still pending", async () => {
    vi.mocked(waitForPublishedDeployment).mockResolvedValue(false)
    render(<AdminApp />)
    await screen.findByRole("textbox", { name: "Release title", exact: true })
    fireEvent.click(screen.getByRole("button", { name: "Save & publish" }))
    await waitFor(() =>
      expect(screen.getByText(/Saved 1234567\. Deployment is still pending/)).toBeInTheDocument(),
    )
  })
})
