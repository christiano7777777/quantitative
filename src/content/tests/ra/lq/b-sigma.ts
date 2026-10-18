// LQ-B: sigma-algebras on a finite set: atoms, size of a generated sigma-algebra, measures of its sets, and a test of five families.
// Lecture 2 (sigma-algebras and measurable sets); the weighted counting measure also touches lecture 4.
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { tex, tolInt } from '../../../shared/format'

export interface Params { n: number; gens: number[]; w: number[]; point: number; t: number; fams: number[][] }

const FAM_N = 4
const FULL4 = (1 << FAM_N) - 1

const bits = (mask: number, n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((i) => mask & (1 << (i - 1)))
const setTex = (mask: number, n: number) => (mask === 0 ? '\\emptyset' : mask === (1 << n) - 1 ? '\\Omega' : '\\{' + bits(mask, n).join(',') + '\\}')
const popcount = (x: number) => { let c = 0; while (x) { c += x & 1; x >>= 1 } return c }

/** All unions of the blocks of a partition of {1..n}, given as a label per point. */
function fromPartition(labels: number[]): number[] {
  const k = Math.max(...labels) + 1
  const out: number[] = []
  for (let s = 0; s < 1 << k; s++) {
    let m = 0
    for (let i = 0; i < labels.length; i++) if (s & (1 << labels[i])) m |= 1 << i
    out.push(m)
  }
  return out
}

/** Direct check of the definition on a finite set: contains the whole set, closed under complement and pairwise union. */
function isSigma(fam: number[], full: number): boolean {
  const s = new Set(fam)
  if (!s.has(full)) return false
  for (const a of fam) {
    if (!s.has(full ^ a)) return false
    for (const b of fam) if (!s.has(a | b)) return false
  }
  return true
}

export function sample(rng: Rng): Params {
  const n = rng.int(7, 9)
  const full = (1 << n) - 1
  const gens = [rng.int(1, full - 1), rng.int(1, full - 1), rng.int(1, full - 1)]
  const w = Array.from({ length: n }, () => rng.int(1, 5))
  const total = w.reduce((s, x) => s + x, 0)
  const fams: number[][] = []
  for (let f = 0; f < 5; f++) {
    const labels = Array.from({ length: FAM_N }, () => rng.int(0, 2))
    // relabel so that labels are 0..k-1 without gaps
    const used = [...new Set(labels)].sort((x, y) => x - y)
    let fam = fromPartition(labels.map((l) => used.indexOf(l)))
    const kind = rng.int(0, 2)
    if (kind === 1) {
      const drop = rng.pick(fam)
      fam = fam.filter((x) => x !== drop)
    } else if (kind === 2) {
      const other = fromPartition(Array.from({ length: FAM_N }, () => rng.int(0, 1)))
      fam = [...new Set([...fam, ...other])]
    }
    fams.push(fam.sort((x, y) => popcount(x) - popcount(y) || x - y))
  }
  return { n, gens, w, point: rng.int(1, n), t: rng.int(Math.floor(total / 3), Math.floor((2 * total) / 3)), fams }
}

export function build({ n, gens, w, point, t, fams }: Params): LQInstance {
  // atoms: points with the same membership pattern in every generating set
  const sig = (i: number) => gens.map((g) => (g & (1 << i) ? 1 : 0)).join('')
  const groups = new Map<string, number>()
  for (let i = 0; i < n; i++) groups.set(sig(i), (groups.get(sig(i)) ?? 0) | (1 << i))
  const atoms = [...groups.values()]
  const k = atoms.length
  const weight = (mask: number) => bits(mask, n).reduce((s, i) => s + w[i - 1], 0)
  const atomOf = atoms.find((a) => a & (1 << (point - 1)))!
  // number of unions of atoms of measure at least t, by recursion over the atoms
  const countAtLeast = (idx: number, acc: number): number => (idx === k ? (acc >= t ? 1 : 0) : countAtLeast(idx + 1, acc) + countAtLeast(idx + 1, acc + weight(atoms[idx])))
  const nSets = countAtLeast(0, 0)
  const nSigma = fams.filter((f) => isSigma(f, FULL4)).length

  const gtext = gens.map((g, i) => tex('G_' + (i + 1) + '=' + setTex(g, n))).join(', ')
  const wtext = tex('(' + w.join(',') + ')')

  return {
    intro: 'Let ' + tex('\\Omega=\\{1,\\dots,' + n + '\\}') + ' and let ' + tex('\\mathcal F=\\sigma(G_1,G_2,G_3)') + ' be the smallest ' + tex('\\sigma') + '-algebra containing ' + gtext + '. Let ' + tex('\\mu') + ' be the measure on all subsets with ' + tex('\\mu(\\{i\\})=w_i') + ' with ' + tex('(w_1,\\dots,w_{' + n + '})=') + wtext + '. All answers are whole numbers.',
    parts: [
      {
        prompt: 'The atoms of ' + tex('\\mathcal F') + ' are its minimal nonempty sets. How many atoms does ' + tex('\\mathcal F') + ' have? (Two points lie in the same atom exactly when no ' + tex('G_i') + ' separates them.)',
        answer: k, tolerance: tolInt, lecture: 2,
        explanation: 'Group the points by membership in ' + tex('G_1,G_2,G_3') + ': the groups are ' + atoms.map((a) => tex(setTex(a, n))).join(', ') + ', so there are ' + tex(String(k)) + ' atoms.',
      },
      {
        prompt: 'How many sets belong to ' + tex('\\mathcal F') + ' (counting ' + tex('\\emptyset') + ' and ' + tex('\\Omega') + ')?',
        answer: 2 ** k, tolerance: tolInt, lecture: 2,
        explanation: 'Every member of ' + tex('\\mathcal F') + ' is a union of atoms, and every union of atoms belongs to ' + tex('\\mathcal F') + ', so ' + tex('|\\mathcal F|=2^{' + k + '}=' + 2 ** k) + '.',
      },
      {
        prompt: 'Find ' + tex('\\mu(A)') + ' for the smallest set ' + tex('A\\in\\mathcal F') + ' that contains the point ' + tex(String(point)) + '.',
        answer: weight(atomOf), tolerance: tolInt, lecture: 2,
        explanation: 'The smallest member of ' + tex('\\mathcal F') + ' containing ' + tex(String(point)) + ' is its atom ' + tex(setTex(atomOf, n)) + ', of measure ' + tex(String(weight(atomOf))) + '.',
      },
      {
        prompt: 'How many sets ' + tex('E\\in\\mathcal F') + ' have ' + tex('\\mu(E)\\ge' + t) + '?',
        answer: nSets, tolerance: tolInt, lecture: 4,
        explanation: 'Each ' + tex('E') + ' is a union of atoms. The atom weights are ' + tex('(' + atoms.map((a) => weight(a)).join(',') + ')') + '; counting the unions with total at least ' + tex(String(t)) + ' gives ' + tex(String(nSets)) + '.',
      },
      {
        prompt: 'Let ' + tex('\\Omega_0=\\{1,2,3,4\\}') + '. How many of the following five families of subsets of ' + tex('\\Omega_0') + ' are ' + tex('\\sigma') + '-algebras? ' + fams.map((f, i) => tex('\\mathcal G_' + (i + 1) + '=\\{' + f.map((m) => setTex(m, FAM_N)).join(',') + '\\}')).join('; '),
        answer: nSigma, tolerance: tolInt, lecture: 2,
        explanation: 'A family is a ' + tex('\\sigma') + '-algebra when it contains ' + tex('\\Omega_0') + ' and is closed under complements and unions (finite suffices on a finite set). Checking each family gives ' + tex(String(nSigma)) + ' valid ones.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'ra-lq-b-sigma', generate: (rng) => build(sample(rng)) }
