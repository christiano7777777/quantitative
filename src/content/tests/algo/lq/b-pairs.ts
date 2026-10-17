// LQ-B: statistical arbitrage: hedge ratio, spread, z-score, mean-reversion half-life and the profit from convergence.
// Lecture 3.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol4 } from '../../../shared/format'

export interface Params { cov: number; varx: number; x: number; y: number; mu: number; sd: number; phi: number; n: number }

export function sample(rng: Rng): Params {
  const varx = rng.int(20, 80) / 10
  const beta = rng.int(5, 20) / 10
  const x = rng.int(400, 900) / 10, mu = rng.int(-20, 20) / 10, sd = rng.int(5, 20) / 10
  const cov = Math.round(beta * varx * 100) / 100
  const y = Math.round(((cov / varx) * x + mu + (rng.int(15, 28) / 10) * sd) * 10) / 10 // spread sits 1.5 to 2.8 sd above its mean
  return { cov, varx, x, y, mu, sd, phi: rng.int(80, 98) / 100, n: rng.pick([1000, 2000, 5000]) }
}

export function build(p: Params): LQInstance {
  const beta = p.cov / p.varx
  const y = p.y
  const spread = y - beta * p.x
  const z = (spread - p.mu) / p.sd
  const half = -Math.log(2) / Math.log(p.phi)
  const pnl = (spread - p.mu) * p.n

  return {
    intro: 'Two cointegrated stocks have ' + tex('\\mathrm{Cov}(X,Y)=' + dec(p.cov) + ',\\ \\mathrm{Var}(X)=' + dec(p.varx)) + '. Today ' + tex('X=' + dec(p.x) + ',\\ Y=' + dec(y)) + '. The spread ' + tex('S=Y-\\beta X') + ' has long-run mean ' + tex(dec(p.mu)) + ' and standard deviation ' + tex(dec(p.sd)) + '. Give answers to 4 decimal places except where stated.',
    parts: [
      {
        prompt: 'Find the hedge ratio from the regression of ' + tex('Y') + ' on ' + tex('X') + ', ' + tex('\\beta=\\mathrm{Cov}(X,Y)/\\mathrm{Var}(X)') + '.',
        answer: beta, tolerance: tol4, lecture: 3,
        explanation: tex(dec(p.cov) + '/' + dec(p.varx) + '=' + dec(beta)) + '.',
      },
      {
        prompt: 'Find today\'s spread ' + tex('S=Y-\\beta X') + '.',
        answer: spread, tolerance: tol4, lecture: 3,
        explanation: tex(dec(y) + '-' + dec(beta) + '\\times' + dec(p.x) + '=' + dec(spread)) + '.',
      },
      {
        prompt: 'Find the spread z-score ' + tex('(S-\\mu)/\\sigma') + '.',
        answer: z, tolerance: tol4, lecture: 3,
        explanation: tex('(' + dec(spread) + '-' + dec(p.mu) + ')/' + dec(p.sd) + '=' + dec(z)) + '. A large positive z means ' + tex('Y') + ' is rich relative to ' + tex('X') + ': short the spread.',
      },
      {
        prompt: 'The spread follows an AR(1) with coefficient ' + tex('\\varphi=' + dec(p.phi)) + ' per day. Find the half-life in days, ' + tex('-\\ln2/\\ln\\varphi') + '.',
        answer: half, tolerance: tol4, lecture: 3,
        explanation: tex('-0.693147/\\ln ' + dec(p.phi) + '=' + dec(half)) + ' days. A short half-life means faster mean reversion.',
      },
      {
        prompt: 'You short ' + tex(p.n) + ' units of the spread (short ' + tex(p.n) + ' of ' + tex('Y') + ' and long ' + tex(p.n) + '\\beta' + ' of ' + tex('X') + '). If the spread returns exactly to its mean, what is the profit? Give it to 2 decimal places.',
        answer: pnl, tolerance: tol2, lecture: 3,
        explanation: tex('(' + dec(spread) + '-' + dec(p.mu) + ')\\times' + p.n + '=' + dec(pnl)) + ' before costs.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'algo-lq-b-pairs', generate: (rng) => build(sample(rng)) }
