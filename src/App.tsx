import { useState } from "react"
import { AudioManagerProvider } from "./audio/AudioManagerProvider"
import { Archive } from "./components/Archive"
import { Hero } from "./components/Hero"
import { IndexContact } from "./components/IndexContact"
import { IntroOverlay } from "./components/IntroOverlay"
import { LocalAudioBridge } from "./components/LocalAudioBridge"
import { MainWorks } from "./components/MainWorks"
import { NowPlayingBar } from "./components/NowPlayingBar"
import { SiteNav } from "./components/SiteNav"
import { SoundCloudPlayer } from "./components/SoundCloudPlayer"
import { archiveTracks } from "./data/archiveTracks"

export function App() {
  const [experienceStarted, setExperienceStarted] = useState(false)
  const initialSoundCloudTrack = archiveTracks[0]

  if (initialSoundCloudTrack === undefined) {
    return (
      <AudioManagerProvider>
        <main className="app-shell">
          <section className="section-panel">
            <h1>No archive tracks configured.</h1>
          </section>
        </main>
      </AudioManagerProvider>
    )
  }

  return (
    <AudioManagerProvider>
      <LocalAudioBridge />
      {!experienceStarted ? <IntroOverlay onComplete={() => setExperienceStarted(true)} /> : null}
      <SiteNav />
      <main className={experienceStarted ? "app-shell is-started" : "app-shell"}>
        <Hero experienceStarted={experienceStarted} />
        <MainWorks experienceStarted={experienceStarted} />
        <div className="archive-sound-grid">
          <Archive />
          <SoundCloudPlayer initialTrack={initialSoundCloudTrack} />
        </div>
        <IndexContact />
      </main>
      <NowPlayingBar />
    </AudioManagerProvider>
  )
}
