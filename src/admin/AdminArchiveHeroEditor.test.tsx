import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { createPublishedSiteContent } from "../data/publishedSiteContent"
import { publishedImageAssetPaths } from "../server/privateImageAssets"
import { AdminArchiveHeroEditor } from "./AdminArchiveHeroEditor"
import { uploadAdminImageAsset } from "./adminBlobUpload"
import { createBlankArchiveRelease } from "./adminFactories"
import { AdminContentSchema, parseAdminContent } from "./adminSchema"
import { createSeedAdminContent } from "./adminSeed"
import type { AdminArchiveRelease } from "./adminTypes"

vi.mock("./adminBlobUpload", () => ({ uploadAdminImageAsset: vi.fn() }))

function editor() {
  let current = createBlankArchiveRelease(0)
  const originalTracks = current.tracks
  function Harness() {
    const [release, setRelease] = useState(current)
    current = release
    return (
      <AdminArchiveHeroEditor
        release={release}
        releases={[release]}
        onSelectRelease={() => {}}
        onAddRelease={() => {}}
        onChange={(patch) => setRelease((previous) => ({ ...previous, ...patch }))}
      />
    )
  }
  render(<Harness />)
  return { current: () => current, originalTracks }
}

describe("archive header editing", () => {
  it("keeps legacy releases unchanged until a layout is edited, and stores separate responsive layouts", () => {
    const state = editor()
    expect(state.current().hero).toBeUndefined()
    const settings = within(screen.getByRole("complementary", { name: "Header element settings" }))
    fireEvent.change(settings.getByLabelText("X", { exact: true }), { target: { value: "80" } })
    expect(state.current().hero?.elements[0]?.layouts.desktop.x).toBe(80)
    expect(state.current().hero?.elements[0]?.layouts.mobile.x).toBe(20)
    fireEvent.click(screen.getByRole("button", { name: "Mobile", exact: true }))
    fireEvent.change(settings.getByLabelText("X", { exact: true }), { target: { value: "30" } })
    expect(state.current().hero?.elements[0]?.layouts.desktop.x).toBe(80)
    expect(state.current().hero?.elements[0]?.layouts.mobile.x).toBe(30)
    expect(state.current().tracks).toBe(state.originalTracks)
  })

  it("edits the real release title and persists typography through validation and publication mapping", () => {
    const state = editor()
    const elements = within(screen.getByRole("complementary", { name: "Header elements" }))
    fireEvent.click(elements.getByRole("button", { name: /^Release title/ }))
    fireEvent.change(screen.getByLabelText("Header text"), { target: { value: "Edited release" } })
    fireEvent.change(screen.getByLabelText("Font size"), { target: { value: "88" } })
    const content = AdminContentSchema.parse({
      ...createSeedAdminContent(),
      archiveReleases: [{ ...state.current(), status: "published" }],
    })
    const reloaded = parseAdminContent(JSON.parse(JSON.stringify(content)))
    const published = createPublishedSiteContent(reloaded).archiveReleases[0]
    expect(published?.title).toBe("Edited release")
    expect(
      published?.hero?.elements.find((element) => element.kind === "title")?.styles.desktop
        .fontSize,
    ).toBe(88)
    expect(published?.tracks).toHaveLength(state.originalTracks.length)
  })

  it("allows keyboard movement, adding custom text and restoring the original responsive layout", () => {
    const state = editor()
    fireEvent.keyDown(screen.getByRole("button", { name: "Select Cover image" }), {
      key: "ArrowRight",
      shiftKey: true,
    })
    expect(state.current().hero?.elements[0]?.layouts.desktop.x).toBe(10)
    fireEvent.click(screen.getByRole("button", { name: "Text", exact: true }))
    fireEvent.change(screen.getByLabelText("Header text"), { target: { value: "A new caption" } })
    expect(state.current().hero?.elements.find((element) => element.kind === "text")?.text).toBe(
      "A new caption",
    )
    fireEvent.click(screen.getByRole("button", { name: "Restore original layout" }))
    expect(state.current().hero).toBeUndefined()
    expect(state.current().tracks).toBe(state.originalTracks)
  })

  it("adds private uploaded header images and exposes them only for published releases", async () => {
    vi.mocked(uploadAdminImageAsset).mockResolvedValue({
      src: "/api/assets?pathname=admin-assets%2F123-header.jpg",
      alt: "Header photo",
      width: 1200,
      height: 800,
    })
    const state = editor()
    fireEvent.change(screen.getByLabelText(/Add header image/), {
      target: { files: [new File(["image"], "header.jpg", { type: "image/jpeg" })] },
    })
    await waitFor(() =>
      expect(state.current().hero?.elements.some((element) => element.alt === "Header photo")).toBe(
        true,
      ),
    )
    const draft = { ...createSeedAdminContent(), archiveReleases: [state.current()] }
    expect(publishedImageAssetPaths(draft).has("admin-assets/123-header.jpg")).toBe(false)
    const published: AdminArchiveRelease = { ...state.current(), status: "published" }
    expect(
      publishedImageAssetPaths({ ...draft, archiveReleases: [published] }).has(
        "admin-assets/123-header.jpg",
      ),
    ).toBe(true)
    expect(state.current().tracks).toBe(state.originalTracks)
  })
})
