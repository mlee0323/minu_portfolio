# Minu Spatial Sound Portfolio Design System

Reference direction: the media-led asymmetry surfaced by Lazyweb portfolio references,
combined with the typographic compression and multi-layer edge treatment documented in
the Vercel design reference. The result must remain Minu's own black-box exhibition and
studio tool, not a branded clone.

## 1. Atmosphere & Identity

The site is a mobile-first one-page portfolio for a spatial music composer and sound producer. The primary feeling is a black-box exhibition opening: sound first, then direct scroll-based discovery through Works. The paired admin surface is the control room behind that exhibition: pale mineral surfaces, precise dark chrome, and a single acid signal color.

The memorable moment is the transition from the near-black entry into a tall, irregular
sequence of luminous work plates. The admin echoes that same material language without
copying the public composition: artwork remains dimensional while controls stay quiet.

The functional contract remains provider-based audio. Local works, SoundCloud Widget playback, and future providers share one Audio Manager so only one source is active at a time.

## 2. Color

### Palette

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Blackout | `--color-blackout` | `#070706` | Deep image wells and first-visit intro darkness |
| Black | `--color-panel` | `#191916` | Works, archive, now-playing, selected admin chrome |
| Elevated black | `--color-panel-elevated` | `#23231f` | Layered dark controls and canvas surround |
| Mineral page | `--color-page` | `#f1f0eb` | Page and admin workspace background |
| Paper surface | `--color-page-soft` | `#faf9f5` | Inputs, admin panels, readable information surfaces |
| Text | `--color-text` | `#191916` | Primary text on mineral surfaces |
| Inverse text | `--color-inverse` | `#f8f7f2` | Text on black |
| Muted text | `--color-muted` | `#716f66` | Body copy and secondary metadata |
| Subtle text | `--color-subtle` | `#99968c` | Durations and quiet labels |
| Line | `--color-line` | `#d9d6cc` | Hairline dividers and ring shadows |
| Strong line | `--color-line-strong` | `#b9b5a9` | Emphasized control boundaries |
| Signal accent | `--color-accent` | `#c8e33d` | Play, publish, current work, selected element |
| Accent soft | `--color-accent-soft` | `#eef4c8` | Quiet selected and focus-adjacent surfaces |
| Accent ink | `--color-accent-ink` | `#191916` | Text/icons inside accent controls |
| Focus | `--color-focus` | `#6e7a22` | Keyboard focus rings in the accent hue |
| Status/warm | `--color-amber` | `#a56f12` | Ended status |
| Status/error | `--color-danger` | `#b23d34` | Playback and form errors |
| Social mark | `--color-social` | `#191916` | Black Instagram and SoundCloud contact marks |

### Rules

- Warm black and mineral white dominate every viewport.
- Accent is a signal only: play, focus, link hover, or an active audio source.
- Artwork can carry texture, but the interface must not become colorful.
- Social marks use the same near-black as the primary text for a unified footer treatment.
- Cards use a shadow-as-border stack instead of heavy outlines: ring, 2px ambient lift,
  and a distant tinted shadow. Dark surfaces use the inverse version of the same stack.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Usage |
| --- | --- | --- | --- | --- |
| Section/mobile | `clamp(3.4rem, 15vw, 8rem)` | 560–620 | 0.86 | Works, Archive, Index headings |
| Work title | `clamp(2.1rem, 9vw, 4.8rem)` | 580 | 0.88 | Main work panels |
| Admin title | `clamp(2.25rem, 5vw, 5.5rem)` | 600 | 0.86 | Current admin section |
| Body | `0.86rem` to `1rem` | 420 to 520 | 1.42 to 1.62 | Captions and editorial copy |
| UI | `0.75rem` to `0.875rem` | 500 to 600 | 1.2 to 1.45 | Buttons, fields, navigation |
| Mono caption | `0.66rem` to `0.75rem` | 520 to 600 | 1.2 | Time, count, status, coordinates |

### Font Stack

- Primary: `"Geist Variable", ui-sans-serif, system-ui, sans-serif`.
- Technical: `"Geist Mono Variable", ui-monospace, SFMono-Regular, monospace`.
- Display tracking tightens from `-0.035em` to `-0.06em`; body tracking stays neutral.
- Numbers, durations, status, counts, and canvas measurements use the technical face with tabular figures.
- Korean body copy uses `word-break: keep-all` and balanced wrapping to avoid particle and clause orphans.

## 4. Spacing & Layout

### Base Unit

Spacing follows a 4px rhythm, with large vertical pacing for exhibition-like quiet.

