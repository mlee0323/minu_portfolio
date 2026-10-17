import ky, { HTTPError } from "ky"
import { z } from "zod"
import type { DeploymentRecord, DeploymentStatus } from "../admin/adminDeploymentTypes.ts"
import { createGitHubClient, type GitHubPublishConfig } from "./githubPublish.ts"

const commitSchema = z.object({
  sha: z.string(),
  html_url: z.string().url(),
  commit: z.object({
    message: z.string(),
    author: z.object({ name: z.string(), date: z.string() }).nullable(),
    committer: z.object({ date: z.string() }).nullable().optional(),
  }),
})
const statusResponseSchema = z.object({
  statuses: z.array(
    z.object({
      context: z.string(),
      state: z.enum(["pending", "success", "failure", "error"]),
      description: z.string().nullable(),
      target_url: z.string().nullable(),
      updated_at: z.string(),
    }),
  ),
})
const statusCache = new Map<string, { until: number; value: DeploymentStatus }>()
const publicRepositories = new Map<string, { until: number; isPublic: boolean }>()

async function githubGet(config: GitHubPublishConfig, route: string) {
  try {
    return await createGitHubClient(config).get(route)
  } catch (error) {
    // Public status metadata can be read even when a fine-grained Contents token
    // lacks commit-status permission. Never fall back for a private repository.
    if (!(error instanceof HTTPError) || error.response.status !== 403) throw error
    const key = `${config.owner}/${config.repo}`
    let visibility = publicRepositories.get(key)
    if (!visibility || visibility.until <= Date.now()) {
      const repo = z
        .object({ private: z.boolean() })
        .parse(await createGitHubClient(config).get(`repos/${key}`).json())
      visibility = { until: Date.now() + 300_000, isPublic: !repo.private }
      publicRepositories.set(key, visibility)
    }
    if (!visibility.isPublic) throw error
    return ky.get(`https://api.github.com/${route}`, {
      retry: 0,
      timeout: 10_000,
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    })
  }
}

function vercelUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" && url.hostname === "vercel.com" ? url.href : null
  } catch {
    return null
  }
}

export function statusFromGitHub(input: unknown, createdAt?: string): DeploymentStatus {
  const response = statusResponseSchema.parse(input)
  const status = [...response.statuses]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .find((item) => item.context.toLowerCase().startsWith("vercel"))
  if (!status) {
    const recent = createdAt !== undefined && Date.now() - Date.parse(createdAt) < 300_000
    return {
      state: recent ? "pending" : "unknown",
      description: recent
        ? "배포 대기열에 등록되는 중입니다."
        : "이 변경의 Vercel 배포 기록을 아직 확인할 수 없습니다.",
      detailsUrl: null,
      updatedAt: null,
    }
  }
  return {
    state:
      status.state === "success" ? "success" : status.state === "pending" ? "pending" : "error",
    description:
      status.description?.slice(0, 500) ||
      (status.state === "success"
        ? "배포가 완료되었습니다."
        : status.state === "pending"
          ? "배포가 진행 중입니다."
          : "배포 중 오류가 발생했습니다."),
    detailsUrl: vercelUrl(status.target_url),
    updatedAt: status.updated_at,
  }
}

export async function readDeploymentStatus(
  config: GitHubPublishConfig,
  sha: string,
  createdAt?: string,
): Promise<DeploymentStatus> {
  const key = `${config.owner}/${config.repo}/${sha}`
  const cached = statusCache.get(key)
  if (cached && cached.until > Date.now()) return cached.value
  const response = await githubGet(
    config,
    `repos/${config.owner}/${config.repo}/commits/${sha}/status`,
  )
  const value = statusFromGitHub(await response.json(), createdAt)
  statusCache.set(key, {
    until: Date.now() + (value.state === "pending" || value.state === "unknown" ? 5000 : 60_000),
    value,
  })
  if (statusCache.size > 300) {
    for (const [cacheKey, entry] of statusCache)
      if (entry.until <= Date.now()) statusCache.delete(cacheKey)
    if (statusCache.size > 300) statusCache.delete(statusCache.keys().next().value ?? "")
  }
  return value
}

export async function readDeploymentHistory(config: GitHubPublishConfig, page: number) {
  const response = await createGitHubClient(config).get(
    `repos/${config.owner}/${config.repo}/commits`,
    { searchParams: { sha: config.branch, page, per_page: 10 } },
  )
  const commits = z.array(commitSchema).parse(await response.json())
  const entries: DeploymentRecord[] = []
  // Bound concurrency to keep both GitHub and the serverless function responsive.
  for (let start = 0; start < commits.length; start += 5) {
    const batch = await Promise.all(
      commits.slice(start, start + 5).map(async (commit) => {
        const createdAt =
          commit.commit.committer?.date ?? commit.commit.author?.date ?? new Date().toISOString()
        let status: DeploymentStatus
        try {
          status = await readDeploymentStatus(config, commit.sha, createdAt)
        } catch {
          status = {
            state: "unknown",
            description: "배포 상태 조회에 실패했습니다. 잠시 후 다시 확인해 주세요.",
            detailsUrl: null,
            updatedAt: null,
          }
        }
        return {
          ...status,
          sha: commit.sha,
          title: commit.commit.message.split("\n")[0] ?? "사이트 업데이트",
          createdAt,
          author: commit.commit.author?.name ?? "",
          commitUrl: commit.html_url,
          source: commit.commit.message.startsWith("Publish portfolio content from admin")
            ? ("admin" as const)
            : ("code" as const),
        }
      }),
    )
    entries.push(...batch)
  }
  return { entries, page, hasMore: response.headers.get("link")?.includes('rel="next"') ?? false }
}
