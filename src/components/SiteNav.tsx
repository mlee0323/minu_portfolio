import { navItems } from "../data/siteContent"

export function SiteNav() {
  const isArchiveDetail = window.location.pathname.startsWith("/archive/")
  const publicHref = (href: string) => (isArchiveDetail ? `/${href}` : href)

  return (
    <header className="site-nav">
      <a className="site-nav__brand" href={publicHref("#main-works")} aria-label="Go to works">
        <img className="site-nav__logo" src="/images/branding/logo.png" alt="Minu" />
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
