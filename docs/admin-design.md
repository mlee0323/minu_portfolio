# Custom Admin Design

## 1. Decision

Keep the public portfolio exactly as it works today for now. The admin work starts as a separate design track and later replaces the hardcoded content files with database-backed content.

Current source of truth:

- Main Works: `src/data/siteContent.ts`
- Local audio: `src/data/localTracks.ts`
- Archive releases: `src/data/archiveTracks.ts`
- Media files: `public/images`, `public/audio`

Future source of truth:

- Works, images, local audio metadata, archive releases, and archive tracks move to Supabase Postgres.
- Uploaded images and audio move to Supabase Storage.
- The public site reads only published records.
- The admin route edits draft records and publishes them intentionally.

Implemented V1 source of truth:

- `/admin` is available as a separate local draft editor.
- Drafts are validated with Zod and saved to browser `localStorage`.
- The public portfolio intentionally does not read the local admin draft yet.
- Supabase Auth, Postgres, Storage, preview, and publish are the next backend phase.
- Admin UX is desktop-focused; phone editing is not a release requirement.
- Main Works editing uses a Canva-lite builder: left asset upload/add panel, Mobile/Web preview canvas, fit-to-screen zooming, draggable/resizable image and text elements, direct text editing on the canvas, text movement handles, and an inspector for work and element settings.
- Image and text layout data is stored once per element as a mobile-first responsive layout. Mobile/Web previews are derived from that same layout, so non-developers never edit separate breakpoint positions. Each work stores one responsive canvas height so a single work can become a longer vertical composition without splitting it into multiple works.

## 2. Goals

- A non-developer can replace the current main work without editing code.
- A non-developer can upload any number of Works images.
- A non-developer can choose each image layout: `hero`, `large`, `medium`, `small` plus `left`, `center`, `right`.
- A non-developer can attach one fixed entry audio track for the Works experience.
- Archive albums stay close to the current structure: release cards with nested tracks.
- SoundCloud playback continues through the official Widget API.
- Private SoundCloud links are supported only through SoundCloud secret share URLs.
- The live site remains stable if a draft is incomplete.

## 3. Non-Goals For The First Admin Version

- No automatic SoundCloud playlist import.
- No multi-user editorial workflow beyond one or more allowed admin accounts.
- No audio waveform editing.
- No multi-user visual approval workflow beyond the local draft editor.
- No server-side audio transcoding in V1.
- No migration to Next.js unless Vite plus Vercel Functions becomes a blocker.

## 4. Recommended Stack

Use the current Vite React app and add:

- Supabase Auth for admin login.
- Supabase Postgres for content.
- Supabase Storage for images and audio.
- Supabase Row Level Security for admin-only writes.
- Vercel for hosting the public site and admin route.
- Optional Vercel API routes only for operations that should not run directly from the browser.

This keeps the project close to the current deployment while giving us a real backend without running a custom server.

## 5. Admin Routes

### `/admin/login`

Purpose: authenticate a site manager.

Fields:

- Email
- Magic link or password

Rules:

- Only emails in `admin_profiles` may access admin routes.
- Failed access returns to login.
- The public site must not load admin code unless the admin route is opened.

### `/admin`

Purpose: dashboard overview.

Panels:

- Published site status
- Draft changes count
- Main Works summary
- Archive releases summary
- Storage usage warning
- Last published timestamp

Primary actions:

- Edit Main Works
- Edit Archive
- Edit Index and Contact
- Preview Site
- Publish Changes

### `/admin/works`

Purpose: manage the main vertical Works sequence.

Capabilities:

- Create work
- Delete work
- Duplicate work
- Edit work
- Reorder work
- Mark one work as entry work
- Toggle draft or published
- Preview public Works layout

List columns:

- Order
- Cover
- Title
- Year
- Audio source
- Image count
- Status
- Updated at

### `/admin/works/:workId`

Purpose: edit a single work.

Fields:

- Title
- Entry audio selection from Archive tracks

Image editor:

- Upload image
- Drag and resize image directly on canvas
- Alt text
- Scale: `hero`, `large`, `medium`, `small`
- Align: `left`, `center`, `right`
- Object position: text field such as `center`, `50% 20%`, `left center`
- Sort order
- Remove image

Preview:

- Mobile preview
- Desktop preview
- One responsive canvas height control
- One shared responsive image/text layout across both previews
- Direct text editing and typography controls
- Current Work label preview
- Now Playing preview metadata only

Guardrails:

- A published work needs at least one image.
- A published image needs alt text.
- A published local audio track needs a storage URL or a valid existing URL.
- Layout values must use the allowed enum options.

### `/admin/archive`

