import { AudioManagerProvider } from "./audio/AudioManagerProvider"
import { Archive } from "./components/Archive"
import { Hero } from "./components/Hero"
import { LocalAudioBridge } from "./components/LocalAudioBridge"
import { MainWorks } from "./components/MainWorks"
import { NowPlayingBar } from "./components/NowPlayingBar"
import { SoundCloudPlayer } from "./components/SoundCloudPlayer"
import { archiveTracks } from "./data/archiveTracks"

export function App() {
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
      <main className="app-shell">
        <Hero />
        <div className="content-grid">
          <MainWorks />
          <SoundCloudPlayer initialTrack={initialSoundCloudTrack} />
        </div>
        <Archive />
        <footer className="site-footer">
          <div>
            <p>Contact</p>
            <a href="mailto:hello@minu.audio">hello@minu.audio</a>
          </div>
          <nav aria-label="Footer navigation">
            <a href="#main-works">Works</a>
            <a href="#archive">Archive</a>
          </nav>
          <strong>minu</strong>
        </footer>
      </main>
      <NowPlayingBar />
    </AudioManagerProvider>
  )
}
