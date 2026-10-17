// Small helpers shared by long-question generators of every topic (the SP topic keeps its own copy).

export const tex = (s: string | number) => '$' + s + '$'

/** KaTeX pmatrix from rows of already-formatted cells. */
export const pm = (rows: (string | number)[][]) =>
  String.raw`\begin{pmatrix}` + rows.map((r) => r.join(' & ')).join(String.raw` \\ `) + String.raw`\end{pmatrix}`

/** Tolerances: an answer asked to k decimal places is accepted within half a unit of the last place. */
export const tol2 = { abs: 0.005 }
export const tol3 = { abs: 0.0005 }
export const tol4 = { abs: 0.00005 }
/** Whole-number answers: a typed 12 passes, 12.4 does not. */
export const tolInt = { abs: 0.25 }

/** Short decimal for display, e.g. 0.3, 1, 0.45 (no float noise). */
export const dec = (x: number) => String(Number(x.toFixed(6)))

/** Standard normal cdf (Abramowitz-Stegun 7.1.26 for erf, absolute error below 2e-7). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2)
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const erf = 1 - poly * Math.exp(-(z * z) / 2)
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf)
}
