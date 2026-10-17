// LQ-A: the one-period Kyle model (lambda, insider strategy, price, profit) and the Glosten-Milgrom ask and bid.
// Lectures 1 (Kyle model) and 2 (Glosten-Milgrom).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol2, tol3, tol4 } from '../../../shared/format'

export interface Params { p0: number; s: number; sigU: number; d: number; u: number; vl: number; w: number; th10: number; mu10: number }

export function sample(rng: Rng): Params {
  let d = 0
  while (d === 0) d = rng.int(-6, 6)
  return {
    p0: rng.int(40, 80), s: rng.int(1, 5), sigU: rng.pick([5, 10, 20, 25, 40, 50]), d: d / 2, u: rng.int(-20, 20),
    vl: rng.pick([40, 50, 60, 80]), w: rng.pick([10, 20, 30]), th10: rng.int(3, 7), mu10: rng.int(2, 6),
  }
}

export function build({ p0, s, sigU, d, u, vl, w, th10, mu10 }: Params): LQInstance {
  const lam = s / (2 * sigU)
  const beta = sigU / s
  const x = beta * d
  const p1 = p0 + lam * (x + u)
  const profit = (sigU * s) / 2
  const th = th10 / 10, mu = mu10 / 10
  const vh = vl + w
  const pbH = (1 + mu) / 2, pbL = (1 - mu) / 2
  const ask = vl + w * (th * pbH) / (th * pbH + (1 - th) * pbL)
  const psH = (1 - mu) / 2, psL = (1 + mu) / 2
  const bid = vl + w * (th * psH) / (th * psH + (1 - th) * psL)

  return {
    intro:
      'Part I (Kyle). An asset has liquidation value ' + tex('v\\sim N(p_0,\\Sigma_0)') + ' with ' + tex('p_0=' + p0) + ' and standard deviation ' + tex('\\sqrt{\\Sigma_0}=' + s) +
      '. One insider who knows ' + tex('v') + ' submits ' + tex('x=\\beta(v-p_0)') + '; noise traders submit ' + tex('u\\sim N(0,\\sigma_u^2)') + ' with ' + tex('\\sigma_u=' + sigU) +
      ' (thousand shares). The market maker sets ' + tex('p=p_0+\\lambda(x+u)') + ' and earns zero expected profit. ' +
      'Part II (Glosten-Milgrom). A risk-neutral market maker knows the value is ' + tex('V_L=' + vl) + ' or ' + tex('V_H=' + vh) + ', with ' + tex('P(V_H)=' + dec(th)) +
      '. Each trader is informed (probability ' + tex('\\mu=' + dec(mu)) + ', buys if ' + tex('V_H') + ' and sells if ' + tex('V_L') + ') or uninformed (probability ' + tex('1-\\mu') + ', buys or sells with probability ' + tex('1/2') + ' each). Give answers to the stated number of decimal places and do not round intermediate values.',
    parts: [
      {
        prompt: 'Find the equilibrium price-impact coefficient ' + tex('\\lambda') + ' (4 decimal places).',
        answer: lam, tolerance: tol4, lecture: 1,
        explanation: 'In equilibrium ' + tex('\\beta=\\sigma_u/\\sqrt{\\Sigma_0}') + ' and ' + tex('\\lambda=\\sqrt{\\Sigma_0}/(2\\sigma_u)=' + s + '/(2\\cdot' + sigU + ')=' + dec(lam)) + '.',
      },
      {
        prompt: 'The insider sees ' + tex('v-p_0=' + dec(d)) + ' and the noise traders submit ' + tex('u=' + u) + '. Find the price ' + tex('p') + ' set by the market maker (3 decimal places).',
        answer: p1, tolerance: tol3, lecture: 1,
        explanation: tex('\\beta=' + sigU + '/' + s + '=' + dec(beta) + ',\\ x=' + dec(x) + ',\\ p=' + p0 + '+' + dec(lam) + '(' + dec(x) + '+' + u + ')=' + dec(p1)) + '.',
      },
      {
        prompt: 'Find the insider\'s expected profit ' + tex('E[x(v-p)]=\\tfrac12\\sigma_u\\sqrt{\\Sigma_0}') + ' (2 decimal places).',
        answer: profit, tolerance: tol2, lecture: 1,
        explanation: tex('\\tfrac12\\cdot' + sigU + '\\cdot' + s + '=' + dec(profit)) + '. Half of the information is revealed: the posterior variance is ' + tex('\\Sigma_0/2') + '.',
      },
      {
        prompt: 'Part II: find the ask price, the expected value of the asset given that the next trader buys (3 decimal places).',
        answer: ask, tolerance: tol3, lecture: 2,
        explanation: tex('P(\\text{buy}\\mid V_H)=(1+\\mu)/2=' + dec(pbH) + ',\\ P(\\text{buy}\\mid V_L)=(1-\\mu)/2=' + dec(pbL)) + '. Bayes gives ' + tex('P(V_H\\mid \\text{buy})=' + dec((th * pbH) / (th * pbH + (1 - th) * pbL))) + ', so the ask is ' + tex(dec(ask)) + '.',
      },
      {
        prompt: 'Part II: find the bid price, the expected value of the asset given that the next trader sells (3 decimal places).',
        answer: bid, tolerance: tol3, lecture: 2,
        explanation: tex('P(\\text{sell}\\mid V_H)=' + dec(psH) + ',\\ P(\\text{sell}\\mid V_L)=' + dec(psL)) + ', so ' + tex('P(V_H\\mid\\text{sell})=' + dec((th * psH) / (th * psH + (1 - th) * psL))) + ' and the bid is ' + tex(dec(bid)) + '. The spread ' + tex(dec(ask - bid)) + ' is the cost of adverse selection.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'ms2-lq-a-kyle', generate: (rng) => build(sample(rng)) }
