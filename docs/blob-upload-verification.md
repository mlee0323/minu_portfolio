# Production Blob upload verification — 2026-10-15 (Asia/Seoul)

## Outcome

Uploads now succeed at `https://www.nnuu-studio.art/admin/works` using the existing
**Private** `minu_db` store. Assets, canvas and inspector previews load immediately.
No new store or Cloudflare policy change was needed.

## Confirmed causes

1. Cloudflare Access and token generation were already working. The browser's
   `POST /api/admin/upload` returned 200 JSON (`no-store`, Cloudflare DYNAMIC).
   The initial request had Cloudflare ray `a4af565469dbd938-LAX` and Vercel ID
   `sfo1::iad1::rx9jf-1792072691916-0ea64d7b73c9`.
2. Both the Vercel HTTP CSP and the HTML meta CSP omitted
   `https://vercel.com/api/blob/`, the installed SDK's upload endpoint. Chrome
   explicitly reported that the Blob PUT was blocked by `connect-src`.
3. After CSP was corrected, PUT reached the Blob service but returned 400 without
   CORS headers. The Vercel dashboard showed `minu_db` was **Private**, whereas
   the uploader used `access: "public"`. Matching the mode to `private` resolved
   the upload. Keeping the store private was explicitly selected by the owner.
4. The former 30-second timer measured the entire operation. It now measures
   inactivity, resetting when upload progress advances.

## Production evidence

| Test | Observed result |
| --- | --- |
| Admin login | Existing Cloudflare session verified; admin email displayed |
| 73,532-byte JPEG | Upload completed; Assets count 2 → 3 |
| Preview | Asset thumbnail, canvas and inspector images loaded at 1113 × 787 |
| 6 MiB JPEG fixture | Multipart upload completed; Assets count 3 → 4 |
| Live progress | Captured 0%, then 98.96%, then `Image added to Assets.` |
| Anonymous unpublished image GET | HTTP 404; no image bytes returned |
| Vercel runtime log, 23:09:26.56 | `blob.generate-client-token`, status 200, 173 ms |
| Vercel runtime log, 23:10:58.27 | `blob.generate-client-token`, status 200, 305 ms |
| Blob dashboard | Both files present in Private `minu_db/admin-assets/` |
| Build | `pnpm run build` passed, including both TypeScript projects |
| Tests | 21 test files / 62 tests passed |

Created files, verified in the Vercel dashboard:

- `admin-assets/1792073366061-eye-stroll-telescope-YR1ABoQtd629a35xAbslW13fOWsmZp.jpg` — 73.5 kB
- `admin-assets/1792073457537-minu-blob-multipart-test-GJNmhtgXatpk6m7UhvIOj4HEJ2TLSY.jpg` — 6.29 MB

The larger fixture uses the same existing portfolio JPEG with trailing padding
to exercise multipart upload. Both test files remain in the store, and their
references remain in the browser's local draft. **Save draft was not clicked**;
the public artwork layout and published music content were not changed by testing.

The new image endpoint's automated tests cover published reads, authenticated
draft previews, anonymous draft denial, unsafe paths, active-content rejection,
HEAD responses, and avoiding token exposure. Existing work/audio/publish tests
also passed. Runtime logs include dependency `url.parse()` deprecation warnings;
the upload event logs themselves report success.

## Changes

| File | Change |
| --- | --- |
| `vercel.json` | Permit the SDK Blob endpoint in CSP; package image serving function |
| `vite.config.ts` | Permit the endpoint in HTML meta and development/preview CSP |
| `public/_headers` | Keep fallback CSP consistent, including Blob media delivery |
| `src/admin/adminBlobUpload.ts` | Private uploads, same-origin image URLs, idle timeout and completion progress |
| `src/admin/adminImageAsset.ts` | Canonical image URL/path helpers and path validation |
| `api/admin/upload.ts` | Validate upload prefix; remove unused completion webhook; log status/stage without credentials |
| `api/assets.ts` | Stream private raster images; published allowlist or verified Access JWT required |
| `src/server/privateImageAssets.ts` | Build published image allowlist; parse Access cookie |
| `src/admin/adminBlobUpload.test.ts` | Private result URLs, long active upload and stalled upload coverage |
| `src/server/privateImageDelivery.test.ts` | Image delivery access/security regression tests |
| `docs/cloudflare-access-admin.md` | Private storage architecture and diagnostic guidance |
| `docs/blob-upload-verification.md` | This verification record |

`src/admin/adminAccessClient.ts`, `src/server/adminRequestAuth.ts` and the existing
publish API were not changed. Image previews reuse the existing JWT verification
with its issuer, audience and single allowed email. The read/write token is used
only on the server. Browser upload tokens retain the image MIME and 100 MiB limits.

## Commits and deployments

- `eda23279b49af2cdb522d0cac4e92644abdbee90`: CSP, inactivity progress and safe logging.
- `2d99263d8a6531a62658599383a051173b45cf16`: private upload and image delivery.
  Production deployment **Ready**, verified directly in Vercel:
  <https://vercel.com/mlee0323s-projects/minu-portfolio/7cJbvH3Btp5JNGgoxXgLY8fdRP5C>.

Dashboard evidence:
<https://vercel.com/mlee0323s-projects/minu-portfolio/stores/blob/store_mUTDS4bQCVX24GYg/manage-blobs?directory=admin-assets>.

Local screenshots are retained under
`/Users/lee/.codex/visualizations/2026/10/15/01a13fd7-daa3-74a3-b7a0-850ae92967a1/blob-upload-verification/`.
