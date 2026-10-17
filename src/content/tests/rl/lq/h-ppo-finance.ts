// LQ-H: the PPO clipped objective, a soft actor-critic target, potential-based reward shaping and an execution reward.
// Lectures 10 (modern policy methods) and 11 (RL in finance).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params {
  eps100: number // PPO clip range in hundredths
  k1: number // ratio offset (tenths) above 1+eps for part 1
  A1: number // advantage in tenths (positive)
  ks: number[] // ratio offsets in tenths for the three samples of part 2
  As: number[] // advantage magnitudes in tenths for part 2
  rs: number // SAC reward
  gam100: number
  Q1: number // tenths
  Q2: number // tenths
  temp100: number // entropy temperature in hundredths
  pa: number // pi(a'|s') in hundredths
  phi: number[] // potentials of the three non-terminal states
  gs: number // shaping discount in tenths
  rw: number[] // original rewards of the path
  kk: number // execution: shares per interval at TWAP
  v: number[] // execution schedule
  eta100: number
  lam100: number
}

export function sample(rng: Rng): Params {
  const kk = rng.int(2, 6)
  const X = 3 * kk
  const v1 = rng.int(1, X - 2)
  const v2 = rng.int(1, X - v1 - 1)
  return {
    eps100: rng.pick([10, 20, 30]), k1: rng.int(1, 6), A1: rng.int(5, 30),
    ks: [rng.int(1, 3), rng.int(1, 6), rng.int(1, 3)], As: [rng.int(5, 30), rng.int(5, 30), rng.int(5, 30)],
    rs: rng.int(-2, 5), gam100: rng.pick([90, 95, 99]), Q1: rng.int(0, 60), Q2: rng.int(0, 60),
    temp100: rng.pick([10, 20, 50]), pa: rng.pick([20, 25, 40, 50]),
    phi: [rng.int(0, 10), rng.int(0, 10), rng.int(0, 10)], gs: rng.pick([5, 9]), rw: [rng.int(-2, 5), rng.int(-2, 5), rng.int(-2, 5)],
    kk, v: [v1, v2, X - v1 - v2], eta100: rng.pick([1, 2, 5]), lam100: rng.pick([1, 2, 5]),
  }
}

