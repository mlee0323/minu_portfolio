export const maxAdminImageUploadBytes = 5 * 1024 * 1024

export type AdminUploadedImage = {
  readonly src: string
  readonly alt: string
  readonly width: number
  readonly height: number
}

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

export async function readAdminUploadedImage(file: File): Promise<AdminUploadedImage> {
  if (!file.type.startsWith("image/")) {
    throw new AdminImageUploadError("Choose an image file.")
  }

  if (file.size > maxAdminImageUploadBytes) {
    throw new AdminImageUploadError("Choose an image under 5 MB for this local draft.")
  }

  const src = await readFileAsDataUrl(file)
  const dimensions = await readImageDimensions(src)

  return {
    src,
    alt: altFromFileName(file.name),
    width: dimensions.width > 0 ? dimensions.width : 1200,
    height: dimensions.height > 0 ? dimensions.height : 800,
  }
}
