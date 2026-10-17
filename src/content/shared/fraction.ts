// Exact rational arithmetic (BigInt) for the independent checks in long-question tests.

const gcd = (a: bigint, b: bigint): bigint => {
  a = a < 0n ? -a : a
  b = b < 0n ? -b : b
  while (b) [a, b] = [b, a % b]
  return a
}

export class Fr {
  n: bigint
  d: bigint
  constructor(n: bigint, d: bigint = 1n) {
    if (d < 0n) { n = -n; d = -d }
    const g = gcd(n, d) || 1n
    this.n = n / g
    this.d = d / g
  }
  add(o: Fr) { return new Fr(this.n * o.d + o.n * this.d, this.d * o.d) }
  sub(o: Fr) { return new Fr(this.n * o.d - o.n * this.d, this.d * o.d) }
  mul(o: Fr) { return new Fr(this.n * o.n, this.d * o.d) }
  div(o: Fr) { return new Fr(this.n * o.d, this.d * o.n) }
  /** -1, 0 or 1 */
  cmp(o: Fr) { const l = this.n * o.d, r = o.n * this.d; return l < r ? -1 : l > r ? 1 : 0 }
  get num() { return Number(this.n) / Number(this.d) }
  get zero() { return this.n === 0n }
}

export const F = (n: number, d = 1) => new Fr(BigInt(n), BigInt(d))

export const fpow = (x: Fr, e: number) => {
  let r = F(1)
  for (let i = 0; i < e; i++) r = r.mul(x)
  return r
}

/** Gauss-Jordan solve of A x = b in exact arithmetic. */
export function solveFr(A0: Fr[][], b0: Fr[]): Fr[] {
  const n = b0.length
  const M = A0.map((row, i) => [...row, b0[i]])
  for (let c = 0; c < n; c++) {
    const p = M.findIndex((row, r) => r >= c && !row[c].zero)
    if (p < 0) throw new Error('singular')
    ;[M[c], M[p]] = [M[p], M[c]]
    const piv = M[c][c]
    M[c] = M[c].map((x) => x.div(piv))
    for (let r = 0; r < n; r++) {
      if (r === c || M[r][c].zero) continue
      const f = M[r][c]
      M[r] = M[r].map((x, k) => x.sub(f.mul(M[c][k])))
    }
  }
  return M.map((row) => row[n])
}
