import { lazy, Suspense, useState } from "react"
import { AudioManagerProvider } from "./audio/AudioManagerProvider"
import { Archive } from "./components/Archive"
import { IndexContact } from "./components/IndexContact"
import { IntroOverlay } from "./components/IntroOverlay"
import { LocalAudioBridge } from "./components/LocalAudioBridge"
import { MainWorks } from "./components/MainWorks"
import { NowPlayingBar } from "./components/NowPlayingBar"
import { SiteNav } from "./components/SiteNav"
import { SoundCloudPlayer } from "./components/SoundCloudPlayer"
import { archiveTracks } from "./data/publishedSiteContent"

const AdminApp = lazy(async () => {
  const module = await import("./admin/AdminApp")
  return { default: module.AdminApp }
})

export function App() {
  const isAdminRoute = window.location.pathname.startsWith("/admin")
  const [experienceStarted, setExperienceStarted] = useState(false)
  const initialSoundCloudTrack = archiveTracks[0]

  if (isAdminRoute) {
    return (
      <Suspense
        fallback={
          <main className="admin-shell">
            <p className="admin-status">Loading admin...</p>
          </main>
        }
      >
        <AdminApp />
      </Suspense>
    )
  }

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

  const completeIntro = () => {
    setExperienceStarted(true)
  }

  return (
    <AudioManagerProvider>
      <LocalAudioBridge />
      {!experienceStarted ? <IntroOverlay onComplete={completeIntro} /> : null}
      <a className="skip-link" href="#main-works">
        Skip to works
      </a>
      <SiteNav />
      <main className={experienceStarted ? "app-shell is-started" : "app-shell"}>
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
