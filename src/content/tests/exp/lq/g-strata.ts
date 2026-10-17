// LQ-G: variance reduction by stratification (overall mean, total variance, share removed), then cluster randomisation
// as a remedy for interference: design effect and number of clusters.
// Lectures 10 (stratification, variance reduction) and 11 (interference, clusters).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tolInt } from '../../../shared/format'

/** w in tenths (sum 10); rho100 = intra-cluster correlation in hundredths */
export interface Params { w: number[]; mu: number[]; sd: number[]; m: number; rho100: number; nInd: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const w1 = rng.int(1, 8)
    const w2 = rng.int(1, 9 - w1)
    const w = [w1, w2, 10 - w1 - w2]
    const m = rng.pick([10, 20, 25, 50])
    const rho100 = rng.pick([1, 2, 3, 5])
    const nInd = rng.int(10, 120) * 100
    const num = (nInd / m) * (100 + (m - 1) * rho100)
    if (num % 100 >= 1 && num % 100 <= 4) continue
    return { w, mu: Array.from({ length: 3 }, () => rng.int(10, 60)), sd: Array.from({ length: 3 }, () => rng.int(4, 12)), m, rho100, nInd }
  }
}

export function build({ w, mu, sd, m, rho100, nInd }: Params): LQInstance {
  const W = w.map((x) => x / 10)
  const sum = (v: number[]) => v.reduce((a, b) => a + b, 0)
  const mean = sum(W.map((x, i) => x * mu[i]))
  const within = sum(W.map((x, i) => x * sd[i] * sd[i]))
  const between = sum(W.map((x, i) => x * (mu[i] - mean) ** 2))
  const total = within + between
  const share = between / total
  const rho = rho100 / 100
  const de = 1 + (m - 1) * rho
  const clusters = Math.ceil((nInd * de) / m - 1e-9)

  return {
    intro:
      'A metric has three user strata (for example by past activity) with population shares ' + tex(W.map(dec).join(',')) + ', stratum means ' + tex(mu.join(',')) + ' and within-stratum standard deviations ' + tex(sd.join(',')) + '. Give answers to 3 decimal places unless told otherwise; do not round intermediate values.',
    parts: [
      {
        prompt: 'Find the overall population mean of the metric.',
        answer: mean, tolerance: tol3, lecture: 10,
        explanation: tex(W.map((x, i) => dec(x) + '\\times' + mu[i]).join('+') + '=' + dec(mean)) + '.',
      },
      {
        prompt: 'Find the total variance of the metric across all users, i.e. the average within-stratum variance plus the variance of the stratum means around the overall mean.',
        answer: total, tolerance: tol3, lecture: 10,
        explanation: 'Within ' + tex(dec(within)) + ' plus between ' + tex(dec(between)) + ' gives ' + tex(dec(total)) + '.',
      },
      {
        prompt: 'A stratified design (with allocation proportional to the shares) removes the between-stratum part of the variance. What fraction of the total variance does it remove?',
        answer: share, tolerance: { abs: 0.001 }, lecture: 10,
        explanation: tex(dec(between) + '/' + dec(total) + '=' + dec(share)) + '. The gain is large when strata differ much in mean relative to their spread.',
      },
      {
        prompt: 'To limit interference, whole clusters of ' + tex('m=' + m) + ' users are randomised instead of individuals, and the intra-cluster correlation is ' + tex('\\rho=' + dec(rho)) + '. Find the design effect ' + tex('1+(m-1)\\rho') + '.',
        answer: de, tolerance: tol3, lecture: 11,
        explanation: tex('1+' + (m - 1) + '\\times' + dec(rho) + '=' + dec(de)) + ': the variance is inflated by this factor compared with individual randomisation.',
      },
      {
        prompt: 'Individual randomisation would need ' + tex(nInd) + ' users per arm. How many clusters per arm are needed with cluster randomisation (users per arm times the design effect, divided by ' + tex(m) + ', rounded up)?',
        answer: clusters, tolerance: tolInt, lecture: 11,
        explanation: tex(nInd + '\\times' + dec(de) + '/' + m + '=' + dec((nInd * de) / m) + '\\to ' + clusters) + ' clusters per arm. Clustering costs effective sample size, which is the price of less spillover.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'exp-lq-g-strata', generate: (rng) => build(sample(rng)) }
