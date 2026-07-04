# Minu Audio Archive Design System

## 1. Atmosphere & Identity

The app is a responsive editorial audio archive. The supplied PDF reference defines the visual contract: warm off-white page, black poster panels, oversized lowercase wordmark, hairline dividers, compact media rows, and generous vertical rhythm.

The functional contract remains audio-first: local tracks, SoundCloud Widget playback, and future providers all share one manager so only one source can play at a time.

## 2. Color

### Palette

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Page | `--color-page` | `#f7f6f2` | Warm editorial background |
| Page/soft | `--color-page-soft` | `#ffffff` | Embedded white surfaces and iframes |
| Panel | `--color-panel` | `#1f1b1a` | Hero mark panel, widget panel, footer, now playing |
| Panel/strong | `--color-panel-strong` | `#ffffff` | Archive rows and neutral tiles |
| Control | `--color-control` | `#ffffff` | Secondary buttons |
| Control/hover | `--color-control-hover` | `#efede7` | Hovered neutral controls |
| Text | `--color-text` | `#1f1b1a` | Primary text |
| Inverse text | `--color-inverse` | `#ffffff` | Text on black panels |
| Muted text | `--color-muted` | `#5f5a55` | Body copy and secondary metadata |
| Subtle text | `--color-subtle` | `#8a847c` | Durations and quiet labels |
| Line | `--color-line` | `#d5d0c8` | Hairline section dividers |
| Accent | `--color-accent` | `#1f1b1a` | Active play controls |
| Accent ink | `--color-accent-ink` | `#ffffff` | Text/icons inside active controls |
| Status/warm | `--color-amber` | `#b67b00` | Ended status |
| Status/error | `--color-danger` | `#ad2f22` | Playback errors |

### Rules

- The page is light, but audio consoles are black.
- Color comes mainly from track artwork; interface chrome stays restrained.
- Accent is functional only: play, current source, progress, focus, and active state.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Usage |
| --- | --- | --- | --- | --- |
| Wordmark/mobile | `clamp(5.8rem, 28vw, 8.4rem)` | 500 | 0.85 | Mobile `minu` mark |
| Wordmark/desktop | `clamp(8.2rem, 12vw, 12.8rem)` | 500 | 0.85 | Desktop `minu` mark |
| Hero/mobile | `clamp(2.5rem, 15vw, 3.45rem)` | 650 | 0.98 | Mobile hero statement |
| Hero/desktop | `clamp(4rem, 6.5vw, 7rem)` | 650 | 0.98 | Desktop hero statement |
| Section/mobile | `clamp(3.4rem, 17vw, 5.9rem)` | 430 | 0.86 | Section headings |
| Section/desktop | `clamp(5rem, 7vw, 7.2rem)` | 430 | 0.86 | Desktop section headings |
| Body | `0.9rem` to `1rem` | 650 | 1.28 to 1.34 | Editorial copy |
| Caption | `0.66rem` to `0.78rem` | 800 to 900 | 1.2 | Kicker, badges, status |

### Font Stack

- Primary: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Letter spacing stays `0` for all visible text.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a 4px rhythm, with expressive editorial gaps for section cadence.

| Token/Pattern | Value | Usage |
| --- | --- | --- |
| Mobile shell | `min(344px, calc(100% - 28px))` | Phone-width reference column |
| Small phone shell | `min(100% - 20px, 344px)` | 320-560px guard |
| Tablet shell | `min(480px, calc(100% - 48px))` | Larger single column |
| Desktop shell | `min(1160px, calc(100% - 72px))` | Two-column editorial layout |
| Hero gap/mobile | `42px` | Reference-like vertical rhythm |
| Hero gap/desktop | `54px` | Split hero spacing |
| Content gap | `58px` | Main column and section spacing |
| Desktop section gap | `96px` to `112px` | Large page rhythm |
| Bottom player | `88px` to `104px` | Fixed Now Playing clearance |

### Breakpoints

- `max-width: 560px`: phone layout, compact shell, short widget frame.
- `640px to 859px`: tablet layout, wider single column while retaining the PDF-like vertical rhythm.
- `min-width: 860px`: desktop layout, hero and main content become asymmetric two-column grids.

## 5. Components

### Editorial Hero

- **Structure**: black wordmark panel plus editorial copy panel.
- **Mobile**: stacked column, reference-like masthead card.
- **Desktop**: two columns, large black mark panel left, statement and controls right.
- **States**: local audio button text switches to `Playing Local`.

### Pill Button

- **Structure**: semantic `button` or `a` with Lucide icon and label.
- **Variants**: accent, neutral, ghost.
- **Shape**: full pill radius.
- **States**: hover changes color and lifts by 1px, active provider changes copy/state, disabled lowers opacity.
- **Accessibility**: visible label or `aria-label`.

### Icon Button

- **Structure**: circular semantic `button` with Lucide icon.
- **Usage**: compact play/pause controls in work tiles, widget, and now-playing.
- **States**: same hover/focus/disabled behavior as pill buttons.

### Track Artwork

- **Structure**: real image with stable square or fixed aspect sizing.
- **Sizes**: small row artwork, medium widget artwork, large future hero artwork.
- **Rules**: no placeholder-only artwork for configured tracks.

### Work Tile

- **Structure**: artwork, title, description, duration, play button.
- **Mobile/tablet**: two media tiles inside the column.
- **Desktop**: larger images inside the left content column.
- **States**: current local source marks the tile with current styling.

### SoundCloud Widget Panel

- **Structure**: black editorial panel, Widget API metadata, play/pause/status controls, official iframe.
- **Rules**: official SoundCloud embed iframe is always rendered; REST metadata never drives playback.
- **Responsive**: iframe height grows from phone to desktop.

### Archive Row/Card

- **Mobile/tablet**: compact stacked list rows with artwork, title, artist, and play pill.
- **Desktop**: three-column card row under the Archive heading.
- **States**: current SoundCloud track switches button to `Current`.

### Now Playing Bar

- **Structure**: fixed bottom console with artwork, current track, source, status, pause, and progress.
- **Mobile/tablet**: centered compact dock, progress on its own row.
- **Desktop**: wider dock with identity, meter, and controls in one grid.
- **Accessibility**: `aria-live="polite"` announces track changes.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
| --- | --- | --- | --- |
| Micro | `140ms` to `160ms` | `ease` / `ease-out` | Button and row hover |
| Progress | Native React state updates | Width transition only | Playback progress |

- Only `transform`, color, opacity, and progress width should animate.
- No decorative motion without state or affordance.
- `prefers-reduced-motion: reduce` disables non-essential transitions.

## 7. Depth & Surface

### Strategy

The reference is mostly flat editorial print logic. Depth is minimal and functional.

| Level | Treatment | Usage |
| --- | --- | --- |
| Base | Warm off-white | Page |
| Black panel | Solid `--color-panel` | Hero, widget, footer, now-playing |
| Hairline | `1px solid var(--color-line)` | Section dividers and archive rows |
| Artwork lift | `--shadow-panel` | Track images only |
| Player lift | `0 18px 40px rgb(31 27 26 / 22%)` | Persistent now-playing dock |

### Anti-patterns

- No nested cards inside cards.
- No decorative gradients, orbs, blobs, or SVG hero illustrations.
- No one-hue purple/blue SaaS palette.
