import { AudioWaveform } from "lucide-react"
import { navItems } from "../data/siteContent"

export function SiteNav() {
  return (
    <header className="site-nav">
      <a className="site-nav__brand" href="#main-works" aria-label="Go to works">
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
          <a href={item.href} key={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
