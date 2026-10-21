import { describe, expect, it } from 'vitest'
import { BOX, typed } from '../content/shared/typed'
import { checkBlankBank, containsKey } from './blank-bank'
import type { Rng } from './rng'
import type { BlankQuestion, LQGenerator, TestBank } from './types'

// A small fixture topic "fix" with 2 lectures; render mode is not allowed in it (RENDER_LECTURES has no entry), so the
// render fixtures use the topic id "latex" (lectures 2, 3 and 7).
const q = (id: string, lecture: number, extra: Partial<BlankQuestion> = {}): BlankQuestion => ({
  id, lecture, kind: 'template', prompt: 'Which package gives the rules `\\toprule` and `\\midrule`?', template: '\\usepackage{' + BOX + '}',
  blank: { mode: 'tokens', key: 'booktabs', traps: [{ text: 'array', misconception: 'array adds column types, not rules' }] },
  explanation: 'booktabs provides \\toprule, \\midrule and \\bottomrule.', ...extra,
})

const gen: LQGenerator = {
  id: 'fix-lq',
  generate: (rng: Rng) => {
    const n = rng.pick([2, 3, 4])
    return {
      intro: 'A table with one text column and ' + n + ' numeric columns.',
      parts: [typed({
        prompt: 'Complete the column specification (text left, numbers right).', lecture: 1, explanation: 'One l, then one r per numeric column.',
        view: { kind: 'template', template: '\\begin{tabular}{' + BOX + '}' },
        blank: { mode: 'tokens', key: 'l' + 'r'.repeat(n), traps: [{ text: 'l' + 'c'.repeat(n), misconception: 'numbers line up on the right' }] },
      })],
    }
  },
}

const bank = (blanks: BlankQuestion[], lq: LQGenerator[] = [gen]): TestBank => ({ mc: [], blanks, lq })
const good = () => [q('a1', 1), q('a2', 1), q('b1', 2), q('b2', 2)]
const problems = (b: TestBank, topic = 'fix') => checkBlankBank(topic, b, 2, 2)

describe('checkBlankBank', () => {
  it('passes a well-formed bank', () => expect(problems(bank(good()))).toEqual([]))

  const cases: [string, (bs: BlankQuestion[]) => TestBank, RegExp][] = [
    ['duplicate ids', (bs) => bank([...bs, q('a1', 2)]), /duplicate ids a1/],
    ['too few per lecture', (bs) => bank(bs.slice(1)), /lecture 1 has 1 short questions/],
    ['lecture out of range', (bs) => bank([...bs, q('c1', 3)]), /lecture 3 out of range/],
    ['mixed bank', (bs) => ({ ...bank(bs), mc: [{ id: 'm', lecture: 1, stem: 's', correct: [], distractors: [], explanation: 'x' }] }), /no MC/],
    ['unknown mode', (bs) => bank([...bs, q('c1', 1, { blank: { mode: 'regex' as never, key: 'x' } })]), /unknown mode/],
    ['render outside the allowed lectures', (bs) => bank([...bs, q('c1', 1, { kind: 'picture', template: undefined, picture: 'x^2', blank: { mode: 'render', key: 'x^2' } })]), /render mode is not allowed/],
    ['a trap equal to the key', (bs) => bank([...bs, q('c1', 1, { blank: { mode: 'tokens', key: 'booktabs', traps: [{ text: ' booktabs', misconception: 'wrong wrong' }] } })]), /right answer is rejected/],
    ['an accept that fails', (bs) => bank([...bs, q('c1', 1, { blank: { mode: 'tokens', key: 'booktabs', accept: ['{booktabs'] } })]), /cannot be read/],
    ['a trap without misconception', (bs) => bank([...bs, q('c1', 1, { blank: { mode: 'tokens', key: 'booktabs', traps: [{ text: 'array', misconception: '' }] } })]), /without a misconception/],
    ['template with two boxes', (bs) => bank([...bs, q('c1', 1, { template: BOX + BOX })]), /exactly one box, has 2/],
    ['template with no box', (bs) => bank([...bs, q('c1', 1, { template: '\\usepackage{}' })]), /exactly one box, has 0/],
    ['picture that does not render', (bs) => bank([...bs, q('c1', 1, { kind: 'picture', template: undefined, picture: '\\frac{', blank: { mode: 'tokens', key: 'x' } })]), /picture does not render/],
    ['fix whose broken line is right', (bs) => bank([...bs, q('c1', 1, { kind: 'fix', template: undefined, broken: '\\usepackage{booktabs}', blank: { mode: 'tokens', key: '\\usepackage{booktabs}' } })]), /already accepted/],
    ['exact with maths', (bs) => bank([...bs, q('c1', 1, { blank: { mode: 'exact', key: '$x$' } })]), /must not contain LaTeX maths/],
    ['exact with a space', (bs) => bank([...bs, q('c1', 1, { blank: { mode: 'exact', key: 'git add' } })]), /needs multiWord/],
    ['set with hyperref in a list', (bs) => bank([...bs, q('c1', 1, { blank: { mode: 'set', key: '\\usepackage{hyperref,cleveref}' } })]), /load order/],
    ['key in the prompt', (bs) => bank([...bs, q('c1', 1, { prompt: 'Load `booktabs` here.' })]), /prompt contains the answer booktabs/],
    ['control character (lost backslash)', (bs) => bank([...bs, q('c1', 1, { explanation: 'use \textbf for bold text' })]), /control character/],
    ['unbalanced $', (bs) => bank([...bs, q('c1', 1, { prompt: 'Costs $5 here.' })]), /unbalanced \$/],
    ['typed part with a numeric answer', (bs) => bank(bs, [{ id: 'g', generate: (r) => { const i = gen.generate(r); return { ...i, parts: i.parts.map((p) => ({ ...p, answer: 1 })) } } }]), /answer NaN/],
    ['typed part lecture out of range', (bs) => bank(bs, [{ id: 'g', generate: (r) => { const i = gen.generate(r); return { ...i, parts: i.parts.map((p) => ({ ...p, lecture: 9 })) } } }]), /lecture 9 out of range/],
  ]
  it.each(cases)('flags %s', (_name, make, re) => {
    const ps = problems(make(good()))
    expect(ps.some((p) => re.test(p)), ps.join('\n')).toBe(true)
  })

  it('render mode is fine in an allowed lecture and catches a prompt that shows the answer', () => {
    const r = (extra: Partial<BlankQuestion>) => q('r1', 2, { kind: 'picture', template: undefined, picture: 'x^{10}', prompt: 'Type the code for this formula.', blank: { mode: 'render', key: 'x^{10}', traps: [{ text: 'x^10', misconception: 'only the 1 is raised' }] }, ...extra })
    const base = [q('a1', 1), q('a2', 1), q('b1', 2), q('b2', 2)]
    expect(checkBlankBank('latex', bank([...base, r({})]), 2, 2)).toEqual([])
    const ps = checkBlankBank('latex', bank([...base, r({ prompt: 'Type $x^{1 0}$.' })]), 2, 2)
    expect(ps.some((p) => /shows the answer/.test(p)), ps.join('\n')).toBe(true)
  })
})

describe('containsKey', () => {
  it('matches whole tokens of 3 or more characters only', () => {
    expect(containsKey('use booktabs here', 'booktabs')).toBe(true)
    expect(containsKey('use booktabsx here', 'booktabs')).toBe(false)
    expect(containsKey('placement h', 'h')).toBe(false)
    expect(containsKey('write \\toprule', '\\toprule')).toBe(true)
    expect(containsKey('write \\topruled', '\\toprule')).toBe(false)
  })
})
