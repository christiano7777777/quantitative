// LQ-D: weak typicality and type classes of a Bernoulli source.
// Lectures 5 (AEP, typical set size) and 6 (counting sequences of a given type).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol3, tol4, tolInt } from '../../../shared/format'

export interface Params { p: number; n: number; k: number }

export function sample(rng: Rng): Params {
  const n = rng.pick([8, 10, 12])
  const p = rng.pick([0.1, 0.2, 0.25, 0.3, 0.4])
  const k = rng.int(1, Math.min(n - 1, Math.ceil(n * 0.6)))
  return { p, n, k }
}

const lg = Math.log2
const binom = (n: number, k: number) => {
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return Math.round(r)
}

export function build({ p, n, k }: Params): LQInstance {
  const q = 1 - p
  const H = -p * lg(p) - q * lg(q)
  const size = 2 ** (n * H)
  const per = -(k * lg(p) + (n - k) * lg(q)) / n
  const eps = Math.abs(per - H)
  const cnt = binom(n, k)
  const prob = cnt * p ** k * q ** (n - k)
  return {
    intro: 'A source emits i.i.d. bits with ' + tex('P(1)=' + dec(p)) + '. Consider blocks of length ' + tex('n=' + n) + ' and a block ' + tex('x^n') + ' containing exactly ' + tex('k=' + k) + ' ones. Use logarithms to base 2. Unless stated otherwise give answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Find the entropy ' + tex('H') + ' of one bit, in bits.',
        answer: H, tolerance: tol3, lecture: 5,
        explanation: tex('H=-' + dec(p) + '\\log_2' + dec(p) + '-' + dec(q) + '\\log_2' + dec(q) + '=' + dec(H)) + '.',
      },
      {
        prompt: 'The typical set has about ' + tex('2^{nH}') + ' sequences, so about ' + tex('nH') + ' bits index it. Compute ' + tex('nH') + ' to 2 decimal places (do not round ' + tex('H') + ' before multiplying by ' + tex('n') + ').',
        answer: n * H, tolerance: tol2, lecture: 5,
        explanation: tex('nH=' + n + '\\times' + dec(H) + '=' + dec(n * H)) + ', so the typical set has about ' + tex('2^{' + dec(n * H) + '}=' + dec(size)) + ' sequences out of ' + tex(String(2 ** n)) + '.',
      },
      {
        prompt: 'Find ' + tex('\\left|-\\tfrac1n\\log_2 P(x^n)-H\\right|') + ' for the block ' + tex('x^n') + ', that is, the smallest ' + tex('\\varepsilon') + ' for which it is weakly ' + tex('\\varepsilon') + '-typical.',
        answer: eps, tolerance: tol3, lecture: 5,
        explanation: tex('-\\frac1n\\log_2P(x^n)=-\\frac{' + k + '}{' + n + '}\\log_2' + dec(p) + '-\\frac{' + (n - k) + '}{' + n + '}\\log_2' + dec(q) + '=' + dec(per)) + ', so the distance to ' + tex('H=' + dec(H)) + ' is ' + tex(dec(eps)) + '.',
      },
      {
        prompt: 'How many blocks of length ' + tex('n') + ' contain exactly ' + tex('k') + ' ones (the size of the type class)?',
        answer: cnt, tolerance: tolInt, lecture: 6,
        explanation: tex('\\binom{' + n + '}{' + k + '}=' + cnt) + '.',
      },
      {
        prompt: 'Find the probability that a block contains exactly ' + tex('k') + ' ones.',
        answer: prob, tolerance: tol4, lecture: 6,
        explanation: tex('\\binom{' + n + '}{' + k + '}' + dec(p) + '^{' + k + '}' + dec(q) + '^{' + (n - k) + '}=' + cnt + '\\times' + dec(p ** k * q ** (n - k)) + '=' + dec(prob)) + '.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'it-lq-d-typical', generate: (rng) => build(sample(rng)) }
