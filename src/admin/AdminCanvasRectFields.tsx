import { AdminTextField } from "./AdminFields"
import { updateCanvasLayout } from "./adminCanvas"
import type { AdminCanvasLayout, AdminCanvasRect, AdminCanvasViewport } from "./adminTypes"

type CanvasRectFieldsProps = {
  readonly dimensions: {
    readonly width: number
    readonly height: number
  }
  readonly rect: AdminCanvasRect
  readonly viewport: AdminCanvasViewport
  readonly onChange: (layout: AdminCanvasLayout) => void
}

function parseInteger(value: string, fallback: number, minimum: number): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback
}

function updateRect(rect: AdminCanvasRect, patch: Partial<AdminCanvasRect>): AdminCanvasRect {
  return {
    ...rect,
    ...patch,
  }
}

export function AdminCanvasRectFields({
  dimensions,
  onChange,
  rect,
  viewport,
}: CanvasRectFieldsProps) {
  return (
    <div className="admin-inspector-grid">
      <AdminTextField
        label="X"
        type="number"
        value={String(rect.x)}
        onChange={(x) =>
          onChange(
            updateCanvasLayout(
              viewport,
              updateRect(rect, { x: parseInteger(x, rect.x, 0) }),
              dimensions,
            ),
          )
        }
      />
      <AdminTextField
        label="Y"
        type="number"
        value={String(rect.y)}
        onChange={(y) =>
          onChange(
            updateCanvasLayout(
              viewport,
              updateRect(rect, { y: parseInteger(y, rect.y, 0) }),
              dimensions,
            ),
          )
        }
      />
      <AdminTextField
        label="Width"
        type="number"
        value={String(rect.width)}
        onChange={(width) =>
          onChange(
            updateCanvasLayout(
              viewport,
              updateRect(rect, { width: parseInteger(width, rect.width, 48) }),
              dimensions,
            ),
          )
        }
      />
      <AdminTextField
        label="Height"
        type="number"
        value={String(rect.height)}
        onChange={(height) =>
          onChange(
            updateCanvasLayout(
              viewport,
              updateRect(rect, { height: parseInteger(height, rect.height, 32) }),
              dimensions,
            ),
          )
        }
      />
    </div>
  )
}
