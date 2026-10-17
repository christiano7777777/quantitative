// LQ-E: a Polya urn (the fraction of red balls is a martingale) and a Lindeberg-style variance share.
// Lectures 10 (conditional probability and expectation), 11 (martingales), 9 (Lindeberg).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params {
  r: number // initial red balls
  b: number // initial blue balls
  c: number // balls of the drawn colour added after each draw
  n: number // number of summands in the variance-share part
}

export function sample(rng: Rng): Params {
  return { r: rng.pick([1, 2, 3]), b: rng.pick([1, 2, 3]), c: rng.pick([1, 2]), n: rng.pick([9, 19, 29, 49]) }
}

/** Probability of every red/blue sequence of the given length, with the final red/total counts. */
function sequences(r: number, b: number, c: number, len: number) {
  let states = [{ red: r, tot: r + b, p: 1, seq: '' }]
  for (let step = 0; step < len; step++) {
    const next: typeof states = []
    for (const s of states) {
      next.push({ red: s.red + c, tot: s.tot + c, p: s.p * (s.red / s.tot), seq: s.seq + 'R' })
      next.push({ red: s.red, tot: s.tot + c, p: s.p * ((s.tot - s.red) / s.tot), seq: s.seq + 'B' })
    }
    states = next
  }
  return states
}

export function build({ r, b, c, n }: Params): LQInstance {
  const m0 = r / (r + b)
  const two = sequences(r, b, c, 2)
  const pRR = two.find((s) => s.seq === 'RR')!.p
  const afterRed = sequences(r + c, b, c, 1) // second draw given the first was red
  const m2GivenRed = afterRed.reduce((s, x) => s + x.p * (x.red / x.tot), 0)
  const three = sequences(r, b, c, 3)
  const varM3 = three.reduce((s, x) => s + x.p * (x.red / x.tot) ** 2, 0) - m0 ** 2
  const pHalf = three.reduce((s, x) => s + (2 * x.red >= x.tot ? x.p : 0), 0)
  const share = 2 / (n + 1)
  const frac = (num: number, den: number) => '\\dfrac{' + num + '}{' + den + '}'

  return {
    intro:
      'An urn holds ' + tex(r) + ' red and ' + tex(b) + ' blue balls. At each step a ball is drawn at random, then returned together with ' + tex(c) + ' extra ball' + (c > 1 ? 's' : '') +
      ' of the same colour. Let ' + tex('M_n') + ' be the fraction of red balls after ' + tex('n') + ' draws (a martingale). Give decimal answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the probability that the first two draws are both red.',
        answer: pRR, tolerance: tol4, lecture: 10,
        explanation: tex('P(R_1)=' + frac(r, r + b)) + ' and given red first, the urn has ' + tex(r + c) + ' red of ' + tex(r + b + c) + ', so ' + tex('P(R_1R_2)=' + frac(r, r + b) + '\\cdot' + frac(r + c, r + b + c)) + ' = ' + dec(pRR) + '.',
      },
      {
        prompt: 'Given that the first draw is red, find ' + tex('E[M_2\\mid R_1]') + '.',
        answer: m2GivenRed, tolerance: tol4, lecture: 11,
        explanation: 'Given ' + tex('R_1') + ', the fraction is ' + tex('M_1=' + frac(r + c, r + b + c)) + ', and the martingale property ' + tex('E[M_2\\mid\\mathcal F_1]=M_1') + ' gives ' + dec(m2GivenRed) + '. Direct enumeration of the second draw agrees.',
      },
      {
        prompt: 'Find ' + tex('\\operatorname{Var}(M_3)') + '.',
        answer: varM3, tolerance: tol4, lecture: 11,
        explanation: tex('E[M_3]=M_0=' + dec(m0)) + ' (martingale), so ' + tex('\\operatorname{Var}(M_3)=E[M_3^2]-M_0^2') + '. Summing over the 8 colour sequences of three draws gives ' + dec(varM3) + '.',
      },
      {
        prompt: 'Find ' + tex('P(M_3\\ge\\tfrac12)') + ', the probability that red makes up at least half of the urn after three draws.',
        answer: pHalf, tolerance: tol4, lecture: 10,
        explanation: 'Add the probabilities of the colour sequences of three draws whose final red fraction is at least ' + tex('\\tfrac12') + ': ' + dec(pHalf) + '.',
      },
      {
        prompt: 'Independent summands ' + tex('Y_1,\\dots,Y_{' + n + '}') + ' have ' + tex('\\operatorname{Var}(Y_k)=k') + '. What fraction of the total variance ' + tex('s_n^2') + ' is carried by the largest-variance summand ' + tex('Y_{' + n + '}') + '? (Lindeberg-type conditions need such shares to vanish.) Give 3 decimal places.',
        answer: share, tolerance: tol3, lecture: 9,
        explanation: tex('s_n^2=\\sum_{k=1}^{n}k=\\dfrac{n(n+1)}{2}') + ', so the share is ' + tex('\\dfrac{n}{n(n+1)/2}=\\dfrac{2}{n+1}=\\dfrac{2}{' + (n + 1) + '}') + ' = ' + dec(share) + '.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'p3-lq-e-urn', generate: (rng) => build(sample(rng)) }
