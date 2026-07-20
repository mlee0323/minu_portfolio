import { AudioWaveform } from "lucide-react"
import { navItems } from "../data/siteContent"

export function SiteNav() {
  const isArchiveDetail = window.location.pathname.startsWith("/archive/")
  const publicHref = (href: string) => (isArchiveDetail ? `/${href}` : href)

  return (
    <header className="site-nav">
      <a className="site-nav__brand" href={publicHref("#main-works")} aria-label="Go to works">
        <span className="site-nav__brand-mark" aria-hidden="true">
          <AudioWaveform size={15} />
        </span>
        <span>
          <strong>minu</strong>
          <small>spatial sound</small>
        </span>
      </a>
      <nav aria-label="Primary navigation">
        {navItems.map((item) => (
          <a href={publicHref(item.href)} key={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
