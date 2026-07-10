import { Plus, Trash2 } from "lucide-react"
import { AdminPanel, AdminSelectField, AdminTextField } from "./AdminFields"
import { createBlankContactLink, createBlankIndexItem } from "./adminFactories"
import type { AdminContactLink, AdminContent, AdminIndexItem } from "./adminTypes"
import { adminStatusOptions } from "./adminTypes"

type IndexPanelProps = {
  readonly content: AdminContent
  readonly onChange: (content: AdminContent) => void
}

function renumberIndexItems(items: readonly AdminIndexItem[]): readonly AdminIndexItem[] {
  return items.map((item, sortOrder) => ({ ...item, sortOrder }))
}

function renumberContactLinks(links: readonly AdminContactLink[]): readonly AdminContactLink[] {
  return links.map((link, sortOrder) => ({ ...link, sortOrder }))
}

export function AdminIndexPanel({ content, onChange }: IndexPanelProps) {
  const updateIndexItem = (itemId: string, patch: Partial<AdminIndexItem>) => {
    onChange({
      ...content,
      indexItems: content.indexItems.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    })
  }
  const updateContactLink = (linkId: string, patch: Partial<AdminContactLink>) => {
    onChange({
      ...content,
      contactLinks: content.contactLinks.map((link) =>
        link.id === linkId ? { ...link, ...patch } : link,
      ),
    })
  }

  return (
    <AdminPanel title="Index & Contact" meta="text records">
      <div className="admin-subpanel admin-subpanel--wide">
        <div className="admin-subpanel__head">
          <h3>Selected work record</h3>
          <button
            className="pill-button"
            type="button"
            onClick={() =>
              onChange({
                ...content,
                indexItems: [
                  ...content.indexItems,
                  createBlankIndexItem(content.indexItems.length),
                ],
              })
            }
          >
            <Plus size={15} />
            Add record
          </button>
        </div>
        {content.indexItems.map((item) => (
          <div className="admin-index-row" key={item.id}>
            <AdminTextField
              label="Year"
              value={item.year}
              onChange={(year) => updateIndexItem(item.id, { year })}
            />
            <AdminTextField
              label="Title"
              value={item.title}
              onChange={(title) => updateIndexItem(item.id, { title })}
            />
            <AdminTextField
              label="Role"
              value={item.role}
              onChange={(role) => updateIndexItem(item.id, { role })}
            />
            <AdminSelectField
              label="Status"
              value={item.status}
              options={adminStatusOptions}
              onChange={(status) => updateIndexItem(item.id, { status })}
            />
            <button
              className="icon-button"
              type="button"
              aria-label={`Remove ${item.title}`}
              onClick={() =>
                onChange({
                  ...content,
                  indexItems: renumberIndexItems(
                    content.indexItems.filter((record) => record.id !== item.id),
                  ),
                })
              }
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="admin-subpanel admin-subpanel--wide">
        <div className="admin-subpanel__head">
          <h3>Contact links</h3>
          <button
            className="pill-button"
            type="button"
            onClick={() =>
              onChange({
                ...content,
                contactLinks: [
                  ...content.contactLinks,
                  createBlankContactLink(content.contactLinks.length),
                ],
              })
            }
          >
            <Plus size={15} />
            Add link
          </button>
        </div>
        {content.contactLinks.map((link) => (
          <div className="admin-contact-row" key={link.id}>
            <AdminTextField
              label="Label"
              value={link.label}
              onChange={(label) => updateContactLink(link.id, { label })}
            />
            <AdminTextField
              label="URL"
              value={link.href}
              onChange={(href) => updateContactLink(link.id, { href })}
            />
            <button
              className="icon-button"
              type="button"
              aria-label={`Remove ${link.label}`}
              onClick={() =>
                onChange({
                  ...content,
                  contactLinks: renumberContactLinks(
                    content.contactLinks.filter((item) => item.id !== link.id),
                  ),
                })
              }
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </AdminPanel>
  )
}
