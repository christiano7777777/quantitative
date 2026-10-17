// LQ-A: stars and bars, and expected waiting times for a first head, for HH and for HT with a biased coin.
// Lectures 1 (counting tricks), 2 (conditioning and recursion), 3 (coin problems).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tolInt } from '../../../shared/format'

export interface Params { n: number; k: number; p: number } // p in tenths

export function sample(rng: Rng): Params {
  return { n: rng.int(6, 12), k: rng.int(3, 5), p: rng.pick([3, 4, 5, 6, 7]) }
}

export const choose = (n: number, k: number) => { let r = 1n; for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i); return Number(r) }

export function build({ n, k, p }: Params): LQInstance {
  const P = p / 10, q = 1 - P
  const free = choose(n + k - 1, k - 1)
  const pos = choose(n - 1, k - 1)
  const first = 1 / P
  const hh = (1 + P) / (P * P)
  const ht = 1 / (P * q)

  return {
    intro: 'Give answers to 3 decimal places where they are not whole numbers.',
    parts: [
      {
        prompt: 'In how many ways can ' + tex(n) + ' identical sweets be given to ' + tex(k) + ' children (a child may get none)?',
        answer: free, tolerance: tolInt, lecture: 1,
        explanation: 'Stars and bars: ' + tex('\\binom{' + (n + k - 1) + '}{' + (k - 1) + '}') + ' = ' + free + '.',
      },
      {
        prompt: 'In how many ways if every child must get at least one sweet?',
        answer: pos, tolerance: tolInt, lecture: 1,
        explanation: 'Give one sweet to each child first, leaving ' + tex(n - k) + ' to distribute freely: ' + tex('\\binom{' + (n - 1) + '}{' + (k - 1) + '}') + ' = ' + pos + '.',
      },
      {
        prompt: 'A coin shows heads with probability ' + tex(dec(P)) + '. Find the expected number of tosses until the first head.',
        answer: first, tolerance: tol3, lecture: 2,
        explanation: tex('E=1+(1-p)E') + ' gives ' + tex('E=1/p=1/' + dec(P)) + ' = ' + dec(first) + '.',
      },
      {
        prompt: 'Find the expected number of tosses until two heads in a row (HH). (Conditioning on the first step with states "no progress" and "just threw a head" gives ' + tex('E=(1+p)/p^2') + '.)',
        answer: hh, tolerance: tol3, lecture: 2,
        explanation: tex('(1+' + dec(P) + ')/' + dec(P) + '^2') + ' = ' + dec(hh) + '.',
      },
      {
        prompt: 'Find the expected number of tosses until the pattern HT (a head followed by a tail) first appears, ' + tex('1/(pq)') + ' with ' + tex('q=1-p') + '. Compare with HH.',
        answer: ht, tolerance: tol3, lecture: 3,
        explanation: tex('1/(' + dec(P) + '\\cdot' + dec(q) + ')') + ' = ' + dec(ht) + (ht < hh ? ', shorter than HH (' + dec(hh) + '): after a miss HT keeps its progress and HH does not.' : '.'),
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'pz-lq-a-counting', generate: (rng) => build(sample(rng)) }
