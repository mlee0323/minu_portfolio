import { AudioWaveform } from "lucide-react"
import { navItems } from "../data/siteContent"

export function SiteNav() {
  return (
    <header className="site-nav">
      <a className="site-nav__brand" href="#hero" aria-label="Go to hero">
        <AudioWaveform size={16} />
        minu
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