export function build(P: Params): LQInstance {
  const eps = P.eps100 / 100
  const f = (x: number) => dec(x)
  // part 1: positive advantage, ratio above 1 + eps -> clipped
  const r1 = 1 + eps + P.k1 / 10, A1 = P.A1 / 10
  const L1 = Math.min(r1 * A1, Math.min(Math.max(r1, 1 - eps), 1 + eps) * A1)
  // part 2: three samples hitting different branches
  const rA = 1 - eps - P.ks[0] / 10 * 0.5 // below the lower clip, positive advantage
  const rB = 1 + eps + P.ks[1] / 10 // above the upper clip, negative advantage
  const rC = 1 - eps - P.ks[2] / 10 * 0.5 // below the lower clip, negative advantage
  const rr = [rA, rB, rC]
  const AA = [P.As[0] / 10, -P.As[1] / 10, -P.As[2] / 10]
  const clipv = (r: number) => Math.min(Math.max(r, 1 - eps), 1 + eps)
  const terms = rr.map((r, i) => Math.min(r * AA[i], clipv(r) * AA[i]))
  const L2 = (terms[0] + terms[1] + terms[2]) / 3
  // part 3: SAC target
  const gam = P.gam100 / 100, temp = P.temp100 / 100, pa = P.pa / 100
  const Q1 = P.Q1 / 10, Q2 = P.Q2 / 10
  const y = P.rs + gam * (Math.min(Q1, Q2) - temp * Math.log(pa))
  // part 4: shaping along s0 -> s1 -> s2 -> terminal (potential 0)
  const g = P.gs / 10
  const phi = [...P.phi, 0]
  let shaped = 0
  for (let t = 0; t < 3; t++) shaped += g ** t * (P.rw[t] + g * phi[t + 1] - phi[t])
  // part 5: execution reward
  const eta = P.eta100 / 100, lam = P.lam100 / 100
  const X = P.v[0] + P.v[1] + P.v[2]
  const x1 = X - P.v[0], x2 = X - P.v[0] - P.v[1]
  const cost = eta * (P.v[0] ** 2 + P.v[1] ** 2 + P.v[2] ** 2) + lam * (x1 ** 2 + x2 ** 2)

  return {
    intro: 'Give all answers to 3 decimal places.',
    parts: [
      {
        prompt: 'PPO uses the clipped objective ' + tex('\\min\\{rA,\\ \\mathrm{clip}(r,1-\\epsilon,1+\\epsilon)A\\}') + ' with ' + tex('\\epsilon=' + f(eps)) + '. A sample has probability ratio ' + tex('r=' + f(r1)) + ' and advantage ' + tex('A=' + f(A1)) + '. What is its objective value?',
        answer: L1, tolerance: tol3, lecture: 10,
        explanation: 'The ratio is above ' + tex('1+\\epsilon=' + f(1 + eps)) + ' and ' + tex('A>0') + ', so the clipped term is smaller: ' + tex('\\min\\{' + f(r1 * A1) + ',\\ ' + f((1 + eps) * A1) + '\\}=' + f(L1)) + '.',
      },
      {
        prompt: 'With the same ' + tex('\\epsilon=' + f(eps)) + ', a mini-batch has three samples with (ratio, advantage) equal to ' + tex('(' + f(rA) + ',\\ ' + f(AA[0]) + ')') + ', ' + tex('(' + f(rB) + ',\\ ' + f(AA[1]) + ')') + ' and ' + tex('(' + f(rC) + ',\\ ' + f(AA[2]) + ')') + '. What is the mean clipped objective over the batch?',
        answer: L2, tolerance: tol3, lecture: 10,
        explanation: 'Sample by sample the minimum is ' + tex(terms.map(f).join(',\\ ')) + ' (negative advantages keep the unclipped term when the ratio is above ' + tex('1+\\epsilon') + ' and use the clipped term when it is below ' + tex('1-\\epsilon') + '). The mean is ' + tex(f(L2)) + '.',
      },
      {
        prompt: 'A soft actor-critic target is ' + tex('y=r+\\gamma\\,[\\,\\min(Q_1,Q_2)-\\alpha\\ln\\pi(a\'\\mid s\')\\,]') + ' with reward ' + tex(P.rs) + ', ' + tex('\\gamma=' + f(gam)) + ', ' + tex('Q_1(s\',a\')=' + f(Q1)) + ', ' + tex('Q_2(s\',a\')=' + f(Q2)) + ', temperature ' + tex('\\alpha=' + f(temp)) + ' and ' + tex('\\pi(a\'\\mid s\')=' + f(pa)) + '. Find ' + tex('y') + '.',
        answer: y, tolerance: tol3, lecture: 10,
        explanation: tex('\\min(Q_1,Q_2)=' + f(Math.min(Q1, Q2)) + ',\\ -\\alpha\\ln\\pi=' + f(-temp * Math.log(pa))) + ', so ' + tex('y=' + P.rs + '+' + f(gam) + '\\times(' + f(Math.min(Q1, Q2) - temp * Math.log(pa)) + ')=' + f(y)) + '.',
      },
      {
        prompt: 'Potential-based shaping adds ' + tex('F=\\gamma\\Phi(s\')-\\Phi(s)') + ' to each reward, with ' + tex('\\gamma=' + f(g)) + '. A path ' + tex('s_0\\to s_1\\to s_2\\to s_3') + ' ends in a terminal state with ' + tex('\\Phi(s_3)=0') + ', and ' + tex('\\Phi(s_0),\\Phi(s_1),\\Phi(s_2)=' + P.phi.join(',\\ ')) + '. The original rewards on the three steps are ' + tex(P.rw.join(',\\ ')) + '. What is the discounted return of the shaped rewards from ' + tex('s_0') + '?',
        answer: shaped, tolerance: tol3, lecture: 11,
        explanation: 'The shaping terms telescope: ' + tex('\\sum_t\\gamma^tF_t=\\gamma^3\\Phi(s_3)-\\Phi(s_0)=-' + P.phi[0]) + '. The original discounted return is ' + tex(f(shaped + P.phi[0])) + ', so the shaped return is ' + tex(f(shaped)) + '.',
      },
      {
        prompt: 'An execution agent sells ' + tex(X) + ' shares in three intervals, trading ' + tex(P.v.join(',\\ ')) + ' shares. At interval ' + tex('t') + ' its reward is ' + tex('-\\eta v_t^2-\\lambda x_t^2') + ', where ' + tex('x_t') + ' is the inventory left after trading, ' + tex('\\eta=' + f(eta)) + ' and ' + tex('\\lambda=' + f(lam)) + '. What is the total (undiscounted) reward?',
        answer: -cost, tolerance: tol3, lecture: 11,
        explanation: 'The inventory after each trade is ' + tex(x1 + ',\\ ' + x2 + ',\\ 0') + '. Impact cost ' + tex(f(eta) + '\\times' + (P.v[0] ** 2 + P.v[1] ** 2 + P.v[2] ** 2) + '=' + f(eta * (P.v[0] ** 2 + P.v[1] ** 2 + P.v[2] ** 2))) + ', risk penalty ' + tex(f(lam) + '\\times' + (x1 ** 2 + x2 ** 2) + '=' + f(lam * (x1 ** 2 + x2 ** 2))) + '. The total reward is ' + tex(f(-cost)) + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'rl-lq-h-ppo-finance', generate: (rng) => build(sample(rng)) }
