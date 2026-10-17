import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AdminDeploymentHistory } from "./AdminDeploymentHistory"
import { loadDeploymentHistory } from "./adminDeploymentClient"
import type { DeploymentHistory } from "./adminDeploymentTypes"

vi.mock("./adminAccessClient", () => ({ shouldVerifyAdminAccess: () => true }))
vi.mock("./adminDeploymentClient", () => ({ loadDeploymentHistory: vi.fn() }))
const history: DeploymentHistory = {
  ok: true,
  page: 1,
  hasMore: true,
  deployedCommitSha: "success-sha",
  checkedAt: "2026-10-17T08:00:00Z",
  entries: (["pending", "success", "error", "unknown"] as const).map((state) => ({
    sha: `${state}-sha`,
    state,
    description: `${state} description`,
    title: `${state} change`,
    source: "admin",
    createdAt: "2026-10-17T08:00:00Z",
    author: "Owner",
    commitUrl: `https://github.com/owner/repo/commit/${state}`,
    detailsUrl: "https://vercel.com/team/project/deploy",
    updatedAt: "2026-10-17T08:01:00Z",
  })),
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(loadDeploymentHistory).mockResolvedValue(history)
})
afterEach(() => vi.useRealTimers())
describe("deployment history UI", () => {
  it("renders real pending/completed/error statuses and active production deployment", async () => {
    render(<AdminDeploymentHistory latestCommitSha="pending-sha" />)
    const table = await screen.findByRole("table", { name: "배포 기록" })
    for (const label of ["진행중", "완료", "오류", "확인 필요"])
      expect(within(table).getByText(label)).toBeInTheDocument()
    expect(within(table).getByText("현재 운영중")).toBeInTheDocument()
    expect(within(table).getByText("pending-sha".slice(0, 7) + " · 최근 저장")).toBeInTheDocument()
    expect(within(table).getAllByRole("link", { name: "Vercel 상세" })[0]).toHaveAttribute(
      "target",
      "_blank",
    )
  })
  it("loads an older page without losing persistent records", async () => {
    render(<AdminDeploymentHistory latestCommitSha={null} />)
    await screen.findByRole("table")
    fireEvent.click(screen.getByRole("button", { name: "이전 기록 더 보기" }))
    await waitFor(() =>
      expect(loadDeploymentHistory).toHaveBeenLastCalledWith(2, expect.any(AbortSignal)),
    )
  })
  it("automatically replaces a pending status with completed on refresh", async () => {
    vi.useFakeTimers()
    const first = { ...history, entries: history.entries.slice(0, 1) }
    vi.mocked(loadDeploymentHistory)
      .mockResolvedValueOnce(first)
      .mockResolvedValue({
        ...first,
        entries: first.entries.map((entry) => ({ ...entry, state: "success" })),
      })
    await act(async () => {
      render(<AdminDeploymentHistory latestCommitSha={null} />)
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(within(screen.getByRole("table")).getByText("진행중")).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(within(screen.getByRole("table")).getByText("완료")).toBeInTheDocument()
  })
  it("keeps last verified records when refresh fails and does not relabel them as failed builds", async () => {
    render(<AdminDeploymentHistory latestCommitSha={null} />)
    await screen.findByRole("table")
    vi.mocked(loadDeploymentHistory).mockRejectedValue(new Error("Network unavailable"))
    fireEvent.click(screen.getByRole("button", { name: "새로고침" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "마지막으로 확인한 기록을 표시합니다",
    )
    expect(screen.getByRole("table")).toBeInTheDocument()
  })
})
