# Minu Spatial Sound Portfolio Design System

## 1. Atmosphere & Identity

The site is a mobile-first one-page portfolio for a spatial music composer and sound producer. The primary feeling is a black-box exhibition opening: sound first, image second, then slow scroll-based discovery.

The functional contract remains provider-based audio. Local works, SoundCloud Widget playback, and future providers share one Audio Manager so only one source is active at a time.

## 2. Color

### Palette

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Black | `--color-panel` | `#201e1c` | Intro blackout, hero overlay, archive surface, now-playing |
| White | `--color-page` | `#f5f5f5` | Page background and text surfaces |
| White/soft | `--color-page-soft` | `#f5f5f5` | Iframes, controls, bright panels |
| Text | `--color-text` | `#201e1c` | Primary text on white |
| Inverse text | `--color-inverse` | `#f5f5f5` | Text on black |
| Muted text | `--color-muted` | `#68625d` | Body copy and secondary metadata |
| Subtle text | `--color-subtle` | `#918b84` | Durations and quiet labels |
| Line | `--color-line` | `#d8d6d1` | Hairline dividers |
| Signal accent | `--color-accent` | `#d8ff3f` | Play, active state, scroll signal, focused interaction |
| Accent ink | `--color-accent-ink` | `#201e1c` | Text/icons inside accent controls |
| Status/warm | `--color-amber` | `#b67b00` | Ended status |
| Status/error | `--color-danger` | `#ad2f22` | Playback errors |

### Rules

- Black and white dominate every viewport.
- Accent is a signal only: play, current work, focus, link hover, or active source.
- Artwork can carry texture, but the interface must not become colorful.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Usage |
| --- | --- | --- | --- | --- |
| Hero/mobile | `clamp(3.8rem, 18vw, 7.8rem)` | 850 | 0.86 | Typed statement |
| Hero/desktop | `clamp(3.8rem, 18vw, 7.8rem)` | 850 | 0.86 | Full-bleed hero statement |
| Section/mobile | `clamp(3.6rem, 16vw, 8.4rem)` | 820 | 0.86 | Works, Archive, Index headings |
| Work title | `clamp(2rem, 10vw, 4.5rem)` | 820 | 0.9 | Main work panels |
| Body | `0.86rem` to `1rem` | 420 to 560 | 1.32 to 1.55 | Captions and editorial copy |
| Caption | `0.66rem` to `0.78rem` | 850 to 900 | 1.2 | Kicker, badges, status |

### Font Stack

- Primary: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- One sans-serif family only.
- Letter spacing stays `0`; hierarchy comes from weight and size contrast.

## 4. Spacing & Layout

### Base Unit

Spacing follows a 4px rhythm, with large vertical pacing for exhibition-like quiet.

| Pattern | Value | Usage |
| --- | --- | --- |
| Mobile section padding | `84px 16px` | Works, Archive, Index |
| Desktop section padding | `112px 48px` | Wider scan paths |
| Hero | `100dvh` | First full viewport after intro |
| Works panel | `74dvh` | Scroll-triggered image/video records |
| Desktop content max | `1120px` | Text and work stage |
| Bottom player | `88px` to `104px` | Fixed Now Playing clearance |

### Breakpoints

- `max-width: 560px`: QR/mobile exhibition entry.
- `min-width: 768px`: sticky Works now-playing column and Archive/Widget split.
- `min-width: 860px`: existing desktop shell compatibility and larger player sizing.

## 5. Components

### Blackout Intro

- **Structure**: full-screen black overlay, centered waveform signal, `Tap to start`.
- **Interaction**: tap requests the local intro sound, waits around 2.4 seconds, then fades to Hero.
- **Accessibility**: semantic button with clear start label.

### Site Nav

- **Structure**: fixed compact brand plus anchor links.
- **Interaction**: anchor scroll to Works, Archive, Index.
- **Style**: blend over black/white surfaces without adding a heavy header block.

### Spatial Hero

- **Structure**: full-bleed muted looping video with poster fallback, black overlay, large typed statement.
- **Interaction**: sound on/off button routes through the shared Audio Manager.
- **States**: accent button marks the action; typed letters animate only through opacity/transform.

### Main Works Scroll

- **Structure**: four tall work panels with image/video records and overlaid captions.
- **Interaction**: Intersection Observer detects the centered work and updates sticky Now Playing text plus active border.
- **Audio**: active work can request local provider playback after the intro tap. Crossfade remains a V2 Web Audio extension point.
- **Caption**: Korean closing caption frames the website as a trace of the installation, not the work itself.

### Archive Carousel

- **Structure**: horizontal swipe carousel of SoundCloud releases/playlists.
- **Interaction**: release and track buttons route to the SoundCloud provider using the official Widget API.
- **Data**: edit `archiveReleases`; `archiveTracks` remains the flattened compatibility output.

### SoundCloud Widget Panel

- **Structure**: official SoundCloud iframe plus synchronized Widget metadata.
- **Rules**: REST metadata never drives playback. Private items require SoundCloud secret share URLs.

### Index & Contact

- **Structure**: neutral list/table mode for curators and collaborators.
- **Style**: no expressive imagery, no color beyond text and hairlines.

### Now Playing Bar

- **Structure**: fixed bottom console with artwork, source, status, pause, and progress.
- **Accessibility**: `aria-live="polite"` announces source changes.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
| --- | --- | --- | --- |
| Intro fade | `900ms`, delayed | `ease` | Blackout to Hero |
| Type-in | `520ms` per letter | `ease` | Hero statement rhythm |
| Micro | `140ms` to `160ms` | `ease-out` | Buttons, rows, panel active states |
| Progress | Native React updates | Width transition only | Playback progress |

- Only `transform`, color, opacity, and progress width animate.
- No decorative motion without state or affordance.
- `prefers-reduced-motion: reduce` disables non-essential animation.

## 7. Depth & Surface

### Strategy

The surface behaves like a black-box exhibition document: flat, quiet, high contrast.

| Level | Treatment | Usage |
| --- | --- | --- |
| Blackout | Solid black | Intro and archive surface |
| Full-bleed media | Grayscale image/video | Hero and main works |
| Hairline | `1px solid var(--color-line)` | Dividers and information rows |
| Signal | Accent border or fill | Current source and play states |
| Player lift | `0 18px 40px rgb(31 27 26 / 22%)` | Persistent now-playing dock |

### Anti-patterns

- No colorful gradients, orbs, blobs, or decorative SVG hero art.
- No nested cards inside cards.
- No emoji icons in UI; use Lucide icons.
- No visible explanatory tutorial copy except required action hints like `Tap to start` and `Swipe to explore`.
