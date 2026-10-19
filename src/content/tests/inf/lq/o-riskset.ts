// LQ-O: randomised rules and the risk set for two parameter values: mixtures, the minimax mixture, and equal Bayes risk.
// Lecture 4 (randomised rules and the risk set).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { a: [number, number]; b: [number, number]; q: number }

export function sample(rng: Rng): Params {
  for (;;) {
    // rule A is good at theta_1 and bad at theta_2; rule B the other way round, so a minimax mixture exists
    const a: [number, number] = [rng.int(1, 4), rng.int(6, 12)]
    const b: [number, number] = [rng.int(6, 12), rng.int(1, 4)]
    if (a[0] < b[0] && b[1] < a[1]) return { a, b, q: rng.pick([0.25, 0.4, 0.5, 0.6, 0.75]) }
  }
}

export function build({ a, b, q }: Params): LQInstance {
  const mix = (p: number): [number, number] => [p * a[0] + (1 - p) * b[0], p * a[1] + (1 - p) * b[1]]
  const m = mix(q)
  // equal risks at theta_1 and theta_2: p a1 + (1-p) b1 = p a2 + (1-p) b2
  const pStar = (b[1] - b[0]) / (a[0] - a[1] - b[0] + b[1])
  const common = mix(pStar)[0]
  // prior weight w on theta_1 giving the two rules the same Bayes risk
  const w = (b[1] - a[1]) / (a[0] - a[1] - b[0] + b[1])

  return {
    intro: 'Two deterministic decision rules ' + tex('A') + ' and ' + tex('B') + ' have risk points ' + tex('(R(\\theta_1,A),R(\\theta_2,A))=(' + a[0] + ',' + a[1] + ')') + ' and ' + tex('(R(\\theta_1,B),R(\\theta_2,B))=(' + b[0] + ',' + b[1] + ')') + '. The randomised rule ' + tex('d_p') + ' uses ' + tex('A') + ' with probability ' + tex('p') + ' and ' + tex('B') + ' with probability ' + tex('1-p') + ', so its risk point lies on the segment joining the two. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the risk ' + tex('R(\\theta_1,d_p)') + ' of the randomised rule with ' + tex('p=' + dec(q)) + '.',
        answer: m[0], tolerance: tol4, lecture: 2,
        explanation: 'The risk of a randomised rule is the mixture of the risks: ' + tex(dec(q) + '\\times' + a[0] + '+' + dec(1 - q) + '\\times' + b[0]) + ' = ' + dec(m[0]) + '.',
      },
      {
        prompt: 'Find the risk ' + tex('R(\\theta_2,d_p)') + ' of the same rule.',
        answer: m[1], tolerance: tol4, lecture: 2,
        explanation: tex(dec(q) + '\\times' + a[1] + '+' + dec(1 - q) + '\\times' + b[1]) + ' = ' + dec(m[1]) + '.',
      },
      {
        prompt: 'Find the probability ' + tex('p^*') + ' for which ' + tex('R(\\theta_1,d_p)=R(\\theta_2,d_p)') + ' (the point where the segment meets the line ' + tex('x=y') + ').',
        answer: pStar, tolerance: tol4, lecture: 2,
        explanation: 'Set ' + tex('pa_1+(1-p)b_1=pa_2+(1-p)b_2') + ': ' + tex('p^*=\\dfrac{b_2-b_1}{a_1-a_2-b_1+b_2}=\\dfrac{' + (b[1] - b[0]) + '}{' + (a[0] - a[1] - b[0] + b[1]) + '}') + ' = ' + dec(pStar) + '.',
      },
      {
        prompt: 'Find the common risk at ' + tex('p^*') + '. This is the largest risk of the minimax rule among the mixtures of ' + tex('A') + ' and ' + tex('B') + '.',
        answer: common, tolerance: tol4, lecture: 2,
        explanation: tex(dec(pStar) + '\\times' + a[0] + '+' + dec(1 - pStar) + '\\times' + b[0]) + ' = ' + dec(common) + '. Each of the rules ' + tex('A,B') + ' alone has a larger maximum risk (' + Math.max(...a) + ' and ' + Math.max(...b) + ').',
      },
      {
        prompt: 'For a prior with weights ' + tex('w') + ' on ' + tex('\\theta_1') + ' and ' + tex('1-w') + ' on ' + tex('\\theta_2') + ', the Bayes risk of a rule is ' + tex('wR(\\theta_1,\\cdot)+(1-w)R(\\theta_2,\\cdot)') + '. Find the value of ' + tex('w') + ' at which ' + tex('A') + ' and ' + tex('B') + ' have the same Bayes risk.',
        answer: w, tolerance: tol4, lecture: 2,
        explanation: 'Set ' + tex('wa_1+(1-w)a_2=wb_1+(1-w)b_2') + ': ' + tex('w=\\dfrac{b_2-a_2}{a_1-a_2-b_1+b_2}=\\dfrac{' + (b[1] - a[1]) + '}{' + (a[0] - a[1] - b[0] + b[1]) + '}') + ' = ' + dec(w) + '. At this prior the line ' + tex('wx+(1-w)y=c') + ' touches the risk set along the whole segment, so every ' + tex('d_p') + ' has this same Bayes risk.',
      },
    ],
  }
}

export const genO: LQGenerator = { id: 'inf-lq-o-riskset', generate: (rng) => build(sample(rng)) }
