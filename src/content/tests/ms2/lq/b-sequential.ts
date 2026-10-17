// LQ-B: Glosten-Milgrom learning from a sequence of trades, and a self-exciting (Hawkes) order flow with exponential kernel.
// Lectures 2 (sequential trade, Bayesian updating) and 3 (Hawkes processes, intensity calculations).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tol4 } from '../../../shared/format'

export interface Params {
  vl: number; w: number; th10: number; mu10: number; nb1: number; nb: number; ns: number
  base: number; n10: number; beta: number; gaps: number[]; wait: number
}

export function sample(rng: Rng): Params {
  return {
    vl: rng.pick([40, 50, 60, 80]), w: rng.pick([10, 20, 30]), th10: rng.int(3, 7), mu10: rng.int(2, 6),
    nb1: rng.int(2, 3), nb: rng.int(3, 4), ns: rng.int(1, 2),
    base: rng.pick([0.5, 1, 1.5, 2]), n10: rng.pick([4, 5, 6, 7]), beta: rng.pick([1, 2, 4]),
    gaps: [rng.pick([0.25, 0.5, 1]), rng.pick([0.25, 0.5, 1])], wait: rng.pick([0.25, 0.5, 1]),
  }
}

export function build({ vl, w, th10, mu10, nb1, nb, ns, base, n10, beta, gaps, wait }: Params): LQInstance {
  const th = th10 / 10, mu = mu10 / 10
  const vh = vl + w
  const odds = (th / (1 - th)) * ((1 + mu) / (1 - mu)) ** nb1
  const post1 = odds / (1 + odds)
  const odds2 = (th / (1 - th)) * ((1 + mu) / (1 - mu)) ** (nb - ns)
  const post2 = odds2 / (1 + odds2)
  const ev = vl + w * post2

  const n = n10 / 10
  const alpha = n * beta
  const times = [0, gaps[0], gaps[0] + gaps[1]]
  const t = times[2] + wait
  const lam = base + times.reduce((a, ti) => a + alpha * Math.exp(-beta * (t - ti)), 0)
  const stat = base / (1 - n)
  const comp = base * t + (alpha / beta) * times.reduce((a, ti) => a + 1 - Math.exp(-beta * (t - ti)), 0)

  return {
    intro:
      'Part I. The value of an asset is ' + tex('V_L=' + vl) + ' or ' + tex('V_H=' + vh) + ' with prior ' + tex('P(V_H)=' + dec(th)) + '. Each trader is informed with probability ' + tex('\\mu=' + dec(mu)) +
      ' (buys if the value is high, sells if low) and otherwise buys or sells with probability ' + tex('1/2') + ' each; the market maker sees the signs of the trades. ' +
      'Part II. Buy orders arrive as a Hawkes process with intensity ' + tex('\\lambda(t)=\\mu_0+\\sum_{t_i<t}\\alpha e^{-\\beta(t-t_i)}') + ', ' + tex('\\mu_0=' + dec(base) + ',\\ \\beta=' + dec(beta) + ',\\ \\alpha=' + dec(alpha)) +
      '. Give answers to the stated number of decimal places and do not round intermediate values.',
    parts: [
      {
        prompt: 'Part I: after ' + nb1 + ' consecutive buys, find the posterior probability ' + tex('P(V_H\\mid\\text{data})') + ' (4 decimal places).',
        answer: post1, tolerance: tol4, lecture: 2,
        explanation: 'Each buy multiplies the odds of ' + tex('V_H') + ' by ' + tex('\\frac{(1+\\mu)/2}{(1-\\mu)/2}=' + dec((1 + mu) / (1 - mu))) + '. Odds ' + tex(dec(th / (1 - th)) + '\\times' + dec((1 + mu) / (1 - mu)) + '^{' + nb1 + '}=' + dec(odds)) + ', so the probability is ' + tex(dec(post1)) + '.',
      },
      {
        prompt: 'Part I: the market maker sees ' + nb + ' buys and ' + ns + (ns === 1 ? ' sell' : ' sells') + ' in some order. Find the expected value ' + tex('E[V\\mid\\text{data}]') + ' (3 decimal places).',
        answer: ev, tolerance: tol3, lecture: 2,
        explanation: 'A buy and a sell cancel in the odds (the factors are inverse), so only the net count ' + tex(String(nb - ns)) + ' matters. Odds ' + tex(dec(odds2)) + ', probability ' + tex(dec(post2)) + ', and ' + tex('E[V]=' + vl + '+' + w + '\\times' + dec(post2) + '=' + dec(ev)) + '.',
      },
      {
        prompt: 'Part II: buys occurred at times ' + tex('0,\\ ' + dec(times[1]) + ',\\ ' + dec(times[2])) + '. Find the intensity ' + tex('\\lambda(t)') + ' at ' + tex('t=' + dec(t)) + ' (3 decimal places).',
        answer: lam, tolerance: tol3, lecture: 3,
        explanation: 'Add the baseline and the three decayed jumps: ' + tex(dec(base) + '+' + dec(alpha) + '(e^{-' + dec(beta * t) + '}+e^{-' + dec(beta * (t - times[1])) + '}+e^{-' + dec(beta * (t - times[2])) + '})=' + dec(lam)) + '.',
      },
      {
        prompt: 'Part II: find the branching ratio ' + tex('n=\\alpha/\\beta') + ' and then the stationary mean intensity ' + tex('\\mu_0/(1-n)') + ' (give the mean intensity, 3 decimal places).',
        answer: stat, tolerance: tol3, lecture: 3,
        explanation: tex('n=' + dec(alpha) + '/' + dec(beta) + '=' + dec(n)) + ' is below 1, so the process is stationary and ' + tex('E[\\lambda]=' + dec(base) + '/(1-' + dec(n) + ')=' + dec(stat)) + '.',
      },
      {
        prompt: 'Part II: given the same three buys, find the compensator ' + tex('\\int_0^{t}\\lambda(u)\\,du') + ' up to ' + tex('t=' + dec(t)) + ', using the three observed buys as the history (3 decimal places).',
        answer: comp, tolerance: tol3, lecture: 3,
        explanation: tex('\\mu_0 t+\\frac{\\alpha}{\\beta}\\sum_i\\bigl(1-e^{-\\beta(t-t_i)}\\bigr)=' + dec(base * t) + '+' + dec(n) + '\\sum_i(1-e^{-\\beta(t-t_i)})=' + dec(comp)) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'ms2-lq-b-sequential', generate: (rng) => build(sample(rng)) }
