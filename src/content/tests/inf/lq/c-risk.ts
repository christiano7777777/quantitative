// LQ-C: decision theory for a normal mean under squared error: risk functions of shrinkage and randomised rules, comparison with the sample mean, and the best linear rule on a bounded parameter space.
// Lectures 5 (decision theory) and 6 (minimax rules).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { s2: number; n: number; a: number; theta1: number; p: number; m: number }

export function sample(rng: Rng): Params {
  return { s2: rng.pick([4, 9, 16]), n: rng.pick([4, 8, 16]), a: rng.pick([0.5, 0.6, 0.75, 0.8]), theta1: rng.pick([1, 1.5, 2]), p: rng.pick([0.25, 0.5, 0.75]), m: rng.pick([1, 2, 3]) }
}

export function build({ s2, n, a, theta1, p, m }: Params): LQInstance {
  const v = s2 / n
  const rRand = p * v + (1 - p) * theta1 ** 2
  const rA = a * a * v + (1 - a) ** 2 * theta1 ** 2
  const star = Math.sqrt((v * (1 + a)) / (1 - a))
  const maxR = a * a * v + (1 - a) ** 2 * m * m
  const aStar = (m * m) / (m * m + v)

  return {
    intro: 'Let ' + tex('\\bar X\\sim N(\\theta,v)') + ' with ' + tex('v=\\sigma^2/n=' + s2 + '/' + n + '=' + dec(v)) + ' and squared error loss ' + tex('(d-\\theta)^2') + '. Consider the rules ' + tex('\\delta_a=a\\bar X') + ' with ' + tex('a=' + a) + ', the sample mean ' + tex('\\delta_1=\\bar X') + ', and the randomised rule that uses ' + tex('\\bar X') + ' with probability ' + tex(p) + ' and otherwise the constant estimate ' + tex('0') + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the risk of the randomised rule at ' + tex('\\theta=' + theta1) + '.',
        answer: rRand, tolerance: tol4, lecture: 5,
        explanation: 'The risk is the mixture of the two risks: ' + tex(p + '\\cdot v+' + dec(1 - p) + '\\cdot\\theta^2=' + dec(p * v) + '+' + dec((1 - p) * theta1 ** 2) + '=' + dec(rRand)) + '.',
      },
      {
        prompt: 'Find the risk of ' + tex('\\delta_a') + ' at ' + tex('\\theta=' + theta1) + '. (Variance plus squared bias.)',
        answer: rA, tolerance: tol4, lecture: 5,
        explanation: tex('\\mathrm{Var}=a^2v=' + dec(a * a * v)) + ' and ' + tex('\\mathrm{bias}^2=(1-a)^2\\theta^2=' + dec((1 - a) ** 2 * theta1 ** 2)) + ', total ' + dec(rA) + '. For comparison, the risk of ' + tex('\\bar X') + ' is ' + dec(v) + '.',
      },
      {
        prompt: tex('\\delta_a') + ' has smaller risk than ' + tex('\\bar X') + ' exactly when ' + tex('|\\theta|<\\theta^*') + '. Find ' + tex('\\theta^*') + '.',
        answer: star, tolerance: tol4, lecture: 5,
        explanation: tex('a^2v+(1-a)^2\\theta^2<v') + ' iff ' + tex('\\theta^2<v(1+a)/(1-a)=' + dec((v * (1 + a)) / (1 - a))) + ', so ' + tex('\\theta^*=' + dec(star)) + '. Neither rule dominates the other, so ' + tex('\\bar X') + ' is not made inadmissible by ' + tex('\\delta_a') + '.',
      },
      {
        prompt: 'If it is known that ' + tex('|\\theta|\\le' + m) + ', find the maximum over this range of the risk of ' + tex('\\delta_a') + '.',
        answer: maxR, tolerance: tol4, lecture: 6,
        explanation: 'The risk ' + tex('a^2v+(1-a)^2\\theta^2') + ' increases in ' + tex('|\\theta|') + ', so the maximum is at ' + tex('|\\theta|=' + m) + ': ' + tex(dec(a * a * v) + '+' + dec((1 - a) ** 2) + '\\cdot' + m * m + '=' + dec(maxR)) + '.',
      },
      {
        prompt: 'Among rules ' + tex('\\delta_c=c\\bar X') + ', which ' + tex('c') + ' has the smallest maximum risk over ' + tex('|\\theta|\\le' + m) + '? (This is the minimax rule within the linear class.)',
        answer: aStar, tolerance: tol4, lecture: 6,
        explanation: 'Minimise ' + tex('c^2v+(1-c)^2m^2') + ': setting the derivative to zero gives ' + tex('c=m^2/(m^2+v)=' + m * m + '/(' + m * m + '+' + dec(v) + ')=' + dec(aStar)) + '. The maximum risk is then ' + tex('vm^2/(m^2+v)=' + dec((v * m * m) / (m * m + v))) + ', below that of ' + tex('\\bar X') + '.',
      },
    ],
  }
}

export const genC: LQGenerator = { id: 'inf-lq-c-risk', generate: (rng) => build(sample(rng)) }
