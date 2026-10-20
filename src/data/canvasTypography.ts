import type { CSSProperties } from "react"
import type { AdminWorkTextElement } from "../admin/adminTypes"

export const workFontWeights = { light: 300, regular: 500, bold: 760, black: 900 } as const
export const canvasTextDefaults = {
  fontSize: 24,
  fontWeight: 500,
  lineHeight: 1.2,
  color: "#f5f5f5",
} as const

export function workTextStyle(
  text: AdminWorkTextElement,
  scale: number | "responsive" = 1,
): CSSProperties {
  return {
    color: text.color,
    fontSize:
      scale === "responsive" ? `calc(${text.fontSize} / 390 * 100cqw)` : text.fontSize * scale,
    fontWeight: workFontWeights[text.fontWeight],
    lineHeight: text.lineHeight,
    textAlign: text.textAlign,
  }
}
