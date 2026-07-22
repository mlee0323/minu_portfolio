import { ImagePlus } from "lucide-react"
import { useId, useState } from "react"
import { uploadAdminImageAsset } from "./adminBlobUpload"
import { AdminImageUploadError, type AdminUploadedImage } from "./adminImageUpload"

type AdminImageUploadFieldProps = {
  readonly label: string
  readonly value: string
  readonly alt: string
  readonly onUpload: (image: AdminUploadedImage) => void
}

export function AdminImageUploadField({ alt, label, onUpload, value }: AdminImageUploadFieldProps) {
  const inputId = `admin-image-upload-${useId().replaceAll(":", "")}`
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleFileChange = async (file: File | undefined) => {
    if (file === undefined) {
      return
    }

    setIsUploading(true)
    setErrorMessage("")

    try {
      const uploaded = await uploadAdminImageAsset(file)
      onUpload(uploaded)
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof AdminImageUploadError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Image upload failed.",
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="admin-image-upload-field">
      <div className="admin-image-upload-field__head">
        <span>{label}</span>
        {isUploading ? <small>Uploading…</small> : null}
      </div>
      <div className="admin-image-upload-field__body">
        <div className="admin-image-upload-field__preview">
          {value ? (
            <img src={value} alt={alt} width={72} height={72} />
          ) : (
            <ImagePlus size={20} aria-hidden="true" />
          )}
        </div>
        <label className="admin-file-picker" htmlFor={inputId}>
          <ImagePlus size={15} aria-hidden="true" />
          <span>{isUploading ? "Uploading…" : "Choose image"}</span>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ""
              void handleFileChange(file)
            }}
          />
        </label>
      </div>
      <small className="admin-image-upload-field__hint">
        {value.startsWith("data:")
          ? "Stored in this browser draft until you save."
          : "Choose a new image file to replace the current cover."}
      </small>
      {errorMessage ? (
        <small className="admin-image-upload-field__error" role="alert">
          {errorMessage}
        </small>
      ) : null}
    </div>
  )
}
