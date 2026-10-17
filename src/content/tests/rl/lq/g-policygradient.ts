// LQ-G: policy gradients for a softmax policy in a single state: probabilities, the exact gradient of the expected reward,
// a baseline-corrected REINFORCE step, an actor-critic step, and the probability ratio used by PPO.
// Lectures 9 (policy gradients) and 10 (the PPO ratio).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params {
  h: number[] // preferences in halves (3 actions): h = value / 2
  q: number[] // expected reward of each action, in tenths
  ia: number // action asked in part 1 and 5
  ie: number // action asked in part 2
  c: number // sampled action
  d: number // another action (d != c)
  G: number // return in tenths
  b: number // baseline in tenths
  alpha100: number
  v: number // V(s) in tenths
  v2: number // V(s') in tenths
  r: number
  gam100: number
  alpha2100: number
  dh: number[] // change of the preferences in tenths (3)
}

export function sample(rng: Rng): Params {
  const c = rng.int(0, 2)
  const d = rng.pick([0, 1, 2].filter((i) => i !== c))
  const dh = [rng.int(-5, 5), rng.int(-5, 5), rng.int(-5, 5)]
  if (dh.every((x) => x === dh[0])) dh[0] += 3 // a common shift would leave the policy unchanged
  return {
    h: [rng.int(-4, 4), rng.int(-4, 4), rng.int(-4, 4)],
    q: [rng.int(0, 50), rng.int(0, 50), rng.int(0, 50)],
    ia: rng.int(0, 2), ie: rng.int(0, 2), c, d,
    G: rng.int(-20, 80), b: rng.int(0, 50), alpha100: rng.pick([10, 20, 50]),
    v: rng.int(0, 50), v2: rng.int(0, 50), r: rng.int(-2, 5), gam100: rng.pick([50, 90]), alpha2100: rng.pick([10, 20, 50]),
    dh,
  }
}

const softmax = (h: number[]) => {
  const e = h.map(Math.exp)
  const z = e.reduce((s, v) => s + v, 0)
  return e.map((v) => v / z)
}

