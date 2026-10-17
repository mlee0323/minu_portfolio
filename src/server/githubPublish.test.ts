import { afterEach, describe, expect, it, vi } from "vitest"
import {
  GitHubPublishConflictError,
  publishFileToGitHub,
  readGitHubPublishConfig,
} from "./githubPublish"
import { publishedContentFilePath } from "./publishedContentSource"

describe("githubPublish", () => {
  it("reads publish config from environment variables", () => {
    expect(
      readGitHubPublishConfig(
        {
          GITHUB_REPOSITORY: "mlee0323/minu_portfolio",
          GITHUB_BRANCH: "main",
          GITHUB_CONTENTS_TOKEN: "token",
        },
        publishedContentFilePath,
      ),
    ).toEqual({
      owner: "mlee0323",
      repo: "minu_portfolio",
      branch: "main",
      path: publishedContentFilePath,
      token: "token",
    })
  })
})

describe("GitHub publish concurrency", () => {
  const config = {
    owner: "owner",
    repo: "repo",
    branch: "main",
    path: "src/data/publishedContent.ts",
    token: "secret",
  }
  afterEach(() => vi.unstubAllGlobals())
  it("rejects a stale original revision before issuing a write", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          sha: "newer-sha",
          content: Buffer.from("latest").toString("base64"),
          encoding: "base64",
        }),
        { headers: { "content-type": "application/json" } },
      ),
    )
    vi.stubGlobal("fetch", fetch)
    await expect(publishFileToGitHub(config, "new content", "old-sha")).rejects.toBeInstanceOf(
      GitHubPublishConflictError,
    )
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it("writes against the loaded revision and returns the exact new file and commit revisions", async () => {
    let written: unknown
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sha: "base-sha",
            content: Buffer.from("old").toString("base64"),
            encoding: "base64",
          }),
          { headers: { "content-type": "application/json" } },
        ),
      )
      .mockImplementationOnce(async (request: Request) => {
        written = await request.clone().json()
        return new Response(
          JSON.stringify({
            content: { sha: "written-sha" },
            commit: { sha: "commit", html_url: "https://github.com/owner/repo/commit/commit" },
          }),
          { headers: { "content-type": "application/json" } },
        )
      })
    vi.stubGlobal("fetch", fetch)
    expect(await publishFileToGitHub(config, "new content", "base-sha")).toEqual({
      contentSha: "written-sha",
      commitSha: "commit",
      commitUrl: "https://github.com/owner/repo/commit/commit",
      path: config.path,
    })
    const request = fetch.mock.calls[1]?.[0] as Request
    expect(request.method).toBe("PUT")
    expect(written).toMatchObject({
      sha: "base-sha",
      content: Buffer.from("new content").toString("base64"),
    })
  })
})
