import { ArrowUpRight, CheckCircle2, CircleAlert, Clock3, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { AdminPanel } from "./AdminFields"
import { shouldVerifyAdminAccess } from "./adminAccessClient"
import { loadDeploymentHistory } from "./adminDeploymentClient"
import {
  type DeploymentHistory,
  type DeploymentState,
  deploymentStateLabels,
} from "./adminDeploymentTypes"

const stateIcons = {
  pending: Clock3,
  success: CheckCircle2,
  error: CircleAlert,
  unknown: CircleAlert,
} as const
const timeFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})
function formatTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "시각 확인 필요" : timeFormat.format(date)
}

export function AdminDeploymentHistory({
  latestCommitSha,
}: {
  readonly latestCommitSha: string | null
}) {
  const [page, setPage] = useState(1)
  const [history, setHistory] = useState<DeploymentHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refresh, setRefresh] = useState(0)
  const isProduction = shouldVerifyAdminAccess()
  // biome-ignore lint/correctness/useExhaustiveDependencies: Refresh clicks and new saved commits intentionally restart the polling cycle.
  useEffect(() => {
    if (!isProduction) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    const update = async (initial = false) => {
      if (!initial && document.visibilityState === "hidden") {
        timer = setTimeout(() => void update(), 15_000)
        return
      }
      setLoading(true)
      try {
        const result = await loadDeploymentHistory(page, controller.signal)
        if (controller.signal.aborted) return
        setHistory(result)
        setError("")
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "배포 기록을 불러오지 못했습니다.")
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          timer = setTimeout(() => void update(), 15_000)
        }
      }
    }
    void update(true)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [isProduction, page, refresh, latestCommitSha])

  const counts = (state: DeploymentState) =>
    history?.entries.filter((entry) => entry.state === state).length ?? 0
  return (
    <AdminPanel title="배포 히스토리" meta="Production">
      <p className="admin-panel__intro">
        저장한 내용과 사이트 업데이트의 실제 배포 결과를 확인합니다. 15초마다 자동 갱신됩니다.
      </p>
      {!isProduction ? (
        <p role="status">
          배포 기록은 운영 사이트에 로그인한 후 확인할 수 있습니다. 로컬 초안 저장은 배포를 실행하지
          않습니다.
        </p>
      ) : (
        <>
          <div className="admin-deployments__toolbar">
            <span>
              {history
                ? `마지막 확인: ${formatTime(history.checkedAt)} (한국시간)`
                : "배포 기록을 불러오는 중…"}
            </span>
            <button
              className="pill-button"
              type="button"
              disabled={loading}
              onClick={() => setRefresh((value) => value + 1)}
            >
              <RefreshCw size={15} className={loading ? "is-spinning" : ""} />
              {loading ? "확인 중…" : "새로고침"}
            </button>
          </div>
          {error ? (
            <p className="admin-deployments__error" role="alert">
              {error}
              {history ? " 마지막으로 확인한 기록을 표시합니다." : ""}
            </p>
          ) : null}
          {history ? (
            <>
              <section className="admin-deployments__summary" aria-label="현재 목록의 배포 상태">
                {(["pending", "success", "error"] as const).map((state) => (
                  <span key={state}>
                    <span className={`admin-deployment-status admin-deployment-status--${state}`}>
                      {deploymentStateLabels[state]}
                    </span>
                    <strong>{counts(state)}</strong>
                  </span>
                ))}
              </section>
              {history.entries.length === 0 ? (
                <p>이 페이지에 표시할 배포 기록이 없습니다.</p>
              ) : (
                <div className="admin-deployments__table-wrap">
                  <table className="admin-deployments__table" aria-label="배포 기록">
                    <thead>
                      <tr>
                        <th scope="col">상태</th>
                        <th scope="col">요청 시각 · 한국시간</th>
                        <th scope="col">변경 내용</th>
                        <th scope="col">상세</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.entries.map((entry) => {
                        const Icon = stateIcons[entry.state]
                        const isCurrent = entry.sha === history.deployedCommitSha
                        return (
                          <tr
                            key={entry.sha}
                            className={entry.sha === latestCommitSha ? "is-latest-save" : undefined}
                          >
                            <td>
                              <span
                                className={`admin-deployment-status admin-deployment-status--${entry.state}`}
                              >
                                <Icon
                                  size={14}
                                  className={entry.state === "pending" ? "is-spinning" : ""}
                                />
                                {deploymentStateLabels[entry.state]}
                              </span>
                              {isCurrent ? (
                                <small className="admin-deployments__current">현재 운영중</small>
                              ) : null}
                            </td>
                            <td>
                              <time dateTime={entry.createdAt}>{formatTime(entry.createdAt)}</time>
                              <small>{entry.author}</small>
                            </td>
                            <td>
                              <strong>
                                {entry.source === "admin" ? "관리자 콘텐츠 저장" : entry.title}
                              </strong>
                              <p>{entry.description}</p>
                              <small>
                                {entry.sha.slice(0, 7)}
                                {entry.sha === latestCommitSha ? " · 최근 저장" : ""}
                              </small>
                            </td>
                            <td>
                              <div className="admin-deployments__links">
                                {entry.detailsUrl ? (
                                  <a
                                    className="pill-button"
                                    href={entry.detailsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Vercel 상세
                                    <ArrowUpRight size={14} />
                                  </a>
                                ) : null}
                                <a href={entry.commitUrl} target="_blank" rel="noopener noreferrer">
                                  변경 기록
                                  <ArrowUpRight size={13} />
                                </a>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="admin-deployments__pagination">
                <button
                  className="pill-button"
                  type="button"
                  disabled={loading || page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  이전
                </button>
                <span>{history.page} 페이지</span>
                <button
                  className="pill-button"
                  type="button"
                  disabled={loading || !history.hasMore}
                  onClick={() => setPage((value) => value + 1)}
                >
                  이전 기록 더 보기
                </button>
              </div>
            </>
          ) : null}
        </>
      )}
    </AdminPanel>
  )
}
