// Small helpers shared by the SP long-question generators.

export const tex = (s: string | number) => '$' + s + '$'

/** KaTeX pmatrix from rows of already-formatted cells. */
export const pm = (rows: (string | number)[][]) =>
  String.raw`\begin{pmatrix}` + rows.map((r) => r.join(' & ')).join(String.raw` \\ `) + String.raw`\end{pmatrix}`

/** Answers asked to 3 d.p. are accepted within half a unit of the last place. */
export const tol3 = { abs: 0.0005 }
export const tol4 = { abs: 0.00005 }

/** Short decimal for display, e.g. 0.3, 1, 0.45 (no float noise). */
export const dec = (x: number) => String(Number(x.toFixed(6)))
