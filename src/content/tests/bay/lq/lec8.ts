// bay lecture 8 (model evaluation and selection): one story. A model fitted to n = 5 observations: WAIC from a table of posterior summaries,
// a comparison with a second model, the BIC approximation to the log evidence, a Bayes factor and the posterior model probability.
// The numbers are generated consistently: maximised log-likelihood > lppd > log evidence (a proper prior averages the likelihood).
// Lecture 8.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4, tolInt } from '../../../shared/format'

export interface Params { d: number[]; v: number[]; kA: number; lA: number; mA: number; mB: number; waicB: number }

const r1 = (x: number) => Math.round(x * 10) / 10

export function sample(rng: Rng): Params {
  const d = Array.from({ length: 5 }, () => rng.pick([0.08, 0.12, 0.15, 0.2, 0.25, 0.3]))
  const v = Array.from({ length: 5 }, () => rng.pick([0.05, 0.1, 0.15, 0.2, 0.3]))
  const lppd = d.reduce((s, x) => s + Math.log(x), 0)
  const pw = v.reduce((s, x) => s + x, 0)
  const waicA = -2 * (lppd - pw)
  const lA = r1(lppd + rng.pick([0.5, 1, 1.5]))
  const mA = r1(lppd - rng.pick([1, 1.5, 2, 2.5]))
  // log evidences a few units apart, so the Bayes factor is a moderate number; WAIC of B differs from A by at least 1.5, so no ties
  return { d, v, kA: 2, lA, mA, mB: r1(mA + rng.pick([-3, -2, -1, 1, 2, 3])), waicB: r1(waicA + rng.pick([-3, -2, -1.5, 1.5, 2, 3])) }
}

export function build({ d, v, kA, lA, mA, mB, waicB }: Params): LQInstance {
  const n = d.length
  const lppd = d.reduce((s, x) => s + Math.log(x), 0)
  const pw = v.reduce((s, x) => s + x, 0)
  const waicA = -2 * (lppd - pw)
  const waicPref = waicA < waicB ? 1 : 0
  const bicHalf = lA - (kA / 2) * Math.log(n)
  const diff = r1(mA - mB)
  const bf = Math.exp(diff)
  const post = bf / (1 + bf)
  const rows = d.map((x, i) => 'observation ' + (i + 1) + ': ' + tex('\\bar p_' + (i + 1) + '=' + dec(x) + ',\\ V_' + (i + 1) + '=' + dec(v[i]))).join('; ')

  return {
    intro: 'Model A, with ' + tex('k_A=' + kA) + ' parameters, is fitted to ' + tex('n=' + n) + ' observations. From its posterior draws ' + tex('\\theta^{(s)}') + ', each observation has a posterior mean density ' + tex('\\bar p_i=\\frac1S\\sum_sp(y_i\\mid\\theta^{(s)})') + ' and a posterior variance ' + tex('V_i') + ' of ' + tex('\\ln p(y_i\\mid\\theta^{(s)})') + ': ' + rows + '. Model A has maximised log-likelihood ' + tex('\\ell_A=' + lA) + ' and log marginal likelihood (log evidence) ' + tex('\\ln p(y\\mid A)=' + mA) + '. A competing model B has ' + tex('\\ln p(y\\mid B)=' + mB) + ' and ' + tex('\\mathrm{WAIC}_B=' + waicB) + '. The two models have equal prior probability. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the log pointwise predictive density of model A, ' + tex('\\mathrm{lppd}=\\sum_i\\ln\\bar p_i') + '.',
        answer: lppd, tolerance: tol4, lecture: 8,
        explanation: tex(d.map((x) => '\\ln ' + dec(x)).join('+')) + ' = ' + dec(lppd) + '. Take the logarithm of each posterior mean density, not the mean of the log densities.',
      },
      {
        prompt: 'Find the effective number of parameters ' + tex('p_{\\mathrm{WAIC}}=\\sum_iV_i') + '.',
        answer: pw, tolerance: tol4, lecture: 8,
        explanation: tex(v.map(dec).join('+')) + ' = ' + dec(pw) + '. It measures how much the fit varies over the posterior, a measure of flexibility.',
      },
      {
        prompt: 'Find ' + tex('\\mathrm{WAIC}_A=-2(\\mathrm{lppd}-p_{\\mathrm{WAIC}})') + ' (smaller is better).',
        answer: waicA, tolerance: tol4, lecture: 8,
        explanation: tex('-2\\times(' + dec(lppd) + '-' + dec(pw) + ')') + ' = ' + dec(waicA) + '. WAIC estimates out-of-sample predictive accuracy and approximates leave-one-out cross-validation.',
      },
      {
        prompt: 'Which model does WAIC prefer? Answer ' + tex(1) + ' for model A and ' + tex(0) + ' for model B.',
        answer: waicPref, tolerance: tolInt, lecture: 8,
        explanation: 'WAIC of A is ' + dec(waicA) + ' and of B is ' + waicB + '; the smaller one wins, so WAIC prefers model ' + (waicPref ? 'A' : 'B') + '.',
      },
      {
        prompt: 'The Bayesian information criterion ' + tex('\\mathrm{BIC}=k\\ln n-2\\ell') + ' approximates ' + tex('-2\\ln p(y\\mid M)') + ', so ' + tex('\\ln p(y\\mid M)\\approx-\\mathrm{BIC}/2=\\ell-\\tfrac k2\\ln n') + '. Find ' + tex('-\\mathrm{BIC}_A/2') + ' for model A.',
        answer: bicHalf, tolerance: tol4, lecture: 8,
        explanation: tex(lA + '-\\tfrac{' + kA + '}{2}\\ln' + n) + ' = ' + dec(bicHalf) + ', against the actual log evidence ' + mA + ': BIC ignores the prior and is only a rough guide, especially for small ' + tex('n') + '.',
      },
      {
        prompt: 'Find the Bayes factor ' + tex('B_{AB}=p(y\\mid A)/p(y\\mid B)=\\exp\\{\\ln p(y\\mid A)-\\ln p(y\\mid B)\\}') + '.',
        answer: bf, tolerance: { abs: 0.0005 }, lecture: 8,
        explanation: tex('\\exp\\{' + mA + '-(' + mB + ')\\}=e^{' + diff + '}') + ' = ' + dec(bf) + '. A Bayes factor above ' + tex(1) + ' favours model A.',
      },
      {
        prompt: 'With equal prior probabilities, find the posterior probability of model A, ' + tex('P(A\\mid y)=B_{AB}/(1+B_{AB})') + '.',
        answer: post, tolerance: tol4, lecture: 8,
        explanation: tex(dec(bf) + '/(1+' + dec(bf) + ')') + ' = ' + dec(post) + '. Posterior odds equal the Bayes factor times the prior odds, here ' + tex(1) + '.',
      },
    ],
  }
}

export const genLec8: LQGenerator = { id: 'bay-lq-lec8', generate: (rng) => build(sample(rng)) }
