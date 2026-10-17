// LQ-B: Borel-Cantelli sums, an independent product, a Chebyshev sample size, and two characteristic functions.
// Lectures 5 (independence, Borel-Cantelli), 7 (weak law), 8 (characteristic functions).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4, tolInt } from '../../../shared/format'

export interface Params {
  c: number // P(A_n) = 1 / (c n^2)
  m: number // number of events in the product
  sig2: number // variance in the Chebyshev part
  e: number // epsilon = e / 2
  d: number // delta = d / 100
  nb: number // Binomial n
  pNum: number // Binomial p = pNum / 10
  lam: number // Poisson mean
}

export function sample(rng: Rng): Params {
  return {
    c: rng.pick([2, 3, 4, 5]),
    m: rng.pick([3, 4]),
    sig2: rng.pick([4, 9, 16, 25]),
    e: rng.pick([1, 2, 4]),
    d: rng.pick([1, 5, 10]),
    nb: rng.pick([3, 4, 5]),
    pNum: rng.pick([1, 2, 3, 7, 8]),
    lam: rng.pick([1, 2, 3]),
  }
}

export function build({ c, m, sig2, e, d, nb, pNum, lam }: Params): LQInstance {
  const sumP = Math.PI ** 2 / (6 * c)
  let none = 1
  for (let n = 1; n <= m; n++) none *= 1 - 1 / (c * n * n)
  const num = 400 * sig2, den = e * e * d
  const nCheb = Math.floor((num + den - 1) / den)
  const p = pNum / 10
  const reBin = (1 - 2 * p) ** nb
  const rePois = Math.exp(-lam) * Math.cos(lam)

  return {
    intro: 'Give decimal answers to 4 decimal places unless told otherwise. Angles are in radians.',
    parts: [
      {
        prompt: 'Events ' + tex('A_1,A_2,\\dots') + ' have ' + tex('P(A_n)=\\dfrac{1}{' + c + 'n^2}') + '. Find ' + tex('\\sum_{n=1}^{\\infty}P(A_n)') + ' (it is finite, so the first Borel-Cantelli lemma applies). Give 3 decimal places.',
        answer: sumP, tolerance: tol3, lecture: 5,
        explanation: tex('\\sum_{n\\ge1}n^{-2}=\\pi^2/6') + ', so the sum is ' + tex('\\pi^2/(6\\cdot' + c + ')') + ' = ' + dec(sumP) + ' (finite, so ' + tex('P(A_n\\text{ i.o.})=0') + ').',
      },
      {
        prompt: 'If ' + tex('A_1,A_2,\\dots') + ' are also independent, find the probability that none of ' + tex('A_1,\\dots,A_{' + m + '}') + ' occurs.',
        answer: none, tolerance: tol4, lecture: 5,
        explanation: 'By independence of the complements, ' + tex('P(\\text{none})=\\prod_{n=1}^{' + m + '}\\Big(1-\\dfrac{1}{' + c + 'n^2}\\Big)') + ' = ' + dec(none) + '.',
      },
      {
        prompt: 'Let ' + tex('X_1,X_2,\\dots') + ' be i.i.d. with variance ' + tex(sig2) + '. Chebyshev gives ' + tex('P(|\\bar X_n-\\mu|\\ge\\varepsilon)\\le\\sigma^2/(n\\varepsilon^2)') +
          '. With ' + tex('\\varepsilon=' + dec(e / 2)) + ' and target ' + tex('\\delta=' + dec(d / 100)) + ', what is the smallest integer ' + tex('n') + ' for which this bound is at most ' + tex('\\delta') + '?',
        answer: nCheb, tolerance: tolInt, lecture: 7,
        explanation: 'Need ' + tex('\\dfrac{' + sig2 + '}{n\\cdot' + dec((e / 2) ** 2) + '}\\le' + dec(d / 100)) + ', i.e. ' + tex('n\\ge\\dfrac{' + sig2 + '}{' + dec((e / 2) ** 2) + '\\cdot' + dec(d / 100) + '}=' + dec(sig2 / ((e / 2) ** 2 * (d / 100)))) + '. The smallest integer is ' + tex(nCheb) + '.',
      },
      {
        prompt: 'Let ' + tex('X\\sim\\mathrm{Bin}(' + nb + ',' + dec(p) + ')') + ' and ' + tex('\\varphi(t)=E[e^{itX}]') + '. Find ' + tex('\\operatorname{Re}\\varphi(\\pi)') + '.',
        answer: reBin, tolerance: tol4, lecture: 8,
        explanation: tex('\\varphi(\\pi)=E[(-1)^X]=(1-p+pe^{i\\pi})^{n}=(1-2p)^{n}=(' + dec(1 - 2 * p) + ')^{' + nb + '}') + ' = ' + dec(reBin) + ' (real).',
      },
      {
        prompt: 'Let ' + tex('X\\sim\\mathrm{Poisson}(' + lam + ')') + ', with ' + tex('\\varphi(t)=\\exp\\{\\lambda(e^{it}-1)\\}') + '. Find ' + tex('\\operatorname{Re}\\varphi(\\pi/2)') + '.',
        answer: rePois, tolerance: tol4, lecture: 8,
        explanation: tex('e^{i\\pi/2}=i') + ', so ' + tex('\\varphi(\\pi/2)=\\exp\\{\\lambda(i-1)\\}=e^{-\\lambda}(\\cos\\lambda+i\\sin\\lambda)') + ' and the real part is ' + tex('e^{-' + lam + '}\\cos' + lam) + ' = ' + dec(rePois) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'p3-lq-b-limits', generate: (rng) => build(sample(rng)) }
