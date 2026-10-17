// LQ-A: sample complexity for a finite class (realisable and agnostic), a Hoeffding bound, the generalisation gap, and the growth function of intervals.
// Lectures 1 (PAC learning), 2 (uniform convergence), 3 (VC dimension).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { k: number; eps: number; delta: number; m1: number; t: number; m2: number; pts: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const k = rng.int(10, 40)
    const eps = rng.pick([0.02, 0.05, 0.1, 0.2])
    const delta = rng.pick([0.01, 0.05, 0.1])
    const m1 = rng.pick([100, 150, 200, 250, 300, 400])
    const t = rng.pick([0.05, 0.08, 0.1, 0.12, 0.15])
    const m2 = rng.pick([2000, 3000, 5000, 8000, 10000, 20000])
    const pts = rng.int(5, 12)
    const lnH = k * Math.LN2
    const n1 = (lnH + Math.log(1 / delta)) / eps
    const n2 = (2 * Math.log(2 * 2 ** k / delta)) / (eps * eps)
    const x = 2 * m1 * t * t
    // keep ceilings away from integers and the Hoeffding bound informative
    if (Math.abs(n1 - Math.round(n1)) < 0.01 || Math.abs(n2 - Math.round(n2)) < 0.01) continue
    if (x < 0.8 || x > 4) continue
    return { k, eps, delta, m1, t, m2, pts }
  }
}

export function build({ k, eps, delta, m1, t, m2, pts }: Params): LQInstance {
  const lnH = k * Math.LN2
  const real = Math.ceil((lnH + Math.log(1 / delta)) / eps)
  const agn = Math.ceil((2 * Math.log(2 * 2 ** k / delta)) / (eps * eps))
  const hoef = 2 * Math.exp(-2 * m1 * t * t)
  const gap = Math.sqrt((Math.log(2 * 2 ** k / delta)) / (2 * m2))
  const labellings = 1 + (pts * (pts + 1)) / 2
  const H = tex('|\\mathcal H|=2^{' + k + '}')

  return {
    intro: 'A finite hypothesis class has ' + H + ' hypotheses, losses lie in ' + tex('[0,1]') + ', and the confidence is ' + tex('\\delta=' + dec(delta)) + '. Use natural logarithms. Round sample sizes up to the next integer; give the other answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Realisable case. Use ' + tex('m\\ge\\{\\ln|\\mathcal H|+\\ln(1/\\delta)\\}/\\varepsilon') + ' with ' + tex('\\varepsilon=' + dec(eps)) + '. What is the smallest sufficient sample size?',
        answer: real, tolerance: tolInt, lecture: 1,
        explanation: tex('\\ln|\\mathcal H|=' + k + '\\ln 2=' + dec(lnH)) + ' and ' + tex('\\ln(1/\\delta)=' + dec(Math.log(1 / delta))) + ', so ' + tex('m\\ge' + dec((lnH + Math.log(1 / delta)) / eps)) + ', rounded up to ' + tex(real) + '.',
      },
      {
        prompt: 'Agnostic case. ERM is within ' + tex('\\varepsilon=' + dec(eps)) + ' of the best hypothesis when ' + tex('m\\ge 2\\ln(2|\\mathcal H|/\\delta)/\\varepsilon^2') + '. What is the smallest sufficient sample size?',
        answer: agn, tolerance: tolInt, lecture: 1,
        explanation: tex('\\ln(2|\\mathcal H|/\\delta)=\\ln 2+' + k + '\\ln2+\\ln(1/\\delta)=' + dec(Math.log(2 * 2 ** k / delta))) + ', so ' + tex('m\\ge 2(' + dec(Math.log(2 * 2 ** k / delta)) + ')/' + dec(eps * eps) + '=' + dec((2 * Math.log(2 * 2 ** k / delta)) / (eps * eps))) + ', rounded up to ' + tex(agn) + '.',
      },
      {
        prompt: 'For one fixed hypothesis and ' + tex('m=' + m1) + ' examples, Hoeffding bounds ' + tex('P(|L_S(h)-L_D(h)|>t)') + ' by ' + tex('2e^{-2mt^2}') + '. Evaluate this bound for ' + tex('t=' + dec(t)) + '.',
        answer: hoef, tolerance: tol4, lecture: 2,
        explanation: tex('2mt^2=' + dec(2 * m1 * t * t)) + ', so the bound is ' + tex('2e^{-' + dec(2 * m1 * t * t) + '}=' + dec(hoef)) + '.',
      },
      {
        prompt: 'With ' + tex('m=' + m2) + ' examples, the union bound over the class gives, with probability at least ' + tex('1-\\delta') + ', a uniform gap ' + tex('\\sup_h|L_S(h)-L_D(h)|\\le\\sqrt{\\ln(2|\\mathcal H|/\\delta)/(2m)}') + '. Evaluate the right-hand side.',
        answer: gap, tolerance: tol4, lecture: 2,
        explanation: tex('\\ln(2|\\mathcal H|/\\delta)=' + dec(Math.log(2 * 2 ** k / delta))) + ', divided by ' + tex('2m=' + 2 * m2) + ' and square-rooted this is ' + tex(dec(gap)) + '.',
      },
      {
        prompt: 'The class of closed intervals ' + tex('[a,b]\\subset\\mathbb R') + ' labels a point ' + tex('+1') + ' if it lies inside and ' + tex('-1') + ' otherwise. On ' + tex(pts) + ' distinct points of the line, how many of the ' + tex('2^{' + pts + '}') + ' labellings can it realise?',
        answer: labellings, tolerance: tolInt, lecture: 3,
        explanation: 'The all-negative labelling plus one labelling for each block of consecutive points: ' + tex('1+' + pts + '(' + pts + '+1)/2=' + labellings) + '. This equals Sauer\'s bound ' + tex('\\binom{m}{0}+\\binom m1+\\binom m2') + ' because the VC dimension is 2.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'lt-lq-a-finite', generate: (rng) => build(sample(rng)) }
