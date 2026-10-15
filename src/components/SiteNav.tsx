import { navItems } from "../data/siteContent"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export function SiteNav() {
  const isArchiveDetail = window.location.pathname.startsWith("/archive/")
  const publicHref = (href: string) => (isArchiveDetail ? `/${href}` : href)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className={isMenuOpen ? "site-nav is-menu-open" : "site-nav"}>
      <a className="site-nav__brand" href={publicHref("#main-works")} aria-label="Go to works">
        <img className="site-nav__logo" src="/images/branding/logo.png" alt="Minu" />
      </a>
      <button
        className="site-nav__menu-toggle"
        type="button"
        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav aria-label="Primary navigation">
        {navItems.map((item) => (
          <a href={publicHref(item.href)} key={item.href} onClick={() => setIsMenuOpen(false)}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
