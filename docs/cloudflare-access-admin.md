# Cloudflare Access Admin Gate

The public portfolio stays open. Only the admin editor and admin API are protected.

## Admin Login Flow

1. The editor opens `/admin`.
2. Cloudflare Access asks for the allowed email address.
3. Cloudflare sends a one-time PIN to that email.
4. The editor enters the PIN.
5. Cloudflare keeps the admin session for 1 hour.
6. After 1 hour, or after cookies are cleared, the editor signs in again.

## Cloudflare Setup

1. Move the production domain behind Cloudflare DNS and keep the record proxied.
2. Go to `Zero Trust > Settings > Authentication`.
3. Add the `One-time PIN` identity provider if it is not already enabled.
4. Go to `Zero Trust > Access > Applications`.
5. Add a self-hosted application for the admin surface.
6. Protect these paths:
   - `/admin`
   - `/admin/*`
   - `/api/admin/*`
7. Add one allow policy:
   - Action: `Allow`
   - Include: `Emails`
   - Value: the single admin email address
8. Set the application or policy session duration to `1h`.
9. Copy the application `AUD` tag from the Cloudflare Access application page.

## Vercel Environment Variables

Set these in Vercel Project Settings:

```env
ADMIN_ALLOWED_EMAIL=admin@example.com
CLOUDFLARE_ACCESS_AUD=copy-the-access-aud-tag
CLOUDFLARE_ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
GITHUB_REPOSITORY=mlee0323/minu_portfolio
GITHUB_BRANCH=main
GITHUB_CONTENTS_TOKEN=github-fine-grained-token
BLOB_READ_WRITE_TOKEN=vercel-blob-token
```

Do not expose these values as `VITE_` variables.

## GitHub Publish Setup

1. Create a GitHub fine-grained personal access token.
2. Limit it to the portfolio repository only.
3. Grant `Contents: Read and write`.
4. Add it to Vercel as `GITHUB_CONTENTS_TOKEN`.
5. Confirm the Vercel project is connected to the same GitHub repository.

When the admin clicks `Save draft` in production, `/api/admin/publish` commits a new
`src/data/publishedContent.ts` file. The connected Vercel project redeploys from that commit.

## Vercel Blob Setup

1. In Vercel, open the project `Storage` tab.
2. Create a Blob store.
3. Connect it to this project.
4. Confirm `BLOB_READ_WRITE_TOKEN` is present in the project environment variables.

Images uploaded in local development stay as local preview data URLs. Images uploaded after
Cloudflare admin login go to Vercel Blob and the public Blob URL is stored in the published
content.

## App Behavior

- Local development on `localhost` or `127.0.0.1` bypasses Cloudflare verification.
- Production admin loads only after `/api/admin/session` verifies the Cloudflare Access JWT.
- If Cloudflare Access is not configured, production admin stays blocked instead of showing the editor.
- Production `Save draft` validates content, saves a local draft, then commits the published content file to GitHub.
- `/api/admin/upload` generates short-lived Vercel Blob client upload tokens only after Cloudflare Access verification.
