import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { requestAdminJson } from "./adminApiClient"
import { loadDeploymentStatus } from "./adminDeploymentClient"
import { AdminDeploymentFailedError } from "./adminDeploymentTypes"
import { waitForPublishedDeployment } from "./adminPublishClient"

vi.mock("./adminApiClient", () => ({ requestAdminJson: vi.fn() }))
vi.mock("./adminDeploymentClient", () => ({ loadDeploymentStatus: vi.fn() }))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(requestAdminJson).mockResolvedValue({ ok: true, deployedContentHash: "same-content" })
})
afterEach(() => vi.useRealTimers())
describe("exact commit deployment completion", () => {
  it("does not report success for identical content until the new commit deployment has completed", async () => {
    vi.useFakeTimers()
    vi.mocked(loadDeploymentStatus)
      .mockResolvedValueOnce({
        state: "pending",
        description: "Building",
        detailsUrl: null,
        updatedAt: null,
      })
      .mockResolvedValueOnce({
        state: "success",
        description: "Done",
        detailsUrl: null,
        updatedAt: null,
      })
    let completed = false
    const result = waitForPublishedDeployment(
      "same-content",
      new AbortController().signal,
      "a".repeat(40),
    ).then((value) => {
      completed = true
      return value
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(completed).toBe(false)
    await vi.advanceTimersByTimeAsync(3000)
    expect(await result).toBe(true)
    expect(loadDeploymentStatus).toHaveBeenCalledTimes(2)
  })
  it("reports an actual build failure separately from a status-query error", async () => {
    vi.mocked(loadDeploymentStatus).mockResolvedValue({
      state: "error",
      description: "Deployment failed",
      detailsUrl: "https://vercel.com/team/project/failed",
      updatedAt: null,
    })
    await expect(
      waitForPublishedDeployment("same-content", new AbortController().signal, "b".repeat(40)),
    ).rejects.toBeInstanceOf(AdminDeploymentFailedError)
  })
})
