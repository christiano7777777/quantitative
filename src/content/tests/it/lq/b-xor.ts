// LQ-B: information diagram of X, Y and Z = X xor Y (independent Bernoulli X and Y).
// Lectures 2 (information measures) and 3 (the I-measure, a negative three-way atom).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol3 } from '../../../shared/format'

export interface Params { p: number; q: number }

export function sample(rng: Rng): Params {
  const p = rng.int(1, 9) / 20
  let q = rng.int(1, 9) / 20
  if (q === p) q = p === 0.45 ? 0.4 : p + 0.05
  return { p, q }
}

const lg = Math.log2
const h = (x: number) => -x * lg(x) - (1 - x) * lg(1 - x)

export function build({ p, q }: Params): LQInstance {
  const z = p * (1 - q) + q * (1 - p)
  const hz = h(z)
  const hp = h(p)
  const hq = h(q)
  const ixz = hz - hq
  const ixyGz = hp + hq - hz
  const triple = -ixyGz
  const ixzGy = hp
  return {
    intro: tex('X\\sim\\mathrm{Bernoulli}(' + dec(p) + ')') + ' and ' + tex('Y\\sim\\mathrm{Bernoulli}(' + dec(q) + ')') + ' are independent, and ' + tex('Z=X\\oplus Y') + ' (addition modulo 2). Let ' + tex('h(t)=-t\\log_2 t-(1-t)\\log_2(1-t)') + '. Give each answer in bits to 3 decimal places.',
    parts: [
      {
        prompt: 'Find ' + tex('H(Z)') + '.',
        answer: hz, tolerance: tol3, lecture: 2,
        explanation: tex('P(Z=1)=' + dec(p) + '\\cdot' + dec(1 - q) + '+' + dec(1 - p) + '\\cdot' + dec(q) + '=' + dec(z)) + ', so ' + tex('H(Z)=h(' + dec(z) + ')=' + dec(hz)) + '.',
      },
      {
        prompt: 'Find the mutual information ' + tex('I(X;Z)') + '.',
        answer: ixz, tolerance: tol3, lecture: 2,
        explanation: 'Given ' + tex('X') + ', ' + tex('Z') + ' is ' + tex('Y') + ' shifted, so ' + tex('H(Z|X)=H(Y)=h(' + dec(q) + ')=' + dec(hq)) + ' and ' + tex('I(X;Z)=H(Z)-H(Z|X)=' + dec(hz) + '-' + dec(hq) + '=' + dec(ixz)) + '.',
      },
      {
        prompt: 'Find the conditional mutual information ' + tex('I(X;Y|Z)') + '.',
        answer: ixyGz, tolerance: tol3, lecture: 3,
        explanation: 'Given ' + tex('Y') + ' and ' + tex('Z') + ', ' + tex('X') + ' is determined, so ' + tex('H(X|Y,Z)=0') + ': ' + tex('I(X;Y|Z)=H(X|Z)-H(X|Y,Z)=H(X,Y)-H(Z)-0=' + dec(hp) + '+' + dec(hq) + '-' + dec(hz) + '=' + dec(ixyGz)) + '.',
      },
      {
        prompt: 'In the information diagram, find the three-way atom ' + tex('\\mu^*(\\tilde X\\cap\\tilde Y\\cap\\tilde Z)=I(X;Y;Z)') + '. (It can be negative.)',
        answer: triple, tolerance: tol3, lecture: 3,
        explanation: tex('X') + ' and ' + tex('Y') + ' are independent, so ' + tex('I(X;Y)=0') + ' and ' + tex('I(X;Y;Z)=I(X;Y)-I(X;Y|Z)=0-' + dec(ixyGz) + '=' + dec(triple)) + '.',
      },
      {
        prompt: 'Find the atom ' + tex('\\mu^*(\\tilde X\\cap\\tilde Z\\setminus\\tilde Y)=I(X;Z|Y)') + '.',
        answer: ixzGy, tolerance: tol3, lecture: 3,
        explanation: 'Given ' + tex('Y') + ', ' + tex('Z') + ' is a one-to-one function of ' + tex('X') + ', so ' + tex('I(X;Z|Y)=H(X|Y)-H(X|Y,Z)=H(X)-0=h(' + dec(p) + ')=' + dec(ixzGy)) + '.',
      },
    ],
  }
}

export const genB: LQGenerator = { id: 'it-lq-b-xor', generate: (rng) => build(sample(rng)) }
