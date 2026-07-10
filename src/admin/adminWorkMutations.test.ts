import { createSeedAdminContent } from "./adminSeed"
import type { AdminWork } from "./adminTypes"
import { renumberWorks, updateWorkCanvasHeightAndClampElements } from "./adminWorkMutations"

function requireFirstWork(works: readonly AdminWork[]): AdminWork {
  const firstWork = works[0]

  if (firstWork === undefined) {
    throw new Error("Expected at least one work")
  }

  return firstWork
}

describe("adminWorkMutations", () => {
  it("keeps work ordering stable after deleting a work", () => {
    const seed = createSeedAdminContent()
    const deletedEntryWork = seed.works.slice(1)
    const renumbered = renumberWorks(deletedEntryWork)

    expect(renumbered.map((work) => work.sortOrder)).toEqual([0, 1, 2])
    expect(requireFirstWork(renumbered).isEntry).toBe(true)
  })

  it("updates a work canvas height and clamps existing elements inside the responsive layout", () => {
    const work = requireFirstWork(createSeedAdminContent().works)
    const image = work.images[0]

    if (image === undefined) {
      throw new Error("Expected first work to include an image")
    }

    const offscreenWork: AdminWork = {
      ...work,
      images: [
        {
          ...image,
          layout: { x: 0, y: 2600, width: 320, height: 240 },
        },
      ],
    }
    const nextWork = updateWorkCanvasHeightAndClampElements({
      height: 620,
      work: offscreenWork,
    })
    const nextImage = nextWork.images[0]

    if (nextImage === undefined) {
      throw new Error("Expected updated work to include an image")
    }

    expect(nextWork.canvas.height).toBe(620)
    expect(nextImage.layout.y).toBe(380)
  })
})
