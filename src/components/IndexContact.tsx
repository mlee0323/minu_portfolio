import { Mail, Send, X } from "lucide-react"
import type { FormEvent } from "react"
import { useEffect, useRef, useState } from "react"
import type { ContactLink, IndexItem } from "../data/siteContent"

type IndexContactProps = {
  readonly contactLinks: readonly ContactLink[]
  readonly indexItems: readonly IndexItem[]
}

const fallbackEmailAddress = "llsyawla@gmail.com"

function InstagramMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.5" cy="6.6" r="1" className="contact-social-mark__dot" />
    </svg>
  )
}

function SoundCloudMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3.5 17.5v-3.4M6.1 17.5v-5.8M8.7 17.5v-7.2M11.3 17.5V9" />
      <path d="M11.8 17.5h5.1a3.6 3.6 0 0 0 .4-7.2 5.7 5.7 0 0 0-10.1 1.2" />
    </svg>
  )
}

function socialIconFor(label: string) {
  switch (label.toLowerCase()) {
    case "instagram":
      return <InstagramMark />
    case "soundcloud":
      return <SoundCloudMark />
    default:
      return null
  }
}

function emailAddressFromLink(link: ContactLink | undefined): string {
  const candidate = link?.href.replace(/^mailto:/i, "").trim()
  return candidate?.includes("@") === true ? candidate : fallbackEmailAddress
}

function buildMailtoUrl(emailAddress: string, subject: string, message: string): string {
  const params = new URLSearchParams()
  const trimmedSubject = subject.trim()
  const trimmedMessage = message.trim()

  if (trimmedSubject !== "") {
    params.set("subject", trimmedSubject)
  }

  if (trimmedMessage !== "") {
    params.set("body", trimmedMessage)
  }

  const query = params.toString()
  return `mailto:${emailAddress}${query === "" ? "" : `?${query}`}`
}

export function IndexContact({ contactLinks, indexItems }: IndexContactProps) {
  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const dialogRef = useRef<HTMLDialogElement>(null)
  const emailAddress = emailAddressFromLink(
    contactLinks.find((link) => link.label.toLowerCase() === "email"),
  )
  const socialLinks = contactLinks.filter((link) => link.label.toLowerCase() !== "email")

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog === null) {
      return
    }

    if (isEmailOpen) {
      if (dialog.open) {
        return
      }

      if (typeof dialog.showModal === "function") {
        dialog.showModal()
      } else {
        dialog.setAttribute("open", "")
      }
      return
    }

    if (dialog.open && typeof dialog.close === "function") {
      dialog.close()
    }
  }, [isEmailOpen])

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    window.open(buildMailtoUrl(emailAddress, subject, message), "_blank", "noopener,noreferrer")
    setIsEmailOpen(false)
  }

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
        <button
          className="contact-email"
          type="button"
          aria-label={`Email ${emailAddress}`}
          onClick={() => setIsEmailOpen(true)}
        >
          <Mail aria-hidden="true" size={17} strokeWidth={1.8} />
          <span>{emailAddress}</span>
        </button>

        <div className="contact-social-links">
          {socialLinks.map((link) => {
            const icon = socialIconFor(link.label)

            if (icon === null) {
              return null
            }

            const label = link.label === "Soundcloud" ? "SoundCloud" : link.label

            return (
              <a
                className="contact-social-link"
                href={link.href}
                key={link.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Open ${label} in a new window`}
                title={label}
              >
                {icon}
              </a>
            )
          })}
        </div>
      </div>

      <dialog
        className="email-dialog"
        ref={dialogRef}
        aria-labelledby="email-dialog-title"
        onCancel={() => setIsEmailOpen(false)}
        onClose={() => setIsEmailOpen(false)}
      >
        <div className="email-dialog__surface">
          <div className="email-dialog__header">
            <div>
              <p className="email-dialog__eyebrow">Contact</p>
              <h3 id="email-dialog-title">Send an email</h3>
            </div>
            <button
              className="email-dialog__close"
              type="button"
              aria-label="Close email composer"
              onClick={() => setIsEmailOpen(false)}
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          <p className="email-dialog__recipient">
            To <strong>{emailAddress}</strong>
          </p>

          <form className="email-dialog__form" onSubmit={handleSubmit}>
            <label htmlFor="email-subject">Subject</label>
            <input
              id="email-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Project or collaboration"
            />

            <label htmlFor="email-message">Message</label>
            <textarea
              id="email-message"
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write your message"
            />

            <button className="email-dialog__submit" type="submit">
              <Send aria-hidden="true" size={16} />
              Open email client
            </button>
          </form>
        </div>
      </dialog>

      <footer className="index-footer">
        <span>Minu spatial sound</span>
        <span>Portfolio / selected records</span>
      </footer>
    </section>
  )
}
