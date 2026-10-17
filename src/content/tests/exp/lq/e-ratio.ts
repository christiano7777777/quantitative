// LQ-E: a ratio metric (clicks per page view) with users as the randomisation unit: delta-method standard error,
// the error of the naive page-view analysis, and the number of users needed.
// Lectures 8 (delta method for ratios), 6 (randomisation unit versus analysis unit) and 7 (sample size).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex } from '../../../shared/format'

export interface Params { x: number[]; v: number[]; delta: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const v = Array.from({ length: 6 }, () => rng.int(5, 25))
    const x = v.map((vi) => rng.int(0, Math.min(vi, 8)))
    const R = x.reduce((a, b) => a + b, 0) / v.reduce((a, b) => a + b, 0)
    if (R > 0.08 && R < 0.6) return { x, v, delta: rng.pick([0.01, 0.02, 0.03]) }
  }
}

export function build({ x, v, delta }: Params): LQInstance {
  const n = x.length
  const sx = x.reduce((a, b) => a + b, 0), sv = v.reduce((a, b) => a + b, 0)
  const R = sx / sv
  const d = x.map((xi, i) => xi - R * v[i])
  const sumD2 = d.reduce((a, b) => a + b * b, 0)
  const vbar = sv / n
  const varR = sumD2 / ((n - 1) * n * vbar * vbar)
  const se = Math.sqrt(varR)
  const naive = Math.sqrt((R * (1 - R)) / sv)
  const deff = varR / (naive * naive)
  const nUsers = Math.ceil((2 * (1.96 + 0.8416) ** 2 * (sumD2 / (n - 1))) / (vbar * vbar * delta * delta) - 1e-9)

  return {
    intro:
      'Users are randomised to variants, and the metric is click-through rate: total clicks divided by total page views in the arm. In one arm, six users had clicks ' + tex(x.join(',')) + ' on page views ' + tex(v.join(',')) + ' (same order). Do not round intermediate values; give answers to 3 significant figures (a 1% error is accepted).',
    parts: [
      {
        prompt: 'Find the click-through rate ' + tex('\\hat R=\\sum x_i/\\sum v_i') + ' (3 decimal places).',
        answer: R, tolerance: { abs: 0.0005 }, lecture: 8,
        explanation: tex('\\hat R=' + sx + '/' + sv + '=' + dec(R)) + '.',
      },
      {
        prompt: 'Using the delta method, the variance of ' + tex('\\hat R') + ' is ' + tex('\\dfrac{s_d^2}{n\\,\\bar v^2}') + ', where ' + tex('d_i=x_i-\\hat R v_i') + ', ' + tex('s_d^2=\\sum d_i^2/(n-1)') + ' (the ' + tex('d_i') + ' sum to zero) and ' + tex('\\bar v') + ' is the mean number of page views per user. Find the standard error of ' + tex('\\hat R') + ' (4 decimal places).',
        answer: se, tolerance: { rel: 0.01 }, lecture: 8,
        explanation: tex('\\sum d_i^2=' + dec(sumD2) + ',\\ s_d^2=' + dec(sumD2 / (n - 1)) + ',\\ \\bar v=' + dec(vbar) + ',\\ \\mathrm{SE}=' + dec(se)) + '.',
      },
      {
        prompt: 'A naive analyst treats every page view as an independent trial, so ' + tex('\\mathrm{SE}_{\\text{naive}}=\\sqrt{\\hat R(1-\\hat R)/\\sum v_i}') + '. Find it (4 decimal places).',
        answer: naive, tolerance: { rel: 0.01 }, lecture: 6,
        explanation: tex('\\sqrt{' + dec(R) + '\\times' + dec(1 - R) + '/' + sv + '}=' + dec(naive)) + '.',
      },
      {
        prompt: 'The design effect is the ratio of the correct variance to the naive variance, ' + tex('(\\mathrm{SE}/\\mathrm{SE}_{\\text{naive}})^2') + '. Find it (3 decimal places). A value above 1 means the naive test is too liberal.',
        answer: deff, tolerance: { rel: 0.02 }, lecture: 6,
        explanation: tex('(' + dec(se) + '/' + dec(naive) + ')^2=' + dec(deff)) + '. Page views of one user are correlated (and users differ in click propensity), so the user, not the page view, is the independent unit.',
      },
      {
        prompt: 'To detect a change of ' + tex(dec(delta)) + ' in the click-through rate between two arms with 80% power at two-sided 5% (' + tex('z_{0.975}=1.96,\\ z_{0.80}=0.8416') + '), the number of users per arm is ' + tex('n=2(z_{0.975}+z_{0.80})^2\\,\\dfrac{s_d^2/\\bar v^2}{\\delta^2}') + ', taking ' + tex('s_d^2/\\bar v^2') + ' from this sample as the per-user variance. Find it, rounded up.',
        answer: nUsers, tolerance: { rel: 0.02 }, lecture: 7,
        explanation: tex('s_d^2/\\bar v^2=' + dec(sumD2 / (n - 1) / (vbar * vbar)) + ',\\ n=2\\times' + dec((1.96 + 0.8416) ** 2) + '\\times' + dec(sumD2 / (n - 1) / (vbar * vbar)) + '/' + dec(delta * delta) + '\\to ' + nUsers) + ' users per arm.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'exp-lq-e-ratio', generate: (rng) => build(sample(rng)) }
