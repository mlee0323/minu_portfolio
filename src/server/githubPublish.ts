import ky from "ky"
import { z } from "zod"

const githubContentResponseSchema = z.object({
  sha: z.string().min(1),
})

const githubCommitResponseSchema = z.object({
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
  readonly commitSha: string
  readonly commitUrl: string
  readonly path: string
}

export class GitHubPublishConfigError extends Error {
  readonly name = "GitHubPublishConfigError"
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
      limit: 2,
    },
    timeout: 15_000,
  })
}

function encodeBase64(content: string): string {
  return Buffer.from(content, "utf8").toString("base64")
}

export async function publishFileToGitHub(
  config: GitHubPublishConfig,
  source: string,
): Promise<GitHubPublishResult> {
  const client = createGitHubClient(config)
  const route = `repos/${config.owner}/${config.repo}/contents/${config.path}`
  const currentFile = githubContentResponseSchema.parse(
    await client.get(route, { searchParams: { ref: config.branch } }).json(),
  )
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
    commitSha: response.commit.sha,
    commitUrl: response.commit.html_url,
    path: config.path,
  }
}
