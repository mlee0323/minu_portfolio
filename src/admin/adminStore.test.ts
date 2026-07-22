import { createSeedAdminContent } from "./adminSeed"
import {
  AdminContentStorageError,
  adminContentStorageKey,
  loadAdminContent,
  resetAdminContent,
  saveAdminContent,
} from "./adminStore"
import type { AdminContent, AdminWork } from "./adminTypes"

function createTestStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear() {
      values.clear()
    },
    getItem(key: string) {
      return values.get(key) ?? null
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null
    },
    removeItem(key: string) {
      values.delete(key)
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}

function requireFirstWork(content: AdminContent): AdminWork {
  const firstWork = content.works[0]

  if (firstWork === undefined) {
    throw new Error("Expected seeded admin content to include at least one work")
  }

  return firstWork
}

describe("adminStore", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createTestStorage(),
    })

    window.localStorage.clear()
  })

  it("loads seeded site content when no local draft exists", () => {
    const seed = createSeedAdminContent()
    const loaded = loadAdminContent()

    expect(loaded.works).toHaveLength(seed.works.length)
    expect(loaded.archiveReleases).toHaveLength(seed.archiveReleases.length)
    expect(requireFirstWork(loaded).title).toBe(requireFirstWork(seed).title)
  })

  it("persists and reloads an edited local draft", () => {
    const seed = createSeedAdminContent()
    const firstWork = requireFirstWork(seed)
    const editedTitle = "Edited admin listening path"
    const editedContent: AdminContent = {
      ...seed,
      works: [
        {
          ...firstWork,
          title: editedTitle,
        },
        ...seed.works.slice(1),
      ],
    }

    saveAdminContent(editedContent)

    expect(requireFirstWork(loadAdminContent()).title).toBe(editedTitle)
  })

  it("resets the local draft to the hardcoded seed content", () => {
    const seed = createSeedAdminContent()
    const firstWork = requireFirstWork(seed)
    const editedContent: AdminContent = {
      ...seed,
      works: [
        {
          ...firstWork,
          title: "Temporary admin title",
        },
        ...seed.works.slice(1),
      ],
    }

    saveAdminContent(editedContent)
    const resetContent = resetAdminContent()

    expect(requireFirstWork(resetContent).title).toBe(firstWork.title)
    expect(requireFirstWork(loadAdminContent()).title).toBe(firstWork.title)
  })

  it("falls back to seeded content when an old local draft no longer matches the schema", () => {
    const seed = createSeedAdminContent()

    window.localStorage.setItem(adminContentStorageKey, JSON.stringify({ works: seed.works }))

    expect(requireFirstWork(loadAdminContent()).title).toBe(requireFirstWork(seed).title)
  })

  it("migrates older work canvas height drafts into the responsive height model", () => {
    const seed = createSeedAdminContent()
    const firstWork = requireFirstWork(seed)
    const legacyContent = {
      ...seed,
      works: [
        {
          ...firstWork,
          canvas: {
            mobile: { height: 1180 },
            desktop: { height: 760 },
          },
        },
        ...seed.works.slice(1),
      ],
    }

    window.localStorage.setItem(adminContentStorageKey, JSON.stringify(legacyContent))

    expect(requireFirstWork(loadAdminContent()).canvas.height).toBe(1180)
  })

  it("migrates older per-viewport element layouts into one responsive layout", () => {
    const seed = createSeedAdminContent()
    const firstWork = requireFirstWork(seed)
    const firstImage = firstWork.images[0]

    if (firstImage === undefined) {
      throw new Error("Expected seeded admin content to include an image")
    }

    const legacyContent = {
      ...seed,
      works: [
        {
          ...firstWork,
          images: [
            {
              ...firstImage,
              layout: undefined,
              layouts: {
                mobile: { x: 11, y: 22, width: 233, height: 144 },
                desktop: { x: 30, y: 44, width: 455, height: 280 },
              },
            },
            ...firstWork.images.slice(1),
          ],
        },
        ...seed.works.slice(1),
      ],
    }

    window.localStorage.setItem(adminContentStorageKey, JSON.stringify(legacyContent))

    expect(requireFirstWork(loadAdminContent()).images[0]?.layout).toEqual({
      x: 11,
      y: 22,
      width: 233,
      height: 144,
    })
  })

  it("migrates archive releases created before detail images existed", () => {
    const seed = createSeedAdminContent()
    const legacyContent = {
      ...seed,
      archiveReleases: seed.archiveReleases.map(({ images: _, ...release }) => release),
    }

    window.localStorage.setItem(adminContentStorageKey, JSON.stringify(legacyContent))

    expect(loadAdminContent().archiveReleases[0]?.images).toEqual([])
  })

  it("rejects drafts that do not pass the admin schema", () => {
    const seed = createSeedAdminContent()
    const firstWork = requireFirstWork(seed)
    const invalidContent: AdminContent = {
      ...seed,
      works: [
        {
          ...firstWork,
          title: "",
        },
        ...seed.works.slice(1),
      ],
    }

    expect(() => saveAdminContent(invalidContent)).toThrow()
    expect(() => saveAdminContent(invalidContent)).not.toThrow(AdminContentStorageError)
  })
})
