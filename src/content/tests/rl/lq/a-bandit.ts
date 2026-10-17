// LQ-A: multi-armed bandits by hand: regret, incremental averages, the UCB1 index, a Beta posterior, and the value of an epsilon-greedy policy in a one-state MDP.
// Lectures 1 (bandits) and 2 (the value of a policy as a discounted sum).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params {
  muH: number[] // true success probabilities in hundredths (3 arms, distinct)
  cnt: number[] // pulls of each arm
  qT: number // current sample average, in tenths
  n: number // pulls behind that average
  r: number // new reward
  qaH: number // UCB: sample mean in hundredths
  na: number // UCB: pulls of this arm
  t: number // UCB: total rounds
  c: number // UCB: exploration constant
  s: number // successes
  f: number // failures
  a0: number // Beta prior parameters
  b0: number
  epsH: number // epsilon in hundredths
  gamT: number // discount in tenths
}

export function sample(rng: Rng): Params {
  const na = rng.int(2, 20)
  return {
    muH: rng.sample([20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90], 3),
    cnt: [rng.int(3, 40), rng.int(3, 40), rng.int(3, 40)],
    qT: rng.int(10, 80), n: rng.int(3, 12), r: rng.int(0, 10),
    qaH: rng.int(30, 90), na, t: rng.int(na + 10, 200), c: rng.pick([0.5, 1, 2]),
    s: rng.int(2, 12), f: rng.int(1, 10), a0: rng.int(1, 3), b0: rng.int(1, 3),
    epsH: rng.pick([10, 20, 30]), gamT: rng.pick([5, 8, 9]),
  }
}

export function build(p: Params): LQInstance {
  const mu = p.muH.map((x) => x / 100)
  const best = Math.max(...mu)
  const regret = mu.reduce((acc, m, i) => acc + p.cnt[i] * (best - m), 0)
  const q = p.qT / 10
  const qNew = q + (p.r - q) / (p.n + 1)
  const qa = p.qaH / 100
  const ucb = qa + p.c * Math.sqrt(Math.log(p.t) / p.na)
  const post = (p.a0 + p.s) / (p.a0 + p.b0 + p.s + p.f)
  const eps = p.epsH / 100
  const gam = p.gamT / 10
  const rbar = (1 - eps) * best + eps * (mu[0] + mu[1] + mu[2]) / 3
  const v = rbar / (1 - gam)
  const total = p.cnt[0] + p.cnt[1] + p.cnt[2]

  return {
    intro: 'Give all answers to 3 decimal places.',
    parts: [
      {
        prompt: 'Three Bernoulli arms have success probabilities ' + tex(mu.map(dec).join(',\\ ')) + '. An algorithm made ' + tex(total) + ' pulls: ' + tex(p.cnt[0]) + ' of arm 1, ' + tex(p.cnt[1]) + ' of arm 2 and ' + tex(p.cnt[2]) + ' of arm 3. What is its expected regret ' + tex('\\sum_a N_a\\Delta_a') + '?',
        answer: regret, tolerance: tol3, lecture: 1,
        explanation: 'The best mean is ' + tex(dec(best)) + '. Each pull of arm ' + tex('a') + ' costs the gap ' + tex('\\Delta_a=\\mu^*-\\mu_a') + ', so the regret is ' + tex(mu.map((m, i) => p.cnt[i] + '\\times' + dec(best - m)).join('+') + '=' + dec(regret)) + '.',
      },
      {
        prompt: 'An arm has sample average ' + tex('Q_n=' + dec(q)) + ' after ' + tex('n=' + p.n) + ' pulls. The next pull gives reward ' + tex(p.r) + '. Use the incremental rule to find ' + tex('Q_{n+1}') + '.',
        answer: qNew, tolerance: tol3, lecture: 1,
        explanation: tex('Q_{n+1}=Q_n+\\frac{1}{n+1}(R-Q_n)=' + dec(q) + '+\\frac{' + dec(p.r - q) + '}{' + (p.n + 1) + '}=' + dec(qNew)) + '.',
      },
      {
        prompt: 'In round ' + tex('t=' + p.t) + ' of UCB1 with constant ' + tex('c=' + dec(p.c)) + ', an arm has sample mean ' + tex(dec(qa)) + ' after ' + tex('N=' + p.na) + ' pulls. Compute its index ' + tex('Q+c\\sqrt{\\ln t/N}') + '.',
        answer: ucb, tolerance: tol3, lecture: 1,
        explanation: tex('\\ln ' + p.t + '=' + dec(Math.log(p.t))) + ', so the bonus is ' + tex(dec(p.c) + '\\sqrt{' + dec(Math.log(p.t)) + '/' + p.na + '}=' + dec(ucb - qa)) + ' and the index is ' + tex(dec(ucb)) + '.',
      },
      {
        prompt: 'A Bernoulli arm has a ' + tex('\\mathrm{Beta}(' + p.a0 + ',' + p.b0 + ')') + ' prior. After ' + tex(p.s) + ' successes and ' + tex(p.f) + ' failures, what is the posterior mean of its success probability (the quantity Thompson sampling draws around)?',
        answer: post, tolerance: tol3, lecture: 1,
        explanation: 'The posterior is ' + tex('\\mathrm{Beta}(' + (p.a0 + p.s) + ',' + (p.b0 + p.f) + ')') + ', with mean ' + tex('\\frac{' + (p.a0 + p.s) + '}{' + (p.a0 + p.b0 + p.s + p.f) + '}=' + dec(post)) + '.',
      },
      {
        prompt: 'Treat the bandit with the true means above as an MDP with one state and discount ' + tex('\\gamma=' + dec(gam)) + '. The policy picks a uniformly random one of the three arms with probability ' + tex('\\epsilon=' + dec(eps)) + ' and the best arm otherwise, at every step. Find its value ' + tex('v_\\pi') + '.',
        answer: v, tolerance: tol3, lecture: 2,
        explanation: 'Expected reward per step ' + tex('\\bar r=(1-\\epsilon)\\mu^*+\\epsilon\\,\\bar\\mu=' + dec(rbar)) + '. With one state ' + tex('v=\\bar r+\\gamma v') + ', so ' + tex('v=\\bar r/(1-\\gamma)=' + dec(v)) + '.',
      },
    ],
  }
}

export const genA: LQGenerator = { id: 'rl-lq-a-bandit', generate: (rng) => build(sample(rng)) }
