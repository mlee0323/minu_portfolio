import { Archive, Database, Image, ListMusic } from "lucide-react"
import type { AdminContent } from "./adminTypes"

function countWorkImages(content: AdminContent): number {
  return content.works.reduce((total, work) => total + work.images.length, 0)
}

function countArchiveTracks(content: AdminContent): number {
  return content.archiveReleases.reduce((total, release) => total + release.tracks.length, 0)
}

export function AdminDashboard({ content }: { readonly content: AdminContent }) {
  const publishedWorks = content.works.filter((work) => work.status === "published").length
  const draftWorks = content.works.length - publishedWorks
  const publishedReleases = content.archiveReleases.filter(
    (release) => release.status === "published",
  ).length

  return (
    <div className="admin-dashboard">
      <article>
        <Database size={18} />
        <span>Content source</span>
        <strong>Local draft</strong>
        <p>Supabase 연결 전까지 브라우저 localStorage에만 저장됩니다.</p>
      </article>
      <article>
        <Image size={18} />
        <span>Main Works</span>
        <strong>{content.works.length}</strong>
        <p>{`${publishedWorks} published / ${draftWorks} draft / ${countWorkImages(
          content,
        )} images`}</p>
      </article>
      <article>
        <Archive size={18} />
        <span>Archive releases</span>
        <strong>{content.archiveReleases.length}</strong>
        <p>{`${publishedReleases} published / ${countArchiveTracks(content)} tracks`}</p>
      </article>
      <article>
        <ListMusic size={18} />
        <span>Index & Contact</span>
        <strong>{content.indexItems.length + content.contactLinks.length}</strong>
        <p>텍스트 기록과 연락처 링크를 같은 초안에 보관합니다.</p>
      </article>
    </div>
  )
}
