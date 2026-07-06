import { contactLinks, indexItems } from "../data/siteContent"

export function IndexContact() {
  return (
    <section className="index-section" id="index">
      <div className="index-section__heading">
        <h2>Selected work record</h2>
      </div>

      <ul className="index-table" aria-label="Selected work index">
        {indexItems.map((item) => (
          <li className="index-row" key={`${item.year}-${item.title}`}>
            <span>{item.year}</span>
            <strong>{item.title}</strong>
            <p>{item.role}</p>
          </li>
        ))}
      </ul>

      <div className="contact-strip">
        {contactLinks.map((link) => (
          <a href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </div>
    </section>
  )
}
