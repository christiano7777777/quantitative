// Seeded RNG so a test attempt can be regenerated exactly from its seed.
// xmur3 turns a string seed into 32 bits; mulberry32 is the generator.

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}

export interface Rng {
  /** uniform in [0, 1) */
  next(): number
  /** integer in [lo, hi] inclusive */
  int(lo: number, hi: number): number
  /** one element, uniformly */
  pick<T>(xs: readonly T[]): T
  /** new array, Fisher-Yates shuffled */
  shuffle<T>(xs: readonly T[]): T[]
  /** k distinct elements */
  sample<T>(xs: readonly T[], k: number): T[]
  /** independent child stream, so adding draws in one place doesn't shift another */
  fork(label: string): Rng
}

export function makeRng(seed: string): Rng {
  let a = xmur3(seed)()
  const next = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const rng: Rng = {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (xs) => xs[Math.floor(next() * xs.length)],
    shuffle: (xs) => {
      const out = xs.slice()
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
    sample: (xs, k) => rng.shuffle(xs).slice(0, k),
    fork: (label) => makeRng(`${seed}/${label}`),
  }
  return rng
}
