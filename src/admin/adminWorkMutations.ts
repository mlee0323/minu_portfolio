import { clampCanvasRect, getWorkCanvasDimensions, updateWorkCanvasHeight } from "./adminCanvas"
import type {
  AdminCanvasLayout,
  AdminWork,
  AdminWorkImage,
  AdminWorkTextElement,
} from "./adminTypes"

export function renumberWorks(works: readonly AdminWork[]): readonly AdminWork[] {
  const hasEntryWork = works.some((work) => work.isEntry)

  return works.map((work, sortOrder) => ({
    ...work,
    isEntry: hasEntryWork ? work.isEntry : sortOrder === 0,
    sortOrder,
  }))
}

export function renumberImages(images: readonly AdminWorkImage[]): readonly AdminWorkImage[] {
  return images.map((image, sortOrder) => ({ ...image, sortOrder }))
}

export function renumberTextElements(
  textElements: readonly AdminWorkTextElement[],
): readonly AdminWorkTextElement[] {
  return textElements.map((textElement, sortOrder) => ({ ...textElement, sortOrder }))
}

export function updateWorkCanvasHeightAndClampElements({
  height,
  work,
}: {
  readonly height: number
  readonly work: AdminWork
}): AdminWork {
  const canvas = updateWorkCanvasHeight(height)
  const nextWork = { ...work, canvas }

  return {
    ...nextWork,
    images: work.images.map((image) => ({
      ...image,
      layout: clampLayoutToWork(image.layout, nextWork),
    })),
    textElements: work.textElements.map((textElement) => ({
      ...textElement,
      layout: clampLayoutToWork(textElement.layout, nextWork),
    })),
  }
}

function clampLayoutToWork(layout: AdminCanvasLayout, work: AdminWork): AdminCanvasLayout {
  return clampCanvasRect(layout, "mobile", getWorkCanvasDimensions(work, "mobile"))
}
