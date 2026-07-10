export type SelectedCanvasElement =
  | {
      readonly kind: "image"
      readonly id: string
    }
  | {
      readonly kind: "text"
      readonly id: string
    }
