export type BreathingDotOptions = {
  readonly color?: string
  readonly ringColor1?: string
  readonly ringColor2?: string
  readonly baseRadius?: number
  readonly peakRadius?: number
  readonly driftRangeX?: number
  readonly driftRangeY?: number
  readonly noiseAmp?: readonly [number, number, number]
  readonly lag?: number
  readonly stretchK?: number
  readonly stretchMaxSpeed?: number
  readonly viewBoxSize?: number
}

export function mountBreathingDot(
  container: HTMLElement,
  options?: BreathingDotOptions,
): { readonly destroy: () => void }
