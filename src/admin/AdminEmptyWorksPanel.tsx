import { Plus } from "lucide-react"
import { AdminPanel } from "./AdminFields"

type AdminEmptyWorksPanelProps = {
  readonly onAddWork: () => void
}

export function AdminEmptyWorksPanel({ onAddWork }: AdminEmptyWorksPanelProps) {
  return (
    <AdminPanel title="Main Works" meta="0 works">
      <button className="pill-button pill-button--accent" type="button" onClick={onAddWork}>
        <Plus size={15} />
        Add work
      </button>
    </AdminPanel>
  )
}
