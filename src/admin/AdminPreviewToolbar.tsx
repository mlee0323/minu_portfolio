import { Monitor, Smartphone } from "lucide-react"
import type { AdminCanvasViewport } from "./adminTypes"
import { adminCanvasViewportOptions } from "./adminTypes"

type AdminPreviewToolbarProps = {
  readonly notice: string
  readonly viewport: AdminCanvasViewport
  readonly onViewportChange: (viewport: AdminCanvasViewport) => void
}

export function AdminPreviewToolbar({
  notice,
  onViewportChange,
  viewport,
}: AdminPreviewToolbarProps) {
  return (
    <div className="admin-preview-toolbar">
      <p>{notice}</p>
      <fieldset className="segmented-control">
        <legend className="admin-sr-only">Preview viewport</legend>
        {adminCanvasViewportOptions.map((option) => (
          <button
            className={viewport === option ? "is-active" : ""}
            key={option}
            type="button"
            onClick={() => onViewportChange(option)}
          >
            {option === "mobile" ? <Smartphone size={15} /> : <Monitor size={15} />}
            {option === "mobile" ? "Mobile" : "Web"}
          </button>
        ))}
      </fieldset>
    </div>
  )
}