export function build(P: Params): LQInstance {
  const h = P.h.map((v) => v / 2)
  const pi = softmax(h)
  const q = P.q.map((v) => v / 10)
  const J = pi.reduce((s, p, i) => s + p * q[i], 0)
  const grad = pi[P.ie] * (q[P.ie] - J)
  const G = P.G / 10, b = P.b / 10, alpha = P.alpha100 / 100
  const dHd = -alpha * (G - b) * pi[P.d]
  const gam = P.gam100 / 100, alpha2 = P.alpha2100 / 100
  const v = P.v / 10, v2 = P.v2 / 10
  const delta = P.r + gam * v2 - v
  const dHc = alpha2 * delta * (1 - pi[P.c])
  const hNew = h.map((x, i) => x + P.dh[i] / 10)
  const piNew = softmax(hNew)
  const ratio = piNew[P.ia] / pi[P.ia]

  const act = (i: number) => tex('a_' + (i + 1))
  const f = (x: number) => dec(x)

  return {
    intro: 'A policy in a single state chooses among three actions with softmax probabilities ' + tex('\\pi(a)=e^{h(a)}/\\sum_be^{h(b)}') + ', where ' + tex('h=(' + h.map(f).join(',\\ ') + ')') + '. Give all answers to 3 decimal places.',
    parts: [
      {
        prompt: 'What is ' + tex('\\pi(a_' + (P.ia + 1) + ')') + '?',
        answer: pi[P.ia], tolerance: tol3, lecture: 9,
        explanation: tex('\\sum_be^{h(b)}=' + h.map((x) => f(Math.exp(x))).join('+') + '=' + f(h.reduce((s, x) => s + Math.exp(x), 0))) + ', so ' + tex('\\pi(a_' + (P.ia + 1) + ')=' + f(Math.exp(h[P.ia])) + '/' + f(h.reduce((s, x) => s + Math.exp(x), 0)) + '=' + f(pi[P.ia])) + '.',
      },
      {
        prompt: 'The expected reward of the three actions is ' + tex('q=(' + q.map(f).join(',\\ ') + ')') + '. The objective is ' + tex('J(h)=\\sum_a\\pi(a)q(a)') + '. Find the exact gradient ' + tex('\\partial J/\\partial h(a_' + (P.ie + 1) + ')') + '.',
        answer: grad, tolerance: tol3, lecture: 9,
        explanation: 'For a softmax policy ' + tex('\\partial J/\\partial h(a)=\\pi(a)\\,[\\,q(a)-J\\,]') + '. Here ' + tex('J=' + f(J)) + ' and ' + tex('\\pi(a_' + (P.ie + 1) + ')=' + f(pi[P.ie])) + ', so the gradient is ' + tex(f(grad)) + '.',
      },
      {
        prompt: 'REINFORCE with a baseline: action ' + act(P.c) + ' was sampled and the return was ' + tex('G=' + f(G)) + ', with baseline ' + tex('b=' + f(b)) + '. The update is ' + tex('h\\leftarrow h+\\alpha\\,(G-b)\\,\\nabla_h\\ln\\pi(a)') + ' with ' + tex('\\alpha=' + f(alpha)) + '. By how much does the preference ' + tex('h(a_' + (P.d + 1) + ')') + ' of the other action ' + act(P.d) + ' change?',
        answer: dHd, tolerance: tol3, lecture: 9,
        explanation: tex('\\partial\\ln\\pi(a)/\\partial h(b)=\\mathbb 1[a=b]-\\pi(b)') + ', which equals ' + tex('-\\pi(a_' + (P.d + 1) + ')=-' + f(pi[P.d])) + ' for the other action. The change is ' + tex(f(alpha) + '\\times(' + f(G - b) + ')\\times(-' + f(pi[P.d]) + ')=' + f(dHd)) + '.',
      },
      {
        prompt: 'An actor-critic step in the same state: the critic has ' + tex('V(s)=' + f(v)) + ', the agent samples ' + act(P.c) + ', receives reward ' + tex(P.r) + ' and moves to a state with ' + tex('V(s\')=' + f(v2)) + '; the discount is ' + tex('\\gamma=' + f(gam)) + '. The actor uses the TD error as its advantage with step size ' + tex('\\alpha=' + f(alpha2)) + '. By how much does ' + tex('h(a_' + (P.c + 1) + ')') + ' change?',
        answer: dHc, tolerance: tol3, lecture: 9,
        explanation: tex('\\delta=' + P.r + '+' + f(gam) + '\\times' + f(v2) + '-' + f(v) + '=' + f(delta)) + '. The sampled action has ' + tex('\\partial\\ln\\pi/\\partial h=1-\\pi(a_' + (P.c + 1) + ')=' + f(1 - pi[P.c])) + ', so the change is ' + tex(f(alpha2) + '\\times' + f(delta) + '\\times' + f(1 - pi[P.c]) + '=' + f(dHc)) + '.',
      },
      {
        prompt: 'After some updates the preferences become ' + tex('h_{\\text{new}}=(' + hNew.map(f).join(',\\ ') + ')') + '. What is the probability ratio ' + tex('r=\\pi_{\\text{new}}(a_' + (P.ia + 1) + ')/\\pi_{\\text{old}}(a_' + (P.ia + 1) + ')') + ' that PPO clips?',
        answer: ratio, tolerance: tol3, lecture: 10,
        explanation: 'The new probabilities are ' + tex(piNew.map(f).join(',\\ ')) + ' and the old ones ' + tex(pi.map(f).join(',\\ ')) + ', so ' + tex('r=' + f(piNew[P.ia]) + '/' + f(pi[P.ia]) + '=' + f(ratio)) + '.',
      },
    ],
  }
}

export const genG: LQGenerator = { id: 'rl-lq-g-policygradient', generate: (rng) => build(sample(rng)) }
