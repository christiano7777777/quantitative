// LQ-B: realisable PAC failure probability, accuracy from a sample, uniform-convergence sample size, ERM excess risk, and the growth function of halfplanes.
// Lectures 1 (PAC learning), 2 (uniform convergence), 3 (VC dimension).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { N: number; epsPct: number; m1: number; m2: number; delta: number; t: number; m3: number; pts: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const N = rng.pick([100, 500, 1000, 5000, 10000, 100000])
    const epsPct = rng.pick([2, 5, 10, 20]) // epsilon in percent, so (1 - eps)^m is an exact rational in the test
    const eps = epsPct / 100
    const delta = rng.pick([0.01, 0.05, 0.1])
    const t = rng.pick([0.02, 0.05, 0.08, 0.1])
    const m3 = rng.pick([1000, 2000, 5000, 10000])
    const pts = rng.int(4, 9)
    // m1 so that the failure probability N(1-eps)^m1 lies in (0.002, 0.4)
    const target = rng.pick([0.01, 0.03, 0.1, 0.25])
    const m1 = Math.ceil(Math.log(N / target) / -Math.log(1 - eps))
    const m2 = rng.pick([200, 400, 500, 800, 1000, 2000])
    const need = Math.log((2 * N) / delta) / (2 * t * t)
    if (Math.abs(need - Math.round(need)) < 0.01) continue
    const fail = N * (1 - eps) ** m1
    if (fail < 0.002 || fail > 0.4) continue
    return { N, epsPct, m1, m2, delta, t, m3, pts }
  }
}

export function build({ N, epsPct, m1, m2, delta, t, m3, pts }: Params): LQInstance {
  const eps = epsPct / 100
  const fail = N * (1 - eps) ** m1
  const epsAcc = (Math.log(N) + Math.log(1 / delta)) / m2
  const need = Math.ceil(Math.log((2 * N) / delta) / (2 * t * t))
  const excess = 2 * Math.sqrt(Math.log((2 * N) / delta) / (2 * m3))
  const labellings = pts * pts - pts + 2

  return {
    intro: 'A finite class has ' + tex('|\\mathcal H|=' + N) + ' hypotheses and losses lie in ' + tex('[0,1]') + '. Use natural logarithms. Give sample sizes as integers (rounded up) and the other answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Realisable case with ' + tex('m=' + m1) + ' examples. The probability that some hypothesis with true error above ' + tex('\\varepsilon=' + dec(eps)) + ' is consistent with the sample is at most ' + tex('|\\mathcal H|(1-\\varepsilon)^m') + '. Evaluate it.',
        answer: fail, tolerance: tol4, lecture: 1,
        explanation: tex(dec(1 - eps) + '^{' + m1 + '}=' + ((1 - eps) ** m1).toPrecision(4)) + ', times ' + tex(N) + ' gives ' + tex(dec(fail)) + '.',
      },
      {
        prompt: 'Realisable case with ' + tex('m=' + m2) + ' examples and confidence ' + tex('\\delta=' + dec(delta)) + '. The guarantee ' + tex('m\\ge\\{\\ln|\\mathcal H|+\\ln(1/\\delta)\\}/\\varepsilon') + ' can be solved for the accuracy. What accuracy ' + tex('\\varepsilon') + ' does it promise?',
        answer: epsAcc, tolerance: tol4, lecture: 1,
        explanation: tex('\\varepsilon=(\\ln' + N + '+\\ln' + dec(1 / delta) + ')/' + m2 + '=(' + dec(Math.log(N)) + '+' + dec(Math.log(1 / delta)) + ')/' + m2 + '=' + dec(epsAcc)) + '.',
      },
      {
        prompt: 'Hoeffding with the union bound gives ' + tex('\\sup_h|L_S(h)-L_D(h)|\\le t') + ' with probability at least ' + tex('1-\\delta') + ' when ' + tex('m\\ge\\ln(2|\\mathcal H|/\\delta)/(2t^2)') + '. For ' + tex('\\delta=' + dec(delta)) + ' and ' + tex('t=' + dec(t)) + ', what is the smallest sufficient ' + tex('m') + '?',
        answer: need, tolerance: tolInt, lecture: 2,
        explanation: tex('\\ln(2|\\mathcal H|/\\delta)=\\ln(' + dec(2 * N / delta) + ')=' + dec(Math.log((2 * N) / delta))) + ', divided by ' + tex('2t^2=' + dec(2 * t * t)) + ' gives ' + tex(dec(Math.log((2 * N) / delta) / (2 * t * t))) + ', rounded up to ' + tex(need) + '.',
      },
      {
        prompt: 'With ' + tex('m=' + m3) + ' examples, uniform convergence ensures that ERM has true risk at most ' + tex('2\\sqrt{\\ln(2|\\mathcal H|/\\delta)/(2m)}') + ' above the best hypothesis in the class (same ' + tex('\\delta=' + dec(delta)) + '). Evaluate this excess-risk bound.',
        answer: excess, tolerance: tol4, lecture: 2,
        explanation: 'The uniform gap is ' + tex('\\sqrt{' + dec(Math.log((2 * N) / delta)) + '/' + 2 * m3 + '}=' + dec(excess / 2)) + '; ERM loses at most twice the gap: ' + tex(dec(excess)) + '.',
      },
      {
        prompt: 'The class of affine halfplanes in ' + tex('\\mathbb R^2') + ' (labelling one side ' + tex('+1') + ') is applied to ' + tex(pts) + ' points in general position (no three collinear). By Cover\'s counting formula ' + tex('2\\sum_{i=0}^{2}\\binom{m-1}{i}') + ', how many of the ' + tex('2^{' + pts + '}') + ' labellings are realised?',
        answer: labellings, tolerance: tolInt, lecture: 3,
        explanation: tex('2\\{1+(m-1)+\\binom{m-1}2\\}=m^2-m+2=' + labellings) + ' for ' + tex('m=' + pts) + '. For ' + tex('m=3') + ' all 8 labellings occur and for ' + tex('m=4') + ' only 14 of 16, which is why the VC dimension is 3.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'lt-lq-b-pac', generate: (rng) => build(sample(rng)) }