| Pattern | Value | Usage |
| --- | --- | --- |
| Mobile section padding | `84px 16px` | Works, Archive, Index |
| Desktop section padding | `112px 48px` | Wider scan paths |
| Entry Works | `auto` | First viewport after intro; no separate hero section |
| Works image stack | data `aspectRatio` + `scale` | Scroll-triggered installation fragments |
| Desktop content max | `1280px` | Text and work stage |
| Admin content max | `1800px` | Full editing workspace |
| Bottom player | `88px` to `104px` | Fixed Now Playing clearance |

### Breakpoints

- `max-width: 560px`: QR/mobile exhibition entry.
- `min-width: 768px`: wider archive cards and index rows; the public Works canvas scales to a centered 720px maximum display width.
- `min-width: 860px`: existing desktop shell compatibility and larger player sizing.
- `min-width: 1180px`: full three-zone admin editor and expanded public media stage.

## 5. Components

### Blackout Intro

- **Structure**: testing-phase full-screen black overlay with only three small centered dots at entry.
- **Timing**: dots begin subtle movement after 5 seconds; `Tap to start` appears after 8 seconds.
- **Interaction**: tap requests the local intro sound, briefly shows `headphones recommended`, then fades directly to Works after about 2.4 seconds.
- **Persistence**: disabled during testing so every reload shows the intro; `src/lib/introStorage.ts` remains available for the later returning-visitor behavior.
- **Accessibility**: semantic button with clear start label, keyboard activation, and reduced-motion support.

### Site Nav

- **Structure**: fixed compact brand plus anchor links.
- **Interaction**: anchor scroll to Works, Archive, Index.
- **Style**: blend over black/white surfaces without adding a heavy header block.

### Main Works Scroll

- **Structure**: image-only black-background sequence rendered from the same 390px logical canvas and element rectangles as the Admin Mobile Preview, then proportionally scaled for wider public displays.
- **Entry**: Works is the first visible section after the intro; no standalone hero page and no Works title/subtitle block.
- **Data**: the public page reads validated Admin draft content from the same browser when present, otherwise it reads the generated published content. Work canvas height and each image `layout` rectangle are the canonical public placement values.
- **Responsive rule**: the public canvas uses the 390px logical composition on narrow screens and scales that same composition proportionally up to a centered 720px display width on wider screens. Desktop never switches Works to a separate composition.
- **Interaction**: Works has no current-work label, caption overlay, closing caption, or active-image highlight. Images remain the only visible content.
- **Audio**: the entry local sound remains fixed while scrolling Works during this prototype phase. Scroll-triggered audio switching and crossfade remain V2 Web Audio extension points.

### Archive Carousel & Album Detail

- **Structure**: horizontal swipe carousel of album jackets. Each card keeps the title directly under
  the jacket and a compact SoundCloud listening strip below it; track rows are not shown inside the
  card.
- **Album detail**: selecting a jacket or title opens `/archive/:releaseId` with the full track list,
  release description, cover, and SoundCloud destination.
- **Full view**: the `View all releases` control in the top-right expands every album's track list
  below the cards without navigating away.
- **Responsive count**: the carousel shows one album on mobile, up to two on constrained tablet/desktop columns, and never more than three visible albums on wide screens.
- **Wide-screen alignment**: groups of one to three releases center as a finite collection at `1180px` and above; four or more releases stay left-anchored and horizontally scrollable.
- **Interaction**: card hover reveals the album destination; listening buttons route to the SoundCloud provider using the official Widget API. `Full archive` points to the same `https://soundcloud.com/syawla_nnuu` account used in the footer.
- **Data**: edit `archiveReleases`; `archiveTracks` remains the flattened compatibility output.

### SoundCloud Transport Host

- **Structure**: an off-screen official SoundCloud iframe keeps Widget API playback available to Archive & Sound and the fixed Now Playing bar.
- **Visibility**: no separate `Embedded listening` panel or duplicate transport controls are visible on the page.
- **Rules**: REST metadata never drives playback. Private items require SoundCloud secret share URLs.

### Index & Contact

- **Structure**: neutral list/table mode for curators and collaborators; no extra explanatory label beside the heading.
- **Style**: no expressive imagery, no color beyond text and hairlines.
- **Closing rhythm**: the footer keeps only compact optical breathing room before the fixed player clearance; section and shell padding must not stack into a second empty band.
- **Contact actions**: the email address is visible as `llsyawla@gmail.com` and opens an accessible mail composer dialog that launches a `mailto:` draft. Instagram and SoundCloud use black SVG marks and open in a new window with `noopener` protection.

### Now Playing Bar

- **Structure**: fixed bottom console with artwork, source, status, play/pause toggle, and progress.
- **Interaction**: clicking the control or pressing Space toggles the current active source; paused tracks resume through the same provider interface.
- **Accessibility**: `aria-live="polite"` announces source changes.

