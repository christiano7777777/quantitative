// bay lecture 10 (nonparametric Bayes): one story. A Dirichlet process with concentration alpha seen through the Chinese restaurant process:
// the probabilities that the next customer sits at a new or an existing table, the expected number of tables, and stick-breaking weights.
// Lecture 10.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { alpha: number; tables: number[]; v: [number, number, number] }

export function sample(rng: Rng): Params {
  const tables = rng.pick([[4, 2, 1], [3, 3, 1], [5, 2, 1], [3, 2, 2]])
  return { alpha: rng.pick([1, 2, 3]), tables, v: [rng.pick([0.2, 0.3, 0.4]), rng.pick([0.4, 0.5, 0.6]), rng.pick([0.3, 0.5, 0.7])] }
}

export function build({ alpha, tables, v }: Params): LQInstance {
  const n = tables.reduce((a, b) => a + b, 0)
  const pNew = alpha / (alpha + n)
  const pJoin1 = tables[0] / (alpha + n)
  let ek = 0
  for (let i = 1; i <= n; i++) ek += alpha / (alpha + i - 1)
  const w3 = v[2] * (1 - v[0]) * (1 - v[1])
  const w1mean = 1 / (1 + alpha)

  return {
    intro: 'A restaurant seats customers by the Chinese restaurant process with concentration ' + tex('\\alpha=' + alpha) + ': when ' + tex('m') + ' customers are seated, the next one joins an occupied table with ' + tex('n_k') + ' people with probability ' + tex('n_k/(\\alpha+m)') + ' and starts a new table with probability ' + tex('\\alpha/(\\alpha+m)') + '. Currently ' + tex(n) + ' customers occupy three tables of sizes ' + tex(tables.join(',\\ ')) + '. Give answers to 4 decimal places unless told otherwise.',
    parts: [
      {
        prompt: 'Find the probability that the next customer starts a new table.',
        answer: pNew, tolerance: tol4, lecture: 10,
        explanation: tex(alpha + '/(' + alpha + '+' + n + ')') + ' = ' + dec(pNew) + '. In the Dirichlet process this is the weight of the base distribution in the posterior predictive.',
      },
      {
        prompt: 'Find the probability that the next customer joins the first table (size ' + tex(tables[0]) + ').',
        answer: pJoin1, tolerance: tol4, lecture: 10,
        explanation: tex(tables[0] + '/(' + alpha + '+' + n + ')') + ' = ' + dec(pJoin1) + '. Bigger tables attract more customers: the rich get richer.',
      },
      {
        prompt: 'The expected number of tables after ' + tex(n) + ' customers is ' + tex('\\sum_{i=1}^n\\alpha/(\\alpha+i-1)') + '. Find it.',
        answer: ek, tolerance: tol4, lecture: 10,
        explanation: 'The ' + tex('i') + 'th customer starts a new table with probability ' + tex('\\alpha/(\\alpha+i-1)') + '; adding for ' + tex('i=1,\\dots,' + n) + ' gives ' + dec(ek) + '. It grows like ' + tex('\\alpha\\ln n') + ': the number of clusters is not fixed in advance.',
      },
      {
        prompt: 'In the stick-breaking construction ' + tex('w_k=v_k\\prod_{j<k}(1-v_j)') + ' with ' + tex('v_k\\sim\\mathrm{Beta}(1,\\alpha)') + '. For ' + tex('v_1=' + dec(v[0]) + ',\\ v_2=' + dec(v[1]) + ',\\ v_3=' + dec(v[2])) + ', find the third weight ' + tex('w_3') + '.',
        answer: w3, tolerance: tol4, lecture: 10,
        explanation: tex(dec(v[2]) + '\\times(1-' + dec(v[0]) + ')\\times(1-' + dec(v[1]) + ')') + ' = ' + dec(w3) + '.',
      },
      {
        prompt: 'Find the expected value of the first stick-breaking weight, ' + tex('E[v_1]=1/(1+\\alpha)') + ' for ' + tex('v_1\\sim\\mathrm{Beta}(1,\\alpha)') + '.',
        answer: w1mean, tolerance: tol4, lecture: 10,
        explanation: tex('1/(1+' + alpha + ')') + ' = ' + dec(w1mean) + '. A small ' + tex('\\alpha') + ' puts most mass on the first atom (few clusters); a large ' + tex('\\alpha') + ' spreads it over many.',
      },
    ],
  }
}

export const genLec10: LQGenerator = { id: 'bay-lq-lec10', generate: (rng) => build(sample(rng)) }
