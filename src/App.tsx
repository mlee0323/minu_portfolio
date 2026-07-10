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
import { useRuntimeSiteContent } from "./data/runtimeSiteContent"
import { getSoundCloudPlaybackUrl } from "./lib/soundcloud"

const AdminApp = lazy(async () => {
  const module = await import("./admin/AdminApp")
  return { default: module.AdminApp }
})

function PublicSite() {
  const [experienceStarted, setExperienceStarted] = useState(false)
  const siteContent = useRuntimeSiteContent()
  const initialSoundCloudTrack = siteContent.archiveTracks.find(
    (track) => getSoundCloudPlaybackUrl(track) !== null,
  )
  const introTrack = siteContent.mainWorks[0]?.track

  return (
    <AudioManagerProvider>
      <LocalAudioBridge />
      {!experienceStarted ? (
        <IntroOverlay introTrack={introTrack} onComplete={() => setExperienceStarted(true)} />
      ) : null}
      <a className="skip-link" href="#main-works">
        Skip to works
      </a>
      <SiteNav />
      <main className={experienceStarted ? "app-shell is-started" : "app-shell"}>
        <MainWorks works={siteContent.works} />
        <div className="archive-sound-grid">
          <Archive releases={siteContent.archiveReleases} />
          {initialSoundCloudTrack === undefined ? null : (
            <SoundCloudPlayer
              initialTrack={initialSoundCloudTrack}
              key={initialSoundCloudTrack.id}
            />
          )}
        </div>
        <IndexContact contactLinks={siteContent.contactLinks} indexItems={siteContent.indexItems} />
      </main>
      <NowPlayingBar />
    </AudioManagerProvider>
  )
}

export function App() {
  const isAdminRoute = window.location.pathname.startsWith("/admin")

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

  return <PublicSite />
}