Purpose: manage Archive and Sound cards.

Capabilities:

- Create release
- Edit release
- Reorder releases
- Add tracks
- Reorder tracks
- Hide release from public site

Release fields:

- Title
- Artist
- Type: `single`, `ep`, `album`, `playlist`
- Year
- Cover image
- Description
- Provider: `soundcloud` for V1
- SoundCloud playlist URL, optional
- Visibility: `public` or `private-link`
- Status: draft or published

Track fields:

- Title
- Artist
- Track number
- Duration
- Artwork image
- SoundCloud track URL
- SoundCloud playlist URL, inherited by default
- Playlist index
- Visibility
- Description

Guardrails:

- A published release needs at least one track.
- SoundCloud private items require the full secret share URL.
- Playlist index is required only when a track starts inside a SoundCloud set.

### `/admin/index-contact`

Purpose: edit the text-only Index and Contact section.

Index item fields:

- Year
- Title
- Role
- Sort order
- Status

Contact fields:

- Label
- URL
- Sort order

## 6. Public Site Behavior After Admin Migration

The public site should preserve the current component contract:

- `MainWorks` still receives a list of work records.
- `Archive` still receives a list of release records with nested tracks.
- `NowPlayingBar` still uses the provider-based audio interface.
- SoundCloud playback still uses Widget API.
- The intro still starts the fixed entry local audio until a later spec changes it.

Data loading options:

1. Build-time fetch from Supabase for fastest static pages.
2. Runtime fetch from Supabase for near-instant admin updates.
3. Hybrid: build-time public data plus an admin-triggered Vercel redeploy.

Recommended V1: runtime fetch with simple loading and error states. Move to build-time later if performance demands it.

## 7. Database Model

Suggested tables:

```sql
admin_profiles (
  id uuid primary key references auth.users(id),
  email text not null unique,
  created_at timestamptz not null default now()
);

works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null default 'Minu',
  year text,
  medium text,
  location text,
  caption text,
  status text not null check (status in ('draft', 'published')),
  is_entry boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

work_images (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references works(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt text not null,
  width integer not null,
  height integer not null,
  aspect_ratio text not null,
  object_position text not null default 'center',
  align text not null check (align in ('left', 'center', 'right')),
  scale text not null check (scale in ('hero', 'large', 'medium', 'small')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

audio_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null default 'Minu',
  provider text not null check (provider in ('local', 'soundcloud', 'spotify')),
  artwork_url text,
  duration_ms integer,
  local_audio_path text,
  local_audio_url text,
  soundcloud_url text,
  soundcloud_playlist_url text,
  playlist_index integer,
  visibility text check (visibility in ('public', 'private-link')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

work_audio (
  work_id uuid primary key references works(id) on delete cascade,
  audio_track_id uuid not null references audio_tracks(id)
);

archive_releases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  type text not null check (type in ('single', 'ep', 'album', 'playlist')),
  provider text not null check (provider in ('soundcloud')),
  artwork_url text not null,
  year text,
  soundcloud_playlist_url text,
  visibility text check (visibility in ('public', 'private-link')),
  description text,
  status text not null check (status in ('draft', 'published')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

archive_tracks (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references archive_releases(id) on delete cascade,
  title text not null,
  artist text not null,
  artwork_url text not null,
  duration_ms integer,
  soundcloud_url text,
  soundcloud_playlist_url text,
  playlist_index integer,
  track_number integer,
  visibility text check (visibility in ('public', 'private-link')),
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

index_items (
  id uuid primary key default gen_random_uuid(),
  year text not null,
  title text not null,
  role text not null,
  status text not null check (status in ('draft', 'published')),
  sort_order integer not null default 0
);

contact_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  sort_order integer not null default 0
);
```

## 8. Storage Design

Buckets:

- `work-images`
- `work-audio`
- `archive-artwork`

Path pattern:

- `works/{workId}/{imageId}.{ext}`
- `audio/{audioTrackId}.{ext}`
- `archive/{releaseId}/{assetId}.{ext}`

Upload limits for V1:

- Image max size: 8 MB
- Audio max size: 25 MB
- Image formats: jpg, png, webp, avif
- Audio formats: mp3, m4a, wav

Recommended processing:

- Store original only in V1.
- Add generated thumbnails and compressed variants in V2.
- Show warning if audio is larger than the limit instead of trying to transcode in browser.

## 9. Security Model

Authentication:

- Supabase Auth.
- Admin access allowed only when the user exists in `admin_profiles`.

Authorization:

- Public anonymous users can read only published records.
- Admin users can read drafts and write content.
- Storage uploads require admin session.
- Storage public reads are allowed only for published media, or public URLs are generated at publish time.

