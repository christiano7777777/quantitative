// LQ-G: the Black-Scholes PDE: which power contract solves it, its price, the call price, delta and theta.
// Lectures 9 (Black-Scholes derivation) and 8 (risk-neutral pricing).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, normalCdf, tex, tol2, tol3, tol4 } from '../../../shared/format'

export interface Params { pw: number; r: number; sigma: number; T: number; s0: number; K: number }

export function sample(rng: Rng): Params {
  const s0 = rng.int(60, 140)
  return { pw: rng.pick([2, 3, -1, 0.5, -2]), r: rng.int(2, 8) / 100, sigma: rng.int(2, 4) / 10, T: rng.pick([0.5, 1, 2]), s0, K: Math.round(s0 * rng.int(90, 110) / 100) }
}

const phi = (x: number) => Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI)

export function build({ pw, r, sigma, T, s0, K }: Params): LQInstance {
  const lam = r * (1 - pw) - 0.5 * sigma * sigma * pw * (pw - 1)
  const ratio = Math.exp(-lam * T)
  const sq = sigma * Math.sqrt(T)
  const d1 = (Math.log(s0 / K) + (r + 0.5 * sigma * sigma) * T) / sq
  const d2 = d1 - sq
  const call = s0 * normalCdf(d1) - K * Math.exp(-r * T) * normalCdf(d2)
  const delta = normalCdf(d1)
  const theta = -(s0 * phi(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normalCdf(d2)
  const pde = tex('V_t+\\tfrac12\\sigma^2S^2V_{SS}+rSV_S-rV=0')

  return {
    intro: 'In a Black-Scholes market with ' + tex('r=' + dec(r)) + ' and ' + tex('\\sigma=' + dec(sigma)) + ', a derivative price ' + tex('V(t,S)') + ' solves ' + pde + '. Use the standard normal cdf ' + tex('\\Phi') + ' where needed. Give the first two answers to 4 decimal places, the third and fifth to 2 and the fourth to 3.',
    parts: [
      {
        prompt: 'A contract has the form ' + tex('V(t,S)=S^{' + dec(pw) + '}e^{-\\lambda(T-t)}') + '. For which constant ' + tex('\\lambda') + ' does it solve the PDE?',
        answer: lam, tolerance: tol4, lecture: 9,
        explanation: tex('V_t=\\lambda V,\\ SV_S=pV,\\ S^2V_{SS}=p(p-1)V') + ', so the PDE needs ' + tex('\\lambda+\\tfrac12\\sigma^2p(p-1)+rp-r=0') + ', i.e. ' + tex('\\lambda=r(1-p)-\\tfrac12\\sigma^2p(p-1)=' + dec(lam)) + '.',
      },
      {
        prompt: 'This contract pays ' + tex('S_T^{' + dec(pw) + '}') + ' at time ' + tex('T=' + dec(T)) + '. Find its price at time 0 divided by ' + tex('S_0^{' + dec(pw) + '}') + '.',
        answer: ratio, tolerance: tol4, lecture: 9,
        explanation: tex('V(0,S_0)/S_0^p=e^{-\\lambda T}=e^{' + dec(-lam * T) + '}=' + dec(ratio)) + '. Equivalently ' + tex('e^{-rT}E_Q[(S_T/S_0)^p]') + ', the same number.',
      },
      {
        prompt: 'Find the Black-Scholes price of a European call with ' + tex('S_0=' + s0 + ',\\ K=' + K) + ' and maturity ' + tex('T=' + dec(T)) + '.',
        answer: call, tolerance: tol2, lecture: 9,
        explanation: tex('d_1=' + dec(d1) + ',\\ d_2=' + dec(d2) + ',\\ C=S_0\\Phi(d_1)-Ke^{-rT}\\Phi(d_2)=' + dec(call)) + '.',
      },
      {
        prompt: 'Find the delta of this call, the number of shares in the replicating portfolio at time 0.',
        answer: delta, tolerance: tol3, lecture: 9,
        explanation: tex('\\Delta=\\partial C/\\partial S=\\Phi(d_1)=\\Phi(' + dec(d1) + ')=' + dec(delta)) + '.',
      },
      {
        prompt: 'Find the theta ' + tex('\\Theta=\\partial C/\\partial t') + ' of the call (per year).',
        answer: theta, tolerance: tol2, lecture: 9,
        explanation: tex('\\Theta=-\\dfrac{S_0\\varphi(d_1)\\sigma}{2\\sqrt T}-rKe^{-rT}\\Phi(d_2)=' + dec(theta)) + '. It also satisfies the PDE: ' + tex('\\Theta+\\tfrac12\\sigma^2S^2\\Gamma+rS\\Delta=rC') + '.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'sc-lq-g-bs', generate: (rng) => build(sample(rng)) }
