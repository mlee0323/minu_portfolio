import ky from "ky"
import { z } from "zod"

const githubContentResponseSchema = z.object({
  sha: z.string().min(1),
  content: z.string(),
  encoding: z.literal("base64"),
})

const githubCommitResponseSchema = z.object({
  content: z.object({ sha: z.string().min(1) }),
  commit: z.object({
    sha: z.string().min(1),
    html_url: z.string().min(1),
  }),
})

type GitHubRepository = {
  readonly owner: string
  readonly repo: string
}

export type GitHubPublishConfig = GitHubRepository & {
  readonly branch: string
  readonly path: string
  readonly token: string
}

export type GitHubPublishResult = {
  readonly contentSha: string
  readonly commitSha: string
  readonly commitUrl: string
  readonly path: string
}

export class GitHubPublishConfigError extends Error {
  readonly name = "GitHubPublishConfigError"
}

export class GitHubPublishConflictError extends Error {
  readonly name = "GitHubPublishConflictError"
}

function requiredEnv(name: string, env: Record<string, string | undefined>): string {
  const value = env[name]?.trim()

  if (value === undefined || value === "") {
    throw new GitHubPublishConfigError(`${name} is required`)
  }

  return value
}

function splitRepository(repository: string): GitHubRepository {
  const [owner, repo] = repository.split("/")

  if (owner === undefined || owner === "" || repo === undefined || repo === "") {
    throw new GitHubPublishConfigError("GITHUB_REPOSITORY must look like owner/repo")
  }

  return { owner, repo }
}

export function readGitHubPublishConfig(
  env: Record<string, string | undefined>,
  defaultPath: string,
): GitHubPublishConfig {
  return {
    ...splitRepository(requiredEnv("GITHUB_REPOSITORY", env)),
    branch: env["GITHUB_BRANCH"]?.trim() || "main",
    path: env["GITHUB_PUBLISHED_CONTENT_PATH"]?.trim() || defaultPath,
    token: requiredEnv("GITHUB_CONTENTS_TOKEN", env),
  }
}

function createGitHubClient(config: GitHubPublishConfig): typeof ky {
  return ky.create({
    prefix: "https://api.github.com",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    retry: {
      limit: 0,
    },
    timeout: 10_000,
  })
}

function encodeBase64(content: string): string {
  return Buffer.from(content, "utf8").toString("base64")
}

export async function publishFileToGitHub(
  config: GitHubPublishConfig,
  source: string,
  expectedSha: string,
): Promise<GitHubPublishResult> {
  const client = createGitHubClient(config)
  const route = `repos/${config.owner}/${config.repo}/contents/${config.path}`
  const currentFile = githubContentResponseSchema.parse(
    await client.get(route, { searchParams: { ref: config.branch } }).json(),
  )
  if (currentFile.sha !== expectedSha) {
    throw new GitHubPublishConflictError(
      "The published content changed. Reload published content before saving; your local draft is preserved.",
    )
  }
  const response = githubCommitResponseSchema.parse(
    await client
      .put(route, {
        json: {
          branch: config.branch,
          content: encodeBase64(source),
          message: "Publish portfolio content from admin",
          sha: currentFile.sha,
        },
      })
      .json(),
  )

  return {
    contentSha: response.content.sha,
    commitSha: response.commit.sha,
    commitUrl: response.commit.html_url,
    path: config.path,
  }
}

export async function readFileFromGitHub(
  config: GitHubPublishConfig,
): Promise<{ sha: string; source: string }> {
  const file = githubContentResponseSchema.parse(
    await createGitHubClient(config)
      .get(`repos/${config.owner}/${config.repo}/contents/${config.path}`, {
        searchParams: { ref: config.branch },
      })
      .json(),
  )
  return { sha: file.sha, source: Buffer.from(file.content, "base64").toString("utf8") }
}
