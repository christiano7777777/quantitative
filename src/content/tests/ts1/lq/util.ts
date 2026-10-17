// Small text helpers for the Time Series I generators.
import { dec } from '../../../shared/format'

/** " + 0.4Z_{t-1}" or " - 0.3Z_{t-2}" (LaTeX, no dollar signs). */
export const term = (c: number, sym: string) => (c < 0 ? ' - ' : ' + ') + (Math.abs(c) === 1 ? '' : dec(Math.abs(c))) + sym
/** Signed number for display inside maths, e.g. -0.4 or 0.4. */
export const num = (c: number) => dec(c)
