import { beforeEach, describe, expect, it, vi } from "vitest"
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

vi.mock("./adminImageUpload", () => ({
  readAdminImageMetadata: mocks.readAdminImageMetadata,
  readAdminUploadedImage: mocks.readAdminUploadedImage,
}))

describe("uploadAdminImageAsset", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
