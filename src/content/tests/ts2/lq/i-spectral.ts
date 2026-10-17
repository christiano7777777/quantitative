// LQ-I: the periodogram of a four-point series at its Fourier frequencies, and the spectral density of an AR(1) process.
// Lecture 10 (spectral analysis).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { x: number[]; phi: number; sig2: number }

export function sample(rng: Rng): Params {
  return { x: Array.from({ length: 4 }, () => rng.int(-5, 9)), phi: rng.pick([0.3, 0.5, 0.6, 0.8, -0.5, -0.7]), sig2: rng.pick([1, 2, 4]) }
}

export function build({ x, phi, sig2 }: Params): LQInstance {
  const n = 4
  const c = 2 * Math.PI * n
  const i0 = (x[0] + x[1] + x[2] + x[3]) ** 2 / c
  const i1 = ((x[0] - x[2]) ** 2 + (x[1] - x[3]) ** 2) / c
  const i2 = (x[0] - x[1] + x[2] - x[3]) ** 2 / c
  const dens = (w: number) => (sig2 / (2 * Math.PI)) / (1 - 2 * phi * Math.cos(w) + phi * phi)
  const f0 = dens(0), fpi = dens(Math.PI)

  return {
    intro:
      'A series of four observations is ' + tex('x_0,\\dots,x_3=' + x.join(',')) + '. Its periodogram at the Fourier frequencies ' + tex('\\omega_j=2\\pi j/4') + ' is ' + tex('I(\\omega_j)=\\dfrac{1}{2\\pi n}\\Big|\\sum_{t=0}^{3}x_te^{-i\\omega_jt}\\Big|^2') +
      '. Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'Find ' + tex('I(0)') + ' (the frequency ' + tex('\\omega_0=0') + ').',
        answer: i0, tolerance: tol4, lecture: 10,
        explanation: tex('\\sum x_t=' + (x[0] + x[1] + x[2] + x[3])) + ', so ' + tex('I(0)=(\\sum x_t)^2/(8\\pi)') + ' = ' + dec(i0) + '.',
      },
      {
        prompt: 'Find ' + tex('I(\\pi/2)') + ', using ' + tex('e^{-i\\pi t/2}=1,-i,-1,i') + ' for ' + tex('t=0,1,2,3') + '.',
        answer: i1, tolerance: tol4, lecture: 10,
        explanation: tex('\\sum x_te^{-i\\pi t/2}=(x_0-x_2)-i(x_1-x_3)=' + (x[0] - x[2]) + (x[1] - x[3] <= 0 ? '+' : '-') + 'i\\cdot' + Math.abs(x[1] - x[3])) + ', so ' + tex('I=(' + (x[0] - x[2]) + '^2+' + (x[1] - x[3]) + '^2)/(8\\pi)') + ' = ' + dec(i1) + '.',
      },
      {
        prompt: 'Find ' + tex('I(\\pi)') + ' (here ' + tex('e^{-i\\pi t}=(-1)^t') + ').',
        answer: i2, tolerance: tol4, lecture: 10,
        explanation: tex('\\sum x_t(-1)^t=' + (x[0] - x[1] + x[2] - x[3])) + ', so ' + tex('I(\\pi)=(' + (x[0] - x[1] + x[2] - x[3]) + ')^2/(8\\pi)') + ' = ' + dec(i2) + '.',
      },
      {
        prompt: 'An AR(1) process ' + tex('z_t=' + dec(phi) + 'z_{t-1}+\\varepsilon_t') + ' has innovation variance ' + tex('\\sigma^2=' + dec(sig2)) + ' and spectral density ' + tex('f(\\omega)=\\dfrac{\\sigma^2}{2\\pi}\\dfrac{1}{1-2\\phi\\cos\\omega+\\phi^2}') + '. Find ' + tex('f(0)') + '.',
        answer: f0, tolerance: tol4, lecture: 10,
        explanation: tex('\\dfrac{' + dec(sig2) + '}{2\\pi(1-' + dec(phi) + ')^2}') + ' = ' + dec(f0) + '.',
      },
      {
        prompt: 'For the same AR(1) process find ' + tex('f(\\pi)') + '. Compare it with ' + tex('f(0)') + ': which end of the spectrum has more power?',
        answer: fpi, tolerance: tol4, lecture: 10,
        explanation: tex('\\dfrac{' + dec(sig2) + '}{2\\pi(1+' + dec(phi) + ')^2}') + ' = ' + dec(fpi) + '. ' + (phi > 0 ? 'Positive autocorrelation puts the power at low frequencies.' : 'Negative autocorrelation puts the power at high frequencies.'),
      },
    ],
  }
}

export const genI: LQGenerator = { id: 'ts2-lq-i-spectral', generate: (rng) => build(sample(rng)) }
