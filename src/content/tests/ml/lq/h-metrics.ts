// LQ-H: evaluating a scorer on eight labelled examples: AUC, precision, recall, F1 and accuracy at a threshold.
// Lecture 11 (evaluation: ROC/AUC, precision and recall).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { scores: number[]; labels: number[]; thr: number }

export function sample(rng: Rng): Params {
  for (;;) {
    const scores = rng.sample(Array.from({ length: 98 }, (_, i) => i + 1), 8)
    const labels: number[] = scores.map(() => (rng.next() < 0.4 ? 1 : 0))
    const pos = labels.reduce((a, b) => a + b, 0)
    const thr = rng.pick([30, 40, 50, 60, 70])
    const pred = scores.filter((s) => s >= thr).length
    const tp = scores.filter((s, i) => s >= thr && labels[i] === 1).length
    if (pos >= 2 && pos <= 5 && pred >= 2 && tp >= 1) return { scores, labels, thr }
  }
}

export function build({ scores, labels, thr }: Params): LQInstance {
  const P = labels.reduce((a, b) => a + b, 0), N = 8 - P
  let wins = 0
  scores.forEach((s, i) => scores.forEach((t, j) => { if (labels[i] === 1 && labels[j] === 0) wins += s > t ? 1 : 0 }))
  const auc = wins / (P * N)
  const T = thr / 100
  const pred = scores.map((s) => (s / 100 >= T ? 1 : 0))
  const tp = pred.filter((p, i) => p === 1 && labels[i] === 1).length
  const fp = pred.filter((p, i) => p === 1 && labels[i] === 0).length
  const fn = pred.filter((p, i) => p === 0 && labels[i] === 1).length
  const prec = tp / (tp + fp), rec = tp / (tp + fn)
  const f1 = (2 * prec * rec) / (prec + rec)
  const acc = (8 - fp - fn) / 8

  return {
    intro: 'A classifier gives scores ' + tex(scores.map((s) => dec(s / 100)).join(',')) + ' to eight examples with true labels ' + tex(labels.join(',')) + ' (1 = positive). Predict positive when the score is at least ' + tex(dec(T)) + '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find the AUC: the proportion of (positive, negative) pairs in which the positive example has the higher score.',
        answer: auc, tolerance: tol4, lecture: 11,
        explanation: tex(wins + '/(' + P + '\\cdot' + N + ')') + ' = ' + dec(auc) + '.',
      },
      {
        prompt: 'Find the precision at the threshold: true positives divided by predicted positives.',
        answer: prec, tolerance: tol4, lecture: 11,
        explanation: 'TP = ' + tp + ', FP = ' + fp + ', so ' + tex(tp + '/' + (tp + fp)) + ' = ' + dec(prec) + '.',
      },
      {
        prompt: 'Find the recall at the threshold: true positives divided by actual positives.',
        answer: rec, tolerance: tol4, lecture: 11,
        explanation: 'FN = ' + fn + ', so ' + tex(tp + '/' + (tp + fn)) + ' = ' + dec(rec) + '.',
      },
      {
        prompt: 'Find the F1 score, the harmonic mean ' + tex('2PR/(P+R)') + ' of precision and recall.',
        answer: f1, tolerance: tol4, lecture: 11,
        explanation: tex('2\\cdot' + dec(prec) + '\\cdot' + dec(rec) + '/(' + dec(prec) + '+' + dec(rec) + ')') + ' = ' + dec(f1) + '.',
      },
      {
        prompt: 'Find the accuracy at the threshold, and compare it with the accuracy ' + tex(dec(Math.max(P, N) / 8)) + ' of always predicting the majority class.',
        answer: acc, tolerance: tol4, lecture: 11,
        explanation: 'Correct predictions: ' + (8 - fp - fn) + ' of 8, so ' + dec(acc) + '.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'ml-lq-h-metrics', generate: (rng) => build(sample(rng)) }
