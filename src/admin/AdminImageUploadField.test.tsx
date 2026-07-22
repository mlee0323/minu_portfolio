import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AdminImageUploadField } from "./AdminImageUploadField"
import { uploadAdminImageAsset } from "./adminBlobUpload"

vi.mock("./adminBlobUpload", () => ({
  uploadAdminImageAsset: vi.fn(),
}))

const mockedUploadAdminImageAsset = vi.mocked(uploadAdminImageAsset)

describe("AdminImageUploadField", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("uploads a selected image and sends the returned asset to the editor", async () => {
    const uploaded = {
      src: "data:image/png;base64,uploaded",
      alt: "Cover",
      width: 1600,
      height: 900,
    }
    const onUpload = vi.fn()
    mockedUploadAdminImageAsset.mockResolvedValue(uploaded)

    render(
      <AdminImageUploadField
        label="Cover image"
        value="/images/old-cover.jpg"
        alt="Cover preview"
        onUpload={onUpload}
      />,
    )

    const file = new File(["image"], "new-cover.png", { type: "image/png" })
    fireEvent.change(screen.getByLabelText("Choose image"), { target: { files: [file] } })

    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(uploaded))
    expect(mockedUploadAdminImageAsset).toHaveBeenCalledWith(file)
  })

  it("shows an upload error without changing the current image", async () => {
    mockedUploadAdminImageAsset.mockRejectedValue(new Error("Upload failed"))

    render(
      <AdminImageUploadField
        label="Cover image"
        value="/images/old-cover.jpg"
        alt="Cover preview"
        onUpload={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText("Choose image"), {
      target: { files: [new File(["image"], "new-cover.png", { type: "image/png" })] },
    })

    expect(await screen.findByRole("alert")).toHaveTextContent("Upload failed")
    expect(screen.getByAltText("Cover preview")).toHaveAttribute("src", "/images/old-cover.jpg")
  })
})
