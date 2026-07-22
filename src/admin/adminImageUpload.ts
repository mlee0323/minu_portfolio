import {
  adminImageContentTypes,
  maxAdminImageUploadBytes,
  maxProductionAdminImageUploadBytes,
} from "./adminImageUploadConfig"

export { maxAdminImageUploadBytes } from "./adminImageUploadConfig"

export type AdminUploadedImage = {
  readonly src: string
  readonly alt: string
  readonly width: number
  readonly height: number
}

export type AdminImageMetadata = Omit<AdminUploadedImage, "src">

export class AdminImageUploadError extends Error {
  readonly name = "AdminImageUploadError"
}

function altFromFileName(fileName: string): string {
  const cleaned = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()

  return cleaned.length > 0 ? cleaned : "Uploaded image"
}

function isSupportedAdminImage(file: File): boolean {
  return adminImageContentTypes.some((contentType) => contentType === file.type)
}

function assertAdminImageFile(file: File, maximumBytes: number): void {
  if (!isSupportedAdminImage(file)) {
    throw new AdminImageUploadError("Choose a JPEG, PNG, WebP, AVIF, or GIF image.")
  }

  if (file.size > maximumBytes) {
    throw new AdminImageUploadError(
      maximumBytes === maxAdminImageUploadBytes
        ? "Choose an image under 5 MB for this local draft."
        : "Choose an image under 100 MB for production upload.",
    )
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }

      reject(new AdminImageUploadError("Could not read this image file."))
    })
    reader.addEventListener("error", () => {
      reject(new AdminImageUploadError("Could not read this image file."))
    })
    reader.readAsDataURL(file)
  })
}

function readImageDimensions(
  src: string,
): Promise<{ readonly width: number; readonly height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.addEventListener("load", () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    })
    image.addEventListener("error", () => {
      reject(new AdminImageUploadError("Could not load this image preview."))
    })
    image.src = src
  })
}

function readImageDimensionsFromFile(
  file: File,
): Promise<{ readonly width: number; readonly height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    const revokeObjectUrl = () => URL.revokeObjectURL(objectUrl)

    image.addEventListener("load", () => {
      revokeObjectUrl()
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    })
    image.addEventListener("error", () => {
      revokeObjectUrl()
      reject(new AdminImageUploadError("Could not load this image preview."))
    })
    image.src = objectUrl
  })
}

export async function readAdminImageMetadata(
  file: File,
  maximumBytes = maxProductionAdminImageUploadBytes,
): Promise<AdminImageMetadata> {
  assertAdminImageFile(file, maximumBytes)

  const dimensions = await readImageDimensionsFromFile(file)

  return {
    alt: altFromFileName(file.name),
    width: dimensions.width > 0 ? dimensions.width : 1200,
    height: dimensions.height > 0 ? dimensions.height : 800,
  }
}

export async function readAdminUploadedImage(file: File): Promise<AdminUploadedImage> {
  const metadata = await readAdminImageMetadata(file, maxAdminImageUploadBytes)
  const src = await readFileAsDataUrl(file)
  const dimensions = await readImageDimensions(src)

  return {
    src,
    alt: metadata.alt,
    width: dimensions.width > 0 ? dimensions.width : metadata.width,
    height: dimensions.height > 0 ? dimensions.height : metadata.height,
  }
}
