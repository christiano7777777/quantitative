// LQ-D: sizing a conversion A/B test, its power at a smaller sample, then the analysis of the result.
// Lectures 7 (sample size, power), 8 (z test, confidence interval) and 6 (hypotheses, p-value).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, normalCdf, tex, tol2 } from '../../../shared/format'

export const Z_ALPHA = 1.96
export const Z_POWER = 0.8416

/** p0, delta, p1 in hundredths; nSmall = users per arm that can actually be afforded; m = users per arm in the finished test */
export interface Params { p0: number; delta: number; nSmall: number; m: number; xc: number; xt: number }

const nRequired = (p0: number, p1: number) => Math.ceil(((Z_ALPHA + Z_POWER) ** 2 * (p0 * (1 - p0) + p1 * (1 - p1))) / (p1 - p0) ** 2 - 1e-9)

export function sample(rng: Rng): Params {
  const p0 = rng.int(5, 20)
  const delta = rng.int(1, 3)
  const n = nRequired(p0 / 100, (p0 + delta) / 100)
  const nSmall = Math.round((n * rng.pick([0.4, 0.5, 0.6, 0.7])) / 100) * 100
  const m = rng.int(4, 16) * 500
  const xc = Math.round((m * p0) / 100)
  const z0 = rng.int(10, 32) / 10 // aim for a moderate z statistic so the p-value is a readable number
  const xt = xc + Math.round(z0 * Math.sqrt(2 * (p0 / 100) * (1 - p0 / 100) * m))
  return { p0, delta, nSmall, m, xc, xt }
}

export function build({ p0, delta, nSmall, m, xc, xt }: Params): LQInstance {
  const q0 = p0 / 100, d = delta / 100, q1 = q0 + d
  const v = q0 * (1 - q0) + q1 * (1 - q1)
  const n = nRequired(q0, q1)
  const power = normalCdf(d / Math.sqrt(v / nSmall) - Z_ALPHA)
  const pc = xc / m, pt = xt / m, pp = (xc + xt) / (2 * m)
  const z = (pt - pc) / Math.sqrt(pp * (1 - pp) * (2 / m))
  const half = Z_ALPHA * Math.sqrt((pt * (1 - pt)) / m + (pc * (1 - pc)) / m)
  const pval = 2 * (1 - normalCdf(Math.abs(z)))

  return {
    intro:
      'An A/B test compares a control conversion rate ' + tex(dec(q0)) + ' with a treatment. Use two-sided tests at ' + tex('\\alpha=0.05') + ' (' + tex('z_{0.975}=1.96') + ') and ' + tex('80\\%') + ' power (' + tex('z_{0.80}=0.8416') + '). Do not round intermediate values.',
    parts: [
      {
        prompt: 'The smallest lift worth detecting is ' + tex(dec(d)) + ' in absolute terms (so ' + tex('p_1=' + dec(q1)) + '). How many users per arm are needed, using ' + tex('n=\\dfrac{(z_{0.975}+z_{0.80})^2\\,[p_0(1-p_0)+p_1(1-p_1)]}{\\delta^2}') + ' rounded up?',
        answer: n, tolerance: { rel: 0.003 }, lecture: 7,
        explanation: tex('(1.96+0.8416)^2=' + dec((Z_ALPHA + Z_POWER) ** 2)) + ' and ' + tex('p_0q_0+p_1q_1=' + dec(v)) + ', so ' + tex('n=' + dec((Z_ALPHA + Z_POWER) ** 2 * v / (d * d)) + '\\to ' + n) + ' per arm.',
      },
      {
        prompt: 'Only ' + tex(nSmall) + ' users per arm can be afforded. What is the power of the two-sided test to detect the same lift? Use ' + tex('\\Phi\\!\\left(\\delta/\\mathrm{SE}-1.96\\right)') + ' with ' + tex('\\mathrm{SE}=\\sqrt{[p_0q_0+p_1q_1]/n}') + ' (3 decimal places; answers within 0.003 are accepted because of table rounding).',
        answer: power, tolerance: { abs: 0.003 }, lecture: 7,
        explanation: tex('\\mathrm{SE}=' + dec(Math.sqrt(v / nSmall)) + ',\\ \\delta/\\mathrm{SE}=' + dec(d / Math.sqrt(v / nSmall)) + ',\\ \\Phi(' + dec(d / Math.sqrt(v / nSmall) - Z_ALPHA) + ')=' + dec(power)) + '. Power falls steeply as the sample shrinks.',
      },
      {
        prompt: 'The finished test has ' + tex(m) + ' users per arm, with ' + tex(xc) + ' conversions in control and ' + tex(xt) + ' in treatment. Find the pooled two-proportion ' + tex('z') + ' statistic, ' + tex('\\dfrac{\\hat p_T-\\hat p_C}{\\sqrt{\\hat p(1-\\hat p)(2/m)}}') + ' with ' + tex('\\hat p') + ' the pooled rate (2 decimal places).',
        answer: z, tolerance: tol2, lecture: 8,
        explanation: tex('\\hat p_C=' + dec(pc) + ',\\ \\hat p_T=' + dec(pt) + ',\\ \\hat p=' + dec(pp) + ',\\ z=' + dec(z)) + '. The pooled variance is the right one under the null of equal rates.',
      },
      {
        prompt: 'Find the half-width of the 95% confidence interval for ' + tex('p_T-p_C') + ' using the unpooled standard error ' + tex('\\sqrt{\\hat p_T(1-\\hat p_T)/m+\\hat p_C(1-\\hat p_C)/m}') + ' (answer as a decimal, 4 decimal places; 0.0003 accepted).',
        answer: half, tolerance: { abs: 0.0003 }, lecture: 8,
        explanation: tex('1.96\\times' + dec(half / Z_ALPHA) + '=' + dec(half)) + '. The interval uses the unpooled variance because it does not assume the null.',
      },
      {
        prompt: 'Find the two-sided p-value of the pooled test in the third part, ' + tex('2\\{1-\\Phi(|z|)\\}') + ' (3 decimal places; answers within 0.003 are accepted because of table rounding).',
        answer: pval, tolerance: { abs: 0.003 }, lecture: 6,
        explanation: tex('2\\{1-\\Phi(' + dec(Math.abs(z)) + ')\\}=' + dec(pval)) + '. It is the probability of a statistic at least this extreme if the two rates were truly equal.',
      },
    ],
  }
}

export const genD: LQGenerator = { id: 'exp-lq-d-abtest', generate: (rng) => build(sample(rng)) }
