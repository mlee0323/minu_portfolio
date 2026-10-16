import "../styles/archiveHero.css"
import { Disc3 } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import {
  type ArchiveHeroDesign,
  type ArchiveHeroElement,
  type ArchiveHeroRelease,
  type ArchiveHeroViewport,
  archiveHeroText,
} from "../data/archiveHero"

export function ArchiveHeroElementContent({
  element,
  release,
  actions,
  semantic = false,
}: {
  readonly element: ArchiveHeroElement
  readonly release: ArchiveHeroRelease
  readonly actions: ReactNode
  readonly semantic?: boolean
}) {
  if (element.kind === "cover" || element.kind === "image") {
    return (
      <img
        className="archive-hero__image"
        src={element.kind === "cover" ? release.artworkUrl : element.src}
        alt={element.kind === "cover" ? `${release.title} artwork` : element.alt}
        draggable={false}
      />
    )
  }
  if (element.kind === "actions")
    return semantic ? (
      <div className="archive-hero__actions">{actions}</div>
    ) : (
      <span className="archive-hero__actions">{actions}</span>
    )
  const text = archiveHeroText(element, release)
  if (semantic && element.kind === "title") return <h1 className="archive-hero__text">{text}</h1>
  return (
    <span
      className={`archive-hero__text${element.kind === "metadata" ? " archive-hero__metadata" : ""}`}
    >
      {element.kind === "metadata" ? <Disc3 aria-hidden="true" /> : null}
      {text}
    </span>
  )
}

export function archiveHeroElementStyle(
  element: ArchiveHeroElement,
  viewport: ArchiveHeroViewport,
): CSSProperties {
  const style = element.styles[viewport]
  return {
    color: style.color,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    textAlign: style.textAlign,
  }
}

export function ArchiveHero({
  design,
  release,
  actions,
}: {
  readonly design: ArchiveHeroDesign
  readonly release: ArchiveHeroRelease
  readonly actions: ReactNode
}) {
  return (
    <div className="archive-hero">
      <div
        className="archive-hero__stage"
        style={
          {
            "--hero-canvas-height-mobile": design.heights.mobile,
            "--hero-canvas-height-desktop": design.heights.desktop,
          } as CSSProperties
        }
      >
        {design.elements.map((element) => {
          const variables: Record<string, string | number> = {}
          for (const viewport of ["mobile", "desktop"] as const) {
            const rect = element.layouts[viewport]
            const style = element.styles[viewport]
            for (const [key, value] of Object.entries(rect))
              variables[`--hero-${key}-${viewport}`] = value
            variables[`--hero-font-size-${viewport}`] = style.fontSize
            variables[`--hero-font-weight-${viewport}`] = style.fontWeight
            variables[`--hero-line-height-${viewport}`] = style.lineHeight
            variables[`--hero-text-align-${viewport}`] = style.textAlign
            variables[`--hero-color-${viewport}`] = style.color
          }
          return (
            <div
              key={element.id}
              className="archive-hero__element"
              style={variables as CSSProperties}
            >
              <ArchiveHeroElementContent
                element={element}
                release={release}
                actions={actions}
                semantic
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
