import { AudioWaveform, MoveDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useAudioManager, useAudioPlayback } from "../audio/AudioManagerProvider"
import { mainWorks, mainWorksClosingCaption } from "../data/siteContent"
import { formatDuration } from "../lib/time"

type MainWorksProps = {
  readonly experienceStarted: boolean
}

export function MainWorks({ experienceStarted }: MainWorksProps) {
  const manager = useAudioManager()
  const playback = useAudioPlayback()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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
        setErrorMessage(null)
        void manager.play({ provider: "local", track: nextWork.track }).catch((error: unknown) => {
          setErrorMessage(error instanceof Error ? error.message : "Could not start local audio")
        })
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
  }, [experienceStarted, manager])

  const activeWork = mainWorks.find((work) => work.id === activeWorkId) ?? mainWorks[0]

  return (
    <section className="section-panel works-section" id="main-works">
      <div className="section-heading">
        <h2>Works</h2>
        <p>Four installation records arranged as a slow vertical listening path.</p>
      </div>

      <div className="works-stage">
        <aside className="works-now-playing" aria-live="polite">
          <span>
            <AudioWaveform size={15} />
            Now Playing
          </span>
          <strong>{activeWork?.track.title ?? "Field Study"}</strong>
          <p>{activeWork?.medium ?? "installation sound"}</p>
        </aside>

        <div className="work-scroll-list">
          {mainWorks.map((work) => {
            const isCurrent =
              playback.currentTrack?.id === work.track.id || activeWorkId === work.id

            return (
              <article
                className={isCurrent ? "work-panel is-current" : "work-panel"}
                data-work-id={work.id}
                key={work.id}
                ref={(element) => {
                  if (element === null) {
                    cardRefs.current.delete(work.id)
                    return
                  }
                  cardRefs.current.set(work.id, element)
                }}
              >
                <img
                  src={work.track.artworkUrl}
                  alt={`${work.track.title} installation record`}
                  width={960}
                  height={1280}
                  loading="lazy"
                />
                <div className="work-panel__caption">
                  <span>{`${work.year} / ${work.medium}`}</span>
                  <h3>{work.track.title}</h3>
                  <p>{work.caption}</p>
                  <small>{`${work.location} / ${formatDuration(work.track.durationMs ?? 0)}`}</small>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <p className="works-closing-caption">
        <MoveDown size={15} />
        {mainWorksClosingCaption}
      </p>
      {errorMessage !== null ? <p className="inline-error">{errorMessage}</p> : null}
    </section>
  )
}
