import type { CSSProperties } from "react"
import { getViewportRectForLayout, getWorkCanvasDimensions } from "../admin/adminCanvas"
import type { AdminWork, AdminWorkImage } from "../admin/adminTypes"

type MainWorksProps = {
  readonly works: readonly AdminWork[]
}

function percentage(value: number, total: number): string {
  return `${String((value / total) * 100)}%`
}

function canvasStyleFor(work: AdminWork): CSSProperties {
  const dimensions = getWorkCanvasDimensions(work, "mobile")

  return {
    aspectRatio: `${String(dimensions.width)} / ${String(dimensions.height)}`,
  }
}

function imageStyleFor(work: AdminWork, image: AdminWorkImage): CSSProperties {
  const dimensions = getWorkCanvasDimensions(work, "mobile")
  const rect = getViewportRectForLayout(image.layout, "mobile", dimensions)

  return {
    top: percentage(rect.y, dimensions.height),
    left: percentage(rect.x, dimensions.width),
    width: percentage(rect.width, dimensions.width),
    height: percentage(rect.height, dimensions.height),
  }
}

export function MainWorks({ works }: MainWorksProps) {
  return (
    <section className="section-panel works-section" id="main-works" aria-label="Works">
      <div className="public-work-list">
        {works.map((work, workIndex) => (
          <article
            className="public-work-canvas"
            data-work-id={work.id}
            key={work.id}
            style={canvasStyleFor(work)}
            aria-label={work.title}
          >
            {[...work.images]
              .sort((left, right) => left.sortOrder - right.sortOrder)
              .map((image, imageIndex) => (
                <figure
                  className="public-work-image"
                  data-image-id={image.id}
                  key={image.id}
                  style={imageStyleFor(work, image)}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    loading={workIndex === 0 ? "eager" : "lazy"}
                    fetchPriority={workIndex === 0 && imageIndex === 0 ? "high" : "auto"}
                    decoding="async"
                    style={{ objectPosition: image.objectPosition }}
                  />
                </figure>
              ))}
          </article>
        ))}
      </div>
    </section>
  )
}
