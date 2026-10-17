// LQ-C: update rules: SGD, momentum, Adam (with bias correction) and a step-decay learning-rate schedule.
// Lecture 3.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { w0: number; g1: number; g2: number; eta: number; lr0: number; gamma: number; s: number; t: number }

export function sample(rng: Rng): Params {
  const nz = () => { let v = 0; while (v === 0) v = rng.int(-20, 20) / 10; return v }
  return { w0: rng.int(-20, 20) / 10, g1: nz(), g2: nz(), eta: rng.pick([0.1, 0.05, 0.01]), lr0: rng.pick([0.1, 0.01]), gamma: rng.pick([0.5, 0.1]), s: rng.pick([5, 10]), t: rng.int(11, 34) }
}

export function build({ w0, g1, g2, eta, lr0, gamma, s, t }: Params): LQInstance {
  const sgd = w0 - eta * g1
  const beta = 0.9
  const v1 = g1
  const v2 = beta * v1 + g2
  const wm = w0 - eta * v1 - eta * v2
  const b1 = 0.9, b2 = 0.999, eps = 1e-8
  const m2 = b1 * (1 - b1) * g1 + (1 - b1) * g2
  const vv2 = b2 * (1 - b2) * g1 * g1 + (1 - b2) * g2 * g2
  const mh = m2 / (1 - b1 * b1)
  const vh = vv2 / (1 - b2 * b2)
  const step = (eta * mh) / (Math.sqrt(vh) + eps)
  const lr = lr0 * gamma ** Math.floor(t / s)

  return {
    intro: 'A single weight starts at ' + tex('w_0=' + dec(w0)) + ' and sees gradients ' + tex('g_1=' + dec(g1)) + ' then ' + tex('g_2=' + dec(g2)) + ', with learning rate ' + tex('\\eta=' + dec(eta)) + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Plain SGD: find the weight after the first step, ' + tex('w_1=w_0-\\eta g_1') + '.',
        answer: sgd, tolerance: tol4, lecture: 3,
        explanation: tex(dec(w0) + '-' + dec(eta) + '\\times(' + dec(g1) + ')=' + dec(sgd)) + '.',
      },
      {
        prompt: 'Momentum with ' + tex('\\beta=0.9') + ' and ' + tex('v_0=0') + ', using ' + tex('v_t=\\beta v_{t-1}+g_t') + ' and ' + tex('w_t=w_{t-1}-\\eta v_t') + '. Find the velocity ' + tex('v_2') + '.',
        answer: v2, tolerance: tol4, lecture: 3,
        explanation: tex('v_1=' + dec(v1) + ',\\ v_2=0.9\\times' + dec(v1) + '+' + dec(g2) + '=' + dec(v2)) + '.',
      },
      {
        prompt: 'With the same momentum recursion, find the weight ' + tex('w_2') + ' after two steps.',
        answer: wm, tolerance: tol4, lecture: 3,
        explanation: tex('w_2=w_0-\\eta v_1-\\eta v_2=' + dec(w0) + '-' + dec(eta * v1) + '-' + dec(eta * v2) + '=' + dec(wm)) + '.',
      },
      {
        prompt: 'Adam with ' + tex('\\beta_1=0.9,\\ \\beta_2=0.999,\\ \\varepsilon=10^{-8}') + ' and zero-initialised moments. Find the size of the second update ' + tex('\\eta\\hat m_2/(\\sqrt{\\hat v_2}+\\varepsilon)') + ', where ' + tex('\\hat m_2=m_2/(1-\\beta_1^2)') + ' and ' + tex('\\hat v_2=v_2/(1-\\beta_2^2)') + '. (Use full calculator precision.)',
        answer: step, tolerance: tol4, lecture: 3,
        explanation: tex('m_2=' + dec(m2) + ',\\ v_2=' + dec(vv2) + ',\\ \\hat m_2=' + dec(mh) + ',\\ \\hat v_2=' + dec(vh) + ',\\ \\text{update}=' + dec(step)) + '.',
      },
      {
        prompt: 'A step-decay schedule starts at ' + tex('\\eta_0=' + dec(lr0)) + ' and multiplies by ' + tex(dec(gamma)) + ' every ' + tex(s) + ' epochs: ' + tex('\\eta_t=\\eta_0\\gamma^{\\lfloor t/' + s + '\\rfloor}') + '. Find the learning rate at epoch ' + tex('t=' + t) + '.',
        answer: lr, tolerance: tol4, lecture: 3,
        explanation: tex('\\lfloor ' + t + '/' + s + '\\rfloor=' + Math.floor(t / s) + ',\\ ' + dec(lr0) + '\\times' + dec(gamma) + '^{' + Math.floor(t / s) + '}=' + dec(lr)) + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'dl-lq-c-optim', generate: (rng) => build(sample(rng)) }
