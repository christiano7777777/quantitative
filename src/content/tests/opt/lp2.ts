// Tiny helpers for two-variable linear programs, shared by the generators in lq/ (floating point).
// A constraint is a.x <= r; the region always also has x >= 0, y >= 0.

export interface Con { a: [number, number]; r: number }
export type Pt = [number, number]

const EPS = 1e-9

/** Feasible corner points of {cons, x >= 0, y >= 0}, found by intersecting every pair of boundary lines. */
export function lpVertices(cons: Con[]): Pt[] {
  const lines: Con[] = [...cons, { a: [-1, 0], r: 0 }, { a: [0, -1], r: 0 }]
  const out: Pt[] = []
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const [a1, b1] = lines[i].a, [a2, b2] = lines[j].a
      const det = a1 * b2 - a2 * b1
      if (Math.abs(det) < EPS) continue
      const x = (lines[i].r * b2 - lines[j].r * b1) / det
      const y = (a1 * lines[j].r - a2 * lines[i].r) / det
      if (lines.every((l) => l.a[0] * x + l.a[1] * y <= l.r + 1e-7) && !out.some((p) => Math.hypot(p[0] - x, p[1] - y) < 1e-7)) out.push([x, y])
    }
  }
  return out
}

/** Number of boundary lines (constraints and the two axes) that pass through a point. */
export function tightCount(cons: Con[], p: Pt): number {
  const lines: Con[] = [...cons, { a: [-1, 0], r: 0 }, { a: [0, -1], r: 0 }]
  return lines.filter((l) => Math.abs(l.a[0] * p[0] + l.a[1] * p[1] - l.r) < 1e-7).length
}

/** Maximise c.x over the region (bounded regions only); returns the best vertex and the value. */
export function lpMax(c: Pt, cons: Con[]): { value: number; point: Pt } {
  let best: { value: number; point: Pt } | null = null
  for (const p of lpVertices(cons)) {
    const v = c[0] * p[0] + c[1] * p[1]
    if (!best || v > best.value) best = { value: v, point: p }
  }
  if (!best) throw new Error('empty region')
  return best
}

/** x = A^{-1} b for a 2x2 system. */
export function solve2(a: [[number, number], [number, number]], b: Pt): Pt {
  const det = a[0][0] * a[1][1] - a[0][1] * a[1][0]
  return [(b[0] * a[1][1] - a[0][1] * b[1]) / det, (a[0][0] * b[1] - a[1][0] * b[0]) / det]
}

/** Fractional part t - floor(t) of the rational num/den computed exactly in integers. */
export function fracRat(num: number, den: number): number {
  if (den < 0) { num = -num; den = -den }
  return (((num % den) + den) % den) / den
}
