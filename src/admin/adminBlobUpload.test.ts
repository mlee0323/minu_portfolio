import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { uploadAdminImageAsset } from "./adminBlobUpload"

const mocks = vi.hoisted(() => ({
  readAdminImageMetadata: vi.fn(),
  readAdminUploadedImage: vi.fn(),
  shouldVerifyAdminAccess: vi.fn(),
  upload: vi.fn(),
}))

vi.mock("@vercel/blob/client", () => ({
  upload: mocks.upload,
}))

vi.mock("./adminAccessClient", () => ({
  shouldVerifyAdminAccess: mocks.shouldVerifyAdminAccess,
}))

vi.mock("./adminImageUpload", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./adminImageUpload")>()),
  readAdminImageMetadata: mocks.readAdminImageMetadata,
  readAdminUploadedImage: mocks.readAdminUploadedImage,
}))

describe("uploadAdminImageAsset", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("allows uploads lasting over 30 seconds while bytes keep progressing, then completes", async () => {
    vi.useFakeTimers()
    mocks.shouldVerifyAdminAccess.mockReturnValue(true)
    mocks.readAdminImageMetadata.mockResolvedValue({ alt: "test", width: 10, height: 10 })
    let finish!: (value: { url: string }) => void
    mocks.upload.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const onProgress = vi.fn()
    const result = uploadAdminImageAsset(new File(["image"], "test.jpg"), onProgress)
    await vi.advanceTimersByTimeAsync(20_000)
    const options = mocks.upload.mock.calls[0]?.[2]
    options.onUploadProgress({ percentage: 40 })
    await vi.advanceTimersByTimeAsync(20_000)
    expect(options.abortSignal.aborted).toBe(false)
    options.onUploadProgress({ percentage: 80 })
    finish({ url: "https://store.example.com/test.jpg" })
    await expect(result).resolves.toMatchObject({ src: "https://store.example.com/test.jpg" })
    expect(onProgress.mock.calls.map(([progress]) => progress)).toEqual([0, 40, 80, 100])
    expect(vi.getTimerCount()).toBe(0)
  })

  it("aborts stalled token requests after 30 seconds and clears the timer", async () => {
    vi.useFakeTimers()
    mocks.shouldVerifyAdminAccess.mockReturnValue(true)
    mocks.readAdminImageMetadata.mockResolvedValue({ alt: "test", width: 10, height: 10 })
    mocks.upload.mockImplementation(() => new Promise(() => {}))
    const result = uploadAdminImageAsset(new File(["image"], "test.jpg"))
    const assertion = expect(result).rejects.toThrow("no progress for 30 seconds")
    await vi.advanceTimersByTimeAsync(30_000)
    await assertion
    expect(mocks.upload.mock.calls[0]?.[2].abortSignal.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("uses file metadata rather than the 5 MB local-draft reader for production uploads", async () => {
    const file = new File([new Uint8Array(6 * 1024 * 1024)], "album-detail.jpg", {
      type: "image/jpeg",
    })
    mocks.shouldVerifyAdminAccess.mockReturnValue(true)
    mocks.readAdminImageMetadata.mockResolvedValue({
      alt: "album detail",
      width: 2400,
      height: 1600,
    })
    mocks.readAdminUploadedImage.mockRejectedValue(
      new Error("Local draft image limit should not run in production"),
    )
    mocks.upload.mockResolvedValue({ url: "https://store.example.com/album-detail.jpg" })

    await expect(uploadAdminImageAsset(file)).resolves.toEqual({
      alt: "album detail",
      height: 1600,
      src: "https://store.example.com/album-detail.jpg",
      width: 2400,
    })

    expect(mocks.readAdminUploadedImage).not.toHaveBeenCalled()
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^admin-assets\//),
      file,
      expect.objectContaining({
        access: "public",
        contentType: "image/jpeg",
        handleUploadUrl: "/api/admin/upload",
      }),
    )
  })
})
