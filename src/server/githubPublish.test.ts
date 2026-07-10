import { describe, expect, it } from "vitest"
import { readGitHubPublishConfig } from "./githubPublish"
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
