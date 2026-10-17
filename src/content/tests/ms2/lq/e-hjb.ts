// LQ-E: an HJB execution problem with quadratic value function: Riccati solution, feedback speed, path, value, and running penalty.
// Lecture 6 (optimal execution II, HJB and stochastic control).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { k: number; alpha: number; T: number; q0: number; phi: number }

export function sample(rng: Rng): Params {
  return { k: rng.pick([0.5, 1, 2, 4]), alpha: rng.pick([1, 2, 5]), T: rng.pick([1, 2, 3]), q0: rng.pick([10, 20, 50]), phi: rng.pick([0.5, 1, 2]) }
}

export function build({ k, alpha, T, q0, phi }: Params): LQInstance {
  const c = k / alpha
  const h0 = 1 / (1 / alpha + T / k)
  const v0 = (h0 * q0) / k
  const qMid = (q0 * (c + T / 2)) / (c + T)
  const value = h0 * q0 * q0
  const zeta = Math.sqrt(phi * k), g = Math.sqrt(phi / k)
  const th = Math.tanh(g * T)
  const h0phi = (zeta * (alpha + zeta * th)) / (zeta + alpha * th)

  return {
    intro:
      'A trader holds ' + tex('q_0=' + q0) + ' (thousand shares) at time 0 and sells at rate ' + tex('v_t') + ', so ' + tex('dq_t=-v_t\\,dt') + '. The cost to minimise is ' + tex('E\\Bigl[\\int_0^T k v_t^2\\,dt+\\alpha q_T^2\\Bigr]') + ' with ' + tex('k=' + dec(k) + ',\\ \\alpha=' + dec(alpha) + ',\\ T=' + T) +
      '. Try the value function ' + tex('V(t,q)=h(t)q^2') + ' in the HJB equation ' + tex('0=V_t+\\min_v\\{kv^2-vV_q\\}') + ', which gives ' + tex('v^*=h q/k') + ' and the Riccati equation ' + tex('h\'=h^2/k') + ' with ' + tex('h(T)=\\alpha') + '. Give answers to 4 decimal places and do not round intermediate values.',
    parts: [
      {
        prompt: 'Solve the Riccati equation (hint: ' + tex('1/h') + ' changes linearly in time) and find ' + tex('h(0)') + '.',
        answer: h0, tolerance: tol4, lecture: 6,
        explanation: tex('\\frac{d}{dt}(1/h)=-1/k') + ', so ' + tex('1/h(t)=1/\\alpha+(T-t)/k') + ' and ' + tex('h(0)=1/(1/' + dec(alpha) + '+' + T + '/' + dec(k) + ')=' + dec(h0)) + '.',
      },
      {
        prompt: 'Find the optimal selling rate at time 0, ' + tex('v^*_0=h(0)q_0/k') + ' (thousand shares per day).',
        answer: v0, tolerance: tol4, lecture: 6,
        explanation: tex(dec(h0) + '\\times' + q0 + '/' + dec(k) + '=' + dec(v0)) + '. The rate turns out to be constant in time because ' + tex('\\dot q=-hq/k') + ' makes ' + tex('q') + ' linear.',
      },
      {
        prompt: 'Find the optimal holdings at the midpoint ' + tex('t=T/2') + ', using ' + tex('q_t=q_0\\,\\frac{k/\\alpha+T-t}{k/\\alpha+T}') + '.',
        answer: qMid, tolerance: tol4, lecture: 6,
        explanation: tex('k/\\alpha=' + dec(c) + ',\\ q_{T/2}=' + q0 + '\\times(' + dec(c) + '+' + dec(T / 2) + ')/(' + dec(c) + '+' + T + ')=' + dec(qMid)) + '. The trader sells down but does not reach zero when ' + tex('\\alpha<\\infty') + '.',
      },
      {
        prompt: 'Find the optimal expected cost ' + tex('V(0,q_0)=h(0)q_0^2') + '.',
        answer: value, tolerance: { abs: 0.0005, rel: 1e-5 }, lecture: 6,
        explanation: tex(dec(h0) + '\\times' + q0 + '^2=' + dec(value)) + '.',
      },
      {
        prompt: 'Now add a running inventory penalty ' + tex('\\phi q_t^2') + ' with ' + tex('\\phi=' + dec(phi)) + ' to the cost, so ' + tex('h\'=h^2/k-\\phi') + ' with ' + tex('h(T)=\\alpha') + '. With ' + tex('\\zeta=\\sqrt{\\phi k}') + ' and ' + tex('\\gamma=\\sqrt{\\phi/k}') + ', the solution is ' + tex('h(t)=\\zeta\\,\\frac{\\alpha+\\zeta\\tanh(\\gamma(T-t))}{\\zeta+\\alpha\\tanh(\\gamma(T-t))}') + '. Find ' + tex('h(0)') + '.',
        answer: h0phi, tolerance: tol4, lecture: 6,
        explanation: tex('\\zeta=' + dec(zeta) + ',\\ \\gamma=' + dec(g) + ',\\ \\tanh(\\gamma T)=' + dec(th) + ',\\ h(0)=' + dec(h0phi)) + '. If ' + tex('\\alpha=\\zeta') + ' then ' + tex('h') + ' is constant.',
      },
    ],
  }
}

export const genE: LQGenerator = { id: 'ms2-lq-e-hjb', generate: (rng) => build(sample(rng)) }
