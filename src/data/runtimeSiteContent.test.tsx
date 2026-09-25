import { renderHook } from "@testing-library/react"
import { saveAdminContent } from "../admin/adminStore"
import { publishedAdminContent } from "./publishedContent"
import { loadRuntimeSiteContent, useRuntimeSiteContent } from "./runtimeSiteContent"

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

describe("useRuntimeSiteContent", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createTestStorage(),
    })
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("keeps unpublished browser drafts off the public site", () => {
    const editedContent = {
      ...publishedAdminContent,
      works: publishedAdminContent.works.map((work, index) =>
        index === 0 ? { ...work, title: "Saved mobile canvas" } : work,
      ),
    }

    saveAdminContent(editedContent)
    const { result } = renderHook(() => useRuntimeSiteContent())

    expect(result.current.works[0]?.title).toBe(publishedAdminContent.works[0]?.title)
    expect(loadRuntimeSiteContent().works[0]?.title).toBe(publishedAdminContent.works[0]?.title)
  })
})
