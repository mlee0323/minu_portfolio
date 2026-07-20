import { lazy, Suspense, useEffect, useState } from "react"
import { AudioManagerProvider } from "./audio/AudioManagerProvider"
import { Archive } from "./components/Archive"
import { ArchiveDetail } from "./components/ArchiveDetail"
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
  const siteContent = useRuntimeSiteContent()
  const [pathname, setPathname] = useState(window.location.pathname)
  const archiveReleaseId = pathname.match(/^\/archive\/([^/]+)\/?$/)?.[1]
  const archiveRelease = siteContent.archiveReleases.find(
    (release) => release.id === archiveReleaseId,
  )
  const isArchiveDetail = archiveRelease !== undefined
  const [experienceStarted, setExperienceStarted] = useState(isArchiveDetail)
  const initialSoundCloudTrack = siteContent.archiveTracks.find(
    (track) => getSoundCloudPlaybackUrl(track) !== null,
  )
  const introTrack = siteContent.mainWorks[0]?.track

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  useEffect(() => {
    setExperienceStarted(isArchiveDetail)
  }, [isArchiveDetail])

  return (
    <AudioManagerProvider>
      <LocalAudioBridge />
      {!experienceStarted ? (
        <IntroOverlay introTrack={introTrack} onComplete={() => setExperienceStarted(true)} />
      ) : null}
      <a className="skip-link" href={isArchiveDetail ? "#archive-detail" : "#main-works"}>
        {isArchiveDetail ? "Skip to album detail" : "Skip to works"}
      </a>
      <SiteNav />
      <main className={experienceStarted ? "app-shell is-started" : "app-shell"}>
        {isArchiveDetail ? (
          <div className="archive-sound-grid">
            <ArchiveDetail release={archiveRelease} />
            {initialSoundCloudTrack === undefined ? null : (
              <SoundCloudPlayer
                initialTrack={initialSoundCloudTrack}
                key={initialSoundCloudTrack.id}
              />
            )}
          </div>
        ) : (
          <>
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
          </>
        )}
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
