import { describe, expect, it } from 'vitest'
import { gradeBlank } from '../../../../lib/blank-grader'
import { makeRng } from '../../../../lib/rng'
import { build, genLec4, sample, type Params } from './lec4'

// Independent check: a second correct answer, written by hand in another legal style (letters in another order, no
// spaces, a comment, a space after a control word, spaces around =), must pass too.
const alternatives = (P: Params) => {
  const vals = P.values.map((v) => '0.' + v)
  return [
    [...P.place].reverse().join(''),
    'l' + 'r'.repeat(P.metrics.length) + ' % names, then numbers',
    'Model&' + P.metrics.join('&') + '\\\\',
    P.models[1] + '  &  ' + vals.join('  &  ') + '  \\\\',
    '\\label {tab:' + P.slug + '}',
    '\\includegraphics[ width = ' + P.frac + '\\textwidth ]{figures/' + P.fig + '}',
  ]
}

describe('latex-lq-4 (tables and figures)', () => {
  const seeds = Array.from({ length: 200 }, (_, s) => `lec4-${s}`)

  it('every key, accept and hand-written alternative passes, every trap fails as itself, over 200 seeds', () => {
    for (const seed of seeds) {
      const P = sample(makeRng(seed))
      const inst = build(P)
      expect(inst.parts).toHaveLength(6)
      const alt = alternatives(P)
      inst.parts.forEach((p, n) => {
        expect(p.lecture).toBe(4)
        const b = p.blank!
        expect(b.mode).not.toBe('render')
        for (const a of [b.key, ...(b.accept ?? []), alt[n]]) expect(gradeBlank(a, b).correct, `${seed} part ${n}: ${a}`).toBe(true)
        for (const t of b.traps ?? []) {
          const v = gradeBlank(t.text, b)
          expect(v.correct, `${seed} part ${n} trap ${t.text}`).toBe(false)
          expect(v.trap?.text).toBe(t.text)
        }
      })
      // a wrong column order in the data row is caught
      if (P.values.length > 1) {
        const swapped = [P.models[1], ...[...P.values].reverse().map((v) => '0.' + v)].join(' & ') + ' \\\\'
        expect(gradeBlank(swapped, inst.parts[3].blank!).correct).toBe(false)
      }
    }
  })

  it('the parameters vary between seeds', () => {
    for (let n = 0; n < 6; n++) {
      const distinct = new Set(seeds.map((s) => genLec4.generate(makeRng(s)).parts[n].blank!.key))
      expect(distinct.size, `part ${n}`).toBeGreaterThanOrEqual(n === 0 ? 4 : 3)
    }
  })

  it('builds the expected keys for three fixed parameter sets', () => {
    const fixed: [Params, string[]][] = [
      [{ study: 'churn', models: ['Baseline', 'Ridge', 'Lasso'], metrics: ['AUC', 'F1'], values: [846, 781], place: 'htbp', slug: 'churn-main', fig: 'roc', frac: 0.8 },
        ['htbp', 'lrr', 'Model & AUC & F1 \\\\', 'Ridge & 0.846 & 0.781 \\\\', '\\label{tab:churn-main}', '\\includegraphics[width=0.8\\textwidth]{figures/roc}']],
      [{ study: 'volatility', models: ['Neural net', 'Random forest', 'Lasso'], metrics: ['Brier', 'Recall', 'Accuracy'], values: [612, 905, 942], place: 'tp', slug: 'vol-scores', fig: 'calibration', frac: 0.5 },
        ['tp', 'lrrr', 'Model & Brier & Recall & Accuracy \\\\', 'Random forest & 0.612 & 0.905 & 0.942 \\\\', '\\label{tab:vol-scores}', '\\includegraphics[width=0.5\\textwidth]{figures/calibration}']],
      [{ study: 'fraud detection', models: ['Ridge', 'Gradient boosting', 'Baseline'], metrics: ['Precision', 'AUC', 'F1', 'Recall'], values: [704, 755, 803, 918], place: 'tb', slug: 'fraud-results', fig: 'importance', frac: 0.9 },
        ['tb', 'lrrrr', 'Model & Precision & AUC & F1 & Recall \\\\', 'Gradient boosting & 0.704 & 0.755 & 0.803 & 0.918 \\\\', '\\label{tab:fraud-results}', '\\includegraphics[width=0.9\\textwidth]{figures/importance}']],
    ]
    for (const [P, want] of fixed) expect(build(P).parts.map((p) => p.blank!.key)).toEqual(want)
  })
})
