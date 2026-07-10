import { AudioWaveform, MoveDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { mainWorks, mainWorksClosingCaption } from "../data/publishedSiteContent"
import { formatDuration } from "../lib/time"

type MainWorksProps = {
  readonly experienceStarted: boolean
}

export function MainWorks({ experienceStarted }: MainWorksProps) {
  const [activeWorkId, setActiveWorkId] = useState(mainWorks[0]?.id ?? "")
  const activeWorkIdRef = useRef(activeWorkId)
  const cardRefs = useRef(new Map<string, HTMLElement>())

  useEffect(() => {
    activeWorkIdRef.current = activeWorkId
  }, [activeWorkId])

  useEffect(() => {
    if (!experienceStarted) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const centeredEntry = entries.find((entry) => entry.isIntersecting)
        const nextWorkId = centeredEntry?.target.getAttribute("data-work-id")

        if (
          nextWorkId === null ||
          nextWorkId === undefined ||
          nextWorkId === activeWorkIdRef.current
        ) {
          return
        }

        const nextWork = mainWorks.find((work) => work.id === nextWorkId)

        if (nextWork === undefined) {
          return
        }

        activeWorkIdRef.current = nextWork.id
        setActiveWorkId(nextWork.id)
      },
      {
        root: null,
        rootMargin: "-42% 0px -42% 0px",
        threshold: 0,
      },
    )

    for (const element of cardRefs.current.values()) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [experienceStarted])

  const activeWork = mainWorks.find((work) => work.id === activeWorkId) ?? mainWorks[0]

  return (
    <section className="section-panel works-section" id="main-works">
      <div className="works-stage">
        <aside className="works-now-playing" aria-live="polite">
          <span>
            <AudioWaveform size={15} />
            Current Work
          </span>
          <strong>{activeWork?.track.title ?? "Field Study"}</strong>
          <p>{activeWork?.medium ?? "installation sound"}</p>
        </aside>

        <div className="work-scroll-list">
          {mainWorks.map((work, workIndex) => {
            const isCurrent = activeWorkId === work.id

            return (
              <div className="work-image-group" key={work.id}>
                {work.images.map((image, imageIndex) => (
                  <figure
                    className={[
                      "work-panel",
                      `work-panel--${image.scale}`,
                      `work-panel--${image.align}`,
                      isCurrent ? "is-current" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-work-id={work.id}
                    key={image.id}
                    ref={(element) => {
                      if (element === null) {
                        cardRefs.current.delete(image.id)
                        return
                      }
                      cardRefs.current.set(image.id, element)
                    }}
                    style={{
                      "--work-aspect": image.aspectRatio,
                      "--work-position": image.objectPosition,
                    }}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      loading="eager"
                      fetchPriority={workIndex === 0 && imageIndex === 0 ? "high" : "auto"}
                      decoding="async"
                    />
                    {imageIndex === 0 ? (
                      <figcaption className="work-panel__caption">
                        <span>{`${work.year} / ${work.medium}`}</span>
                        <h3>{work.track.title}</h3>
                        <p>{work.caption}</p>
                        <small>{`${work.location} / ${formatDuration(
                          work.track.durationMs ?? 0,
                        )}`}</small>
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <p className="works-closing-caption">
        <MoveDown size={15} />
        {mainWorksClosingCaption}
      </p>
    </section>
  )
}
