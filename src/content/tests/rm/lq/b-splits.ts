// LQ-B: survivorship bias in average returns, and the arithmetic of walk-forward splits with a purge and an embargo.
// Lectures 2 (data and leakage) and 3 (train/validation/test design).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3, tolInt } from '../../../shared/format'

export interface Params { surv: number; rs: number; rd: number; T: number; train: number; test: number; k: number; h: number; emb: number } // surv in %, returns in tenths of a percent

export function sample(rng: Rng): Params {
  const train = rng.pick([36, 48, 60]), test = rng.pick([6, 12])
  return { surv: rng.pick([60, 70, 75, 80, 90]), rs: rng.int(60, 140), rd: rng.int(-120, 20), T: train + test * rng.int(3, 7) + rng.int(0, test - 1), train, test, k: 3, h: rng.pick([5, 10, 21]), emb: rng.pick([2, 5]) }
}

export function build({ surv, rs, rd, T, train, test, k, h, emb }: Params): LQInstance {
  const s = surv / 100
  const all = s * (rs / 10) + (1 - s) * (rd / 10)
  const bias = rs / 10 - all
  let folds = 0
  for (let end = train; end + test <= T; end += test) folds++
  const trainK = train + (k - 1) * test
  const oos = folds * test
  const purged = h + emb

  return {
    intro: 'Give answers to 3 decimal places unless told otherwise. Returns are in per cent per year.',
    parts: [
      {
        prompt: 'A database holds only funds that survived; they are ' + tex(surv + '\\%') + ' of all funds started, with average return ' + tex(dec(rs / 10) + '\\%') + '. The funds that closed averaged ' + tex(dec(rd / 10) + '\\%') + '. Find the average return of all funds started.',
        answer: all, tolerance: tol3, lecture: 2,
        explanation: tex(dec(s) + '\\cdot' + dec(rs / 10) + '+' + dec(1 - s) + '\\cdot' + dec(rd / 10)) + ' = ' + dec(all) + '.',
      },
      {
        prompt: 'Find the survivorship bias: the average over survivors minus the average over all funds started.',
        answer: bias, tolerance: tol3, lecture: 2,
        explanation: tex(dec(rs / 10) + '-' + dec(all)) + ' = ' + dec(bias) + ' percentage points per year.',
      },
      {
        prompt: 'A walk-forward test uses ' + tex(T) + ' months of data. The first training window is ' + tex(train) + ' months, each test window is ' + tex(test) + ' months, and the window advances by ' + tex(test) + ' months, as long as a full test window fits. How many test windows (folds) are there?',
        answer: folds, tolerance: tolInt, lecture: 3,
        explanation: tex('\\lfloor(' + T + '-' + train + ')/' + test + '\\rfloor') + ' = ' + folds + ' full test windows.',
      },
      {
        prompt: 'With an expanding window, how many months does the training set of fold ' + tex(k) + ' contain?',
        answer: trainK, tolerance: tolInt, lecture: 3,
        explanation: tex(train + '+(' + k + '-1)\\cdot' + test) + ' = ' + trainK + '.',
      },
      {
        prompt: 'Labels are returns over the next ' + tex(h) + ' days, and an embargo of ' + tex(emb) + ' days is applied. How many training observations immediately before the test fold must be removed (purge ' + tex(h) + ' plus embargo ' + tex(emb) + ' days)?',
        answer: purged, tolerance: tolInt, lecture: 3,
        explanation: 'Observations whose label windows overlap the test start (the last ' + tex(h) + ') are purged, plus the ' + tex(emb) + ' embargo days: ' + purged + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'rm-lq-b-splits', generate: (rng) => build(sample(rng)) }
