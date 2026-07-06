import { Headphones, Volume2, VolumeX } from "lucide-react"
import { useState } from "react"
import { useAudioManager, useAudioPlayback } from "../audio/AudioManagerProvider"
import { heroContent, mainWorks } from "../data/siteContent"

type HeroProps = {
  readonly experienceStarted: boolean
}

function renderTypedStatement(statement: string) {
  let glyphIndex = 0
  const words = statement.split(" ")

  return words.map((word, wordIndex) => {
    const letters = Array.from(word)
    const isLastWord = wordIndex === words.length - 1
    const letterNodes = letters.map((letter, letterIndex) => {
      const delayMs = glyphIndex * 44
      glyphIndex += 1

      return (
        <span
          aria-hidden="true"
          className="typing-letter"
          key={`${letter}-${String(wordIndex)}-${String(letterIndex)}`}
          style={{ animationDelay: `${String(delayMs)}ms` }}
        >
          {letter}
        </span>
      )
    })
    const spaceDelayMs = glyphIndex * 44

    if (!isLastWord) {
      glyphIndex += 1
    }

    return (
      <span className="typing-word" key={`${word}-${String(wordIndex)}`}>
        {letterNodes}
        {!isLastWord ? (
          <span
            aria-hidden="true"
            className="typing-letter typing-letter--space"
            style={{ animationDelay: `${String(spaceDelayMs)}ms` }}
          >
            {"\u00a0"}
          </span>
        ) : null}
      </span>
    )
  })
}

export function Hero({ experienceStarted }: HeroProps) {
  const manager = useAudioManager()
  const playback = useAudioPlayback()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const heroTrack = mainWorks[0]?.track

  if (heroTrack === undefined) {
    return null
  }

  const isSoundOn =
    playback.currentTrack?.id === heroTrack.id &&
    (playback.status === "playing" || playback.status === "loading")

  const toggleHeroSound = () => {
    setErrorMessage(null)

    if (isSoundOn) {
      manager.pauseActive()
      return
    }

    void manager.play({ provider: "local", track: heroTrack }).catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Could not start local audio")
    })
  }

  return (
    <section className={experienceStarted ? "hero-section is-revealed" : "hero-section"} id="hero">
      <div className="hero-visual">
        {heroContent.videoUrl === null ? (
          <img
            src={heroContent.posterUrl}
            alt=""
            width={556}
            height={752}
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <video autoPlay loop muted playsInline poster={heroContent.posterUrl} preload="none">
            <source src={heroContent.videoUrl} type="video/mp4" />
          </video>
        )}
        <div className="hero-visual__shade" />
        <span className="hero-visual__mark">space+sound</span>
      </div>

      <div className="hero-copy">
        <p className="headphone-tag">
          <Headphones size={16} />
          {heroContent.kicker}
        </p>
        <h1 aria-label={heroContent.statement}>{renderTypedStatement(heroContent.statement)}</h1>
        <p>{heroContent.body}</p>
        <div className="hero-actions">
          <button
            className="pill-button pill-button--accent"
            type="button"
            onClick={toggleHeroSound}
            aria-pressed={isSoundOn}
          >
            {isSoundOn ? <VolumeX size={18} /> : <Volume2 size={18} />}
            {isSoundOn ? "Sound off" : "Sound on"}
          </button>
          <a className="pill-button pill-button--ghost" href="#main-works">
            Enter works
          </a>
        </div>
        {errorMessage !== null ? <p className="inline-error">{errorMessage}</p> : null}
      </div>
    </section>
  )
}