### Admin Console

- **Structure**: `/admin` lazy-loads a separate editing shell so the public portfolio does not load admin UI code during normal visits.
- **Current data mode**: saving validates and writes the draft to browser `localStorage`, which updates the public site in the same browser. Authenticated production save also publishes the generated content file, so other visitors receive the change after deployment.
- **Works editor**: desktop-only Canva-lite workflow with a left asset/upload panel, Mobile/Web preview toggle, fit-to-screen draggable canvas, one responsive work height control, one mobile-first responsive layout per image/text element, deletable work records, directly editable text blocks with a mouse drag handle, and a right inspector for work and element settings. Both preview modes use the public site's canonical 390px artwork column and identical image crop rules; Web changes the frame treatment, not the composition.
- **Archive and Index editing**: the Archive panel edits the jacket URL, title, detail description,
  SoundCloud URLs, track order, track metadata, and track descriptions used by the card, detail, and
  full-view states. Text records and contact links use dense form panels rather than portfolio-style
  media layouts.
- **Target viewport**: desktop editing only. Small screens keep a basic fallback layout, but QA and future admin design decisions target computer-sized screens.
- **Guardrails**: allowed layout values, canvas dimensions, canvas rectangles, text styles, status values, release types, and visibility values are schema-validated before a draft can be saved.

### Shared Surface Primitives

- **Studio navigation**: compact rectangular navigation with a visible current state, no pill-only sidebar. Hover lifts contrast; active uses dark fill; focus uses a 2px accent-hue ring.
- **Media plate**: image-only black surface positioned by the Admin Mobile canvas rectangle. Public work media has no caption scrim, hover treatment, or current-state edge.
- **Control button**: 6px radius, 40px minimum target, 500–600 weight. Primary is dark or acid depending on action risk; tertiary is text-led. Hover changes material, active translates 1px, focus is always visible, disabled reduces contrast without removing the label.
- **Information panel**: paper surface with ring + ambient + distant shadow. Nested regions separate with hairlines, not additional floating cards.
- **Field surface**: paper input with shadow-ring boundary, dark text, explicit hover/focus/error/disabled states, and an adjacent label rather than placeholder-only identification.
- **Metric slate**: dark summary surface with mono figures, a quiet descriptor, and no decorative chart. It supports default, hover-link, loading skeleton, and empty copy states.
- **Status rail**: persistent, non-modal draft/publish feedback placed beside the primary content; `aria-live` messages do not move the surrounding layout.
- **Empty and loading states**: skeletons match the panel geometry; empty states explain the first valid action. Errors remain inline and name the failed operation.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
| --- | --- | --- | --- |
| Intro dots | `2800ms` loop after delay | `ease-in-out` | Idle state signal after 5 seconds |
| Intro fade | `900ms`, delayed | `ease` | Blackout to Works |
| Micro | `160ms` to `220ms` | `cubic-bezier(.22,1,.36,1)` | Buttons, rows, panel active states |
| Progress | Native React updates | Width transition only | Playback progress |

- Only `transform`, color, opacity, and progress width animate.
- No decorative motion without state or affordance. Public work plates may reveal once as
  they enter the reading flow; admin motion is limited to selection, resize, publish, and navigation feedback.
- `prefers-reduced-motion: reduce` disables non-essential animation.

## 7. Depth & Surface

### Strategy

The surface behaves like a black-box exhibition document: flat, quiet, high contrast.

| Level | Treatment | Usage |
| --- | --- | --- |
| Blackout | Solid black | Intro and archive surface |
| Full-bleed media | Grayscale image/video | Main works |
| Ring | `0 0 0 1px rgb(25 25 22 / 9%)` | Boundaries without changing box geometry |
| Raised paper | ring + `0 2px 2px rgb(25 25 22 / 4%)` + `0 18px 44px -28px rgb(25 25 22 / 32%)` | Admin panels and player shell |
| Hairline | `1px solid var(--color-line)` | Dividers and information rows |
| Signal | Accent border or fill | Current source and play states |
| Player lift | inverse ring + `0 22px 60px rgb(7 7 6 / 36%)` | Persistent now-playing dock |

### Anti-patterns

- No colorful gradients, orbs, blobs, or decorative SVG art.
- No nested card stacks; nested information uses dividers inside one material surface.
- No emoji icons in UI; use Lucide icons.
- No visible explanatory tutorial copy except required action hints like `Tap to start` and `Swipe to explore`.
- No full-pill primary buttons or capsule-only navigation.
- No raw Inter fallback when Geist assets are available.
