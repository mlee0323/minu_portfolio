import { act, renderHook } from "@testing-library/react"
import { saveAdminContent } from "../admin/adminStore"
import { publishedAdminContent } from "./publishedContent"
import { useRuntimeSiteContent } from "./runtimeSiteContent"

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

  it("updates the public content from a saved Admin draft and hides draft records", () => {
    const editedContent = {
      ...publishedAdminContent,
      works: publishedAdminContent.works.map((work, index) =>
        index === 0 ? { ...work, title: "Saved mobile canvas" } : work,
      ),
    }

    saveAdminContent(editedContent)
    const { result } = renderHook(() => useRuntimeSiteContent())

    expect(result.current.works[0]?.title).toBe("Saved mobile canvas")

    const updatedContent = {
      ...editedContent,
      works: editedContent.works.map((work, index) =>
        index === 0 ? { ...work, title: "Updated in another Admin save" } : work,
      ),
    }

    act(() => saveAdminContent(updatedContent))
    expect(result.current.works[0]?.title).toBe("Updated in another Admin save")

    const draftOnlyContent = {
      ...updatedContent,
      works: updatedContent.works.map((work, index) =>
        index === 0 ? { ...work, status: "draft" as const } : work,
      ),
    }

    act(() => saveAdminContent(draftOnlyContent))
    expect(
      result.current.works.some((work) => work.title === "Updated in another Admin save"),
    ).toBe(false)
  })
})
