// LQ-C: a randomised complete block design analysed by hand, and the efficiency gained by blocking.
// Lectures 4 (randomised blocks, block-adjusted comparisons) and 1 (blocking as a design principle).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol3 } from '../../../shared/format'

/** y[j][i]: response of treatment i in block j */
export interface Params { t: number; b: number; y: number[][] }

export function sample(rng: Rng): Params {
  const t = rng.pick([3, 4])
  const b = rng.pick([4, 5])
  const tau = Array.from({ length: t }, () => rng.int(-3, 5))
  const y = Array.from({ length: b }, () => {
    const beta = rng.int(-8, 8)
    return tau.map((ti) => 30 + beta + ti + rng.int(-3, 3))
  })
  return { t, b, y }
}

export function build({ t, b, y }: Params): LQInstance {
  const sum = (v: number[]) => v.reduce((a, c) => a + c, 0)
  const N = t * b
  const grand = sum(y.flat()) / N
  const blockMeans = y.map((r) => sum(r) / t)
  const trtMeans = Array.from({ length: t }, (_, i) => sum(y.map((r) => r[i])) / b)
  const ssBlock = t * sum(blockMeans.map((m) => (m - grand) ** 2))
  const ssTrt = b * sum(trtMeans.map((m) => (m - grand) ** 2))
  const ssTot = sum(y.flat().map((v) => (v - grand) ** 2))
  const sse = ssTot - ssBlock - ssTrt
  const dfE = (t - 1) * (b - 1)
  const msE = sse / dfE
  const msT = ssTrt / (t - 1)
  const msB = ssBlock / (b - 1)
  const F = msT / msE
  const re = ((b - 1) * msB + b * (t - 1) * msE) / ((N - 1) * msE)

  const rows = y.map((r, j) => 'block ' + (j + 1) + ': ' + r.map((v, i) => 'T' + (i + 1) + '=' + v).join(', ')).join('; ')
  return {
    intro:
      'A randomised complete block design compares ' + tex(t) + ' treatments in ' + tex(b) + ' blocks, each treatment once per block (order randomised within each block). Responses: ' + rows + '. Do not round intermediate values; give answers to 2 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the block sum of squares ' + tex('SS_{\\text{blocks}}=t\\sum_j(\\bar y_{\\cdot j}-\\bar y_{\\cdot\\cdot})^2') + '.',
        answer: ssBlock, tolerance: tol2, lecture: 4,
        explanation: 'Block means ' + tex(blockMeans.map(dec).join(',')) + ', grand mean ' + tex(dec(grand)) + '. Then ' + tex('SS_{\\text{blocks}}=' + dec(ssBlock)) + ' on ' + tex(b - 1) + ' degrees of freedom.',
      },
      {
        prompt: 'Find the treatment sum of squares ' + tex('SS_{\\text{treat}}=b\\sum_i(\\bar y_{i\\cdot}-\\bar y_{\\cdot\\cdot})^2') + '.',
        answer: ssTrt, tolerance: tol2, lecture: 4,
        explanation: 'Treatment means ' + tex(trtMeans.map(dec).join(',')) + ', so ' + tex('SS_{\\text{treat}}=' + dec(ssTrt)) + ' on ' + tex(t - 1) + ' degrees of freedom.',
      },
      {
        prompt: 'Find the error sum of squares, the part of the total variation left after removing blocks and treatments.',
        answer: sse, tolerance: tol2, lecture: 4,
        explanation: tex('SS_E=SS_T-SS_{\\text{blocks}}-SS_{\\text{treat}}=' + dec(ssTot) + '-' + dec(ssBlock) + '-' + dec(ssTrt) + '=' + dec(sse)) + ' on ' + tex(dfE) + ' degrees of freedom, so ' + tex('MS_E=' + dec(msE)) + '.',
      },
      {
        prompt: 'Find the ' + tex('F') + ' statistic for treatments, ' + tex('MS_{\\text{treat}}/MS_E') + ' (3 decimal places).',
        answer: F, tolerance: tol3, lecture: 4,
        explanation: tex('MS_{\\text{treat}}=' + dec(msT) + ',\\ MS_E=' + dec(msE) + ',\\ F=' + dec(F)) + ' on ' + tex(t - 1) + ' and ' + tex(dfE) + ' degrees of freedom.',
      },
      {
        prompt: 'The estimated relative efficiency of this block design against a completely randomised design with the same units is ' + tex('\\dfrac{(b-1)MS_{\\text{blocks}}+b(t-1)MS_E}{(bt-1)MS_E}') + '. Find it (3 decimal places). A value above 1 means blocking reduced the error variance.',
        answer: re, tolerance: tol3, lecture: 1,
        explanation: tex('MS_{\\text{blocks}}=' + dec(msB) + ',\\ MS_E=' + dec(msE)) + ', so the efficiency is ' + tex(dec(re)) + '. A completely randomised design would need about ' + tex(dec(re)) + ' times as many units for the same precision.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'exp-lq-c-block', generate: (rng) => build(sample(rng)) }