Secrets:

- `VITE_SUPABASE_URL` can be public.
- `VITE_SUPABASE_ANON_KEY` can be public when RLS is correct.
- Supabase service role key must never be exposed to the browser.
- If server functions need service role access, keep it in Vercel environment variables only.

Risk controls:

- Validate file type and size before upload.
- Validate URLs before save.
- Keep SoundCloud private secret URLs visible only in admin forms and public playback output when needed.
- Add a confirmation step before deleting works, releases, images, or audio.
- Prefer soft delete for content records in V1.

## 10. Validation Rules

Use Zod schemas shared by admin forms and any server functions.

Core schemas:

- `WorkInputSchema`
- `WorkImageInputSchema`
- `AudioTrackInputSchema`
- `ArchiveReleaseInputSchema`
- `ArchiveTrackInputSchema`
- `IndexItemInputSchema`
- `ContactLinkInputSchema`

Important constraints:

- `status = published` requires all public fields.
- `soundcloud_url` must start with `https://soundcloud.com/`.
- `visibility = private-link` should warn when URL has no `secret_token`.
- `scale`, `align`, `provider`, and `type` are enum-backed controls, not text inputs.
- `sort_order` is controlled by drag order, not hand typed.

## 11. Admin UX Principles

The admin interface is operational, not exhibition-like.

Visual direction:

- Use the existing black and white palette.
- Keep high-density forms readable.
- Use accent only for save, publish, active state, and validation focus.
- Use tables, segmented controls, select menus, upload buttons, and sortable lists.
- Avoid decorative cards and marketing-style hero sections.

Primary components:

- Admin shell with left navigation.
- Dense content table.
- Detail editor with sticky action bar.
- Asset upload dropzone.
- Sortable image list.
- Inline validation messages.
- Mobile preview and desktop preview panels.
- Publish confirmation modal.

States:

- Empty state with one primary action.
- Saving state.
- Uploading state.
- Unsaved changes state.
- Validation blocked state.
- Publish success state.
- Storage limit warning state.

## 12. Implementation Phases

### Phase 1 - Data and Auth Foundation

- Create Supabase project.
- Add env vars.
- Add Supabase client.
- Create DB schema and RLS policies.
- Create admin login route.
- Create admin guard.
- Seed current hardcoded Works, Archive, Index, and Contact into Supabase.

Exit criteria:

- Admin can log in.
- Public site still works from current static data.
- Supabase has equivalent content.

### Phase 2 - Works Admin

- Build `/admin/works`.
- Build `/admin/works/:workId`.
- Add image upload.
- Add audio upload.
- Add work preview.
- Add publish validation.

Exit criteria:

- A non-developer can create a draft work with variable images and one audio track.
- Published Works can be read from Supabase in a hidden integration path.

### Phase 3 - Public Works Migration

- Switch public Works data source from `src/data/siteContent.ts` to Supabase.
- Keep a static fallback for failed fetch.
- Preserve `MainWorks` rendering behavior.
- Preserve fixed entry audio behavior.

Exit criteria:

- Public Works reflects published admin changes.
- Drafts never appear publicly.

### Phase 4 - Archive Admin

- Build `/admin/archive`.
- Build release editor.
- Build nested track editor.
- Support SoundCloud public and private-link entries.

Exit criteria:

- A non-developer can add an album card and nested tracks without code changes.
- Public Archive reflects published release changes.

### Phase 5 - Index, Contact, Publish Flow

- Build Index and Contact editor.
- Add global Preview Site action.
- Add publish log.
- Add rollback to previous published snapshot if needed.

Exit criteria:

- All currently hardcoded site content is manageable in admin.

## 13. Migration Notes

The current hardcoded files should stay during the migration as fallback data.

Suggested migration order:

1. Add Supabase schema.
2. Write one seed script that reads current data files and inserts equivalent records.
3. Build admin against Supabase.
4. Add a feature flag: `VITE_CONTENT_SOURCE=static | supabase`.
5. Test Supabase content source in preview.
6. Switch production to Supabase when stable.

## 14. Open Questions

- Should admin login use password or magic link?
- Should uploaded audio be local-only, or should the admin also support SoundCloud for Works?
- Should drafts have a full preview URL that does not affect the public site?
- Should old media files be retained after records are deleted?
- Should V1 allow multiple admins, or only one owner account?

## 15. First Build Recommendation

Start with Phase 1 and Phase 2 only.

Do not migrate the public site immediately. Build the admin against Supabase, seed the current content, and verify that a non-developer can create a realistic Main Work draft. Once that flow feels good, switch the public Works section to Supabase behind a feature flag.
