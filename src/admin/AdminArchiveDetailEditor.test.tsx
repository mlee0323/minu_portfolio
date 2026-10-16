import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { createPublishedSiteContent } from "../data/publishedSiteContent"
import { publishedImageAssetPaths } from "../server/privateImageAssets"
import { AdminArchiveDetailEditor } from "./AdminArchiveDetailEditor"
import { uploadAdminImageAsset } from "./adminBlobUpload"
import { createBlankArchiveRelease } from "./adminFactories"
import { AdminContentSchema, parseAdminContent } from "./adminSchema"
import { createSeedAdminContent } from "./adminSeed"
import type { AdminArchiveRelease } from "./adminTypes"

vi.mock("./adminBlobUpload", () => ({ uploadAdminImageAsset: vi.fn() }))

function editor() {
  let current: AdminArchiveRelease = {
    ...createBlankArchiveRelease(0),
    images: [
      {
        id: "legacy-image",
        src: "/api/assets?pathname=admin-assets%2Flegacy.jpg",
        alt: "Existing detail image",
        width: 1200,
        height: 800,
        aspectRatio: "1200 / 800",
        objectPosition: "top",
        sortOrder: 0,
      },
    ],
  }
  const original = current
  function Harness() {
    const [release, setRelease] = useState(current)
    current = release
    return (
      <AdminArchiveDetailEditor
        release={release}
        releases={[release]}
        onSelectRelease={() => {}}
        onAddRelease={() => {}}
        onChange={(patch) => setRelease((previous) => ({ ...previous, ...patch }))}
      />
    )
  }
  render(<Harness />)
  return { current: () => current, original }
}

describe("archive detail editing", () => {
  it("imports existing images only on edit and keeps separate Web/Mobile geometry", () => {
    const state = editor()
    expect(state.current().detail).toBeUndefined()
    const settings = within(screen.getByRole("complementary", { name: "Detail element settings" }))
    fireEvent.change(settings.getByLabelText("X", { exact: true }), { target: { value: "80" } })
    expect(state.current().detail?.elements[0]?.layouts.desktop.x).toBe(80)
    expect(state.current().detail?.elements[0]?.layouts.mobile.x).toBe(20)
    expect(state.current().detail?.elements[0]?.objectPosition).toBe("top")
    fireEvent.click(screen.getByRole("button", { name: "Mobile", exact: true }))
    fireEvent.change(settings.getByLabelText("X", { exact: true }), { target: { value: "30" } })
    expect(state.current().detail?.elements[0]?.layouts.desktop.x).toBe(80)
    expect(state.current().detail?.elements[0]?.layouts.mobile.x).toBe(30)
    expect(state.current().tracks).toBe(state.original.tracks)
    expect(screen.queryByRole("region", { name: "Archive header editor" })).not.toBeInTheDocument()
  })

  it("persists detail text and typography through validation, reload and publication without editing header fields", () => {
    const state = editor()
    fireEvent.click(screen.getByRole("button", { name: "Text", exact: true }))
    fireEvent.change(screen.getByLabelText("Detail text"), {
      target: { value: "A detail caption" },
    })
    fireEvent.change(screen.getByLabelText("Font size"), { target: { value: "88" } })
    const content = AdminContentSchema.parse({
      ...createSeedAdminContent(),
      archiveReleases: [{ ...state.current(), status: "published" }],
    })
    const reloaded = parseAdminContent(JSON.parse(JSON.stringify(content)))
    const published = createPublishedSiteContent(reloaded).archiveReleases[0]
    const text = published?.detail?.elements.find((element) => element.kind === "text")
    expect(text?.text).toBe("A detail caption")
    expect(text?.styles.desktop.fontSize).toBe(88)
    expect(text?.styles.mobile.fontSize).toBe(24)
    expect(published?.title).toBe(state.original.title)
    expect(published?.artworkUrl).toBe(state.original.artworkUrl)
    expect(published?.description).toBeUndefined()
    expect(published?.tracks).toHaveLength(state.original.tracks.length)
  })

  it("moves with keyboard and persists deletion of all detail elements without restoring legacy images", () => {
    const state = editor()
    fireEvent.keyDown(screen.getByRole("button", { name: "Select Existing detail image" }), {
      key: "ArrowRight",
      shiftKey: true,
    })
    expect(state.current().detail?.elements[0]?.layouts.desktop.x).toBe(110)
    fireEvent.click(screen.getByRole("button", { name: "Remove detail element" }))
    expect(state.current().detail?.elements).toHaveLength(0)
    expect(
      AdminContentSchema.safeParse({
        ...createSeedAdminContent(),
        archiveReleases: [state.current()],
      }).success,
    ).toBe(true)
    const paths = publishedImageAssetPaths({
      ...createSeedAdminContent(),
      archiveReleases: [{ ...state.current(), status: "published" }],
    })
    expect(paths.has("admin-assets/legacy.jpg")).toBe(false)
    expect(state.current().tracks).toBe(state.original.tracks)
  })

  it("adds private uploaded images, preserves concurrent text edits, and allows published image delivery only", async () => {
    let finish!: (value: Awaited<ReturnType<typeof uploadAdminImageAsset>>) => void
    vi.mocked(uploadAdminImageAsset).mockImplementation((_file, progress) => {
      progress?.(42)
      return new Promise((resolve) => {
        finish = resolve
      })
    })
    const state = editor()
    fireEvent.change(screen.getByLabelText(/Add detail image/), {
      target: { files: [new File(["image"], "detail.jpg", { type: "image/jpeg" })] },
    })
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "42")
    fireEvent.click(screen.getByRole("button", { name: "Text", exact: true }))
    fireEvent.change(screen.getByLabelText("Detail text"), {
      target: { value: "Written during upload" },
    })
    finish({
      src: "/api/assets?pathname=admin-assets%2F123-detail.jpg",
      alt: "Detail photo",
      width: 1200,
      height: 800,
    })
    await waitFor(() =>
      expect(
        state.current().detail?.elements.some((element) => element.alt === "Detail photo"),
      ).toBe(true),
    )
    expect(
      state.current().detail?.elements.some((element) => element.text === "Written during upload"),
    ).toBe(true)
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    const draft = { ...createSeedAdminContent(), archiveReleases: [state.current()] }
    expect(publishedImageAssetPaths(draft).has("admin-assets/123-detail.jpg")).toBe(false)
    expect(
      publishedImageAssetPaths({
        ...draft,
        archiveReleases: [{ ...state.current(), status: "published" }],
      }).has("admin-assets/123-detail.jpg"),
    ).toBe(true)
  })
})
