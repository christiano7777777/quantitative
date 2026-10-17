// LQ-H: VAE and GAN quantities, and training-practice sanity checks (initial loss, gradient clipping).
// Lectures 10 (generative models) and 11 (training practice).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { mu: number; sigma: number; recon: number; pd: number; pg: number; gx: number; gy: number; clip: number; K: number }

export function sample(rng: Rng): Params {
  const gx = rng.int(1, 8), gy = rng.int(1, 8)
  return { mu: rng.int(-20, 20) / 10, sigma: rng.int(3, 20) / 10, recon: rng.int(20, 120) / 10, pd: rng.int(5, 90) / 100, pg: rng.int(5, 90) / 100, gx, gy, clip: rng.int(1, Math.floor(Math.hypot(gx, gy))), K: rng.pick([2, 5, 10, 100, 1000]) }
}

export function build({ mu, sigma, recon, pd, pg, gx, gy, clip, K }: Params): LQInstance {
  const kl = 0.5 * (mu * mu + sigma * sigma - 1 - Math.log(sigma * sigma))
  const elbo = recon - kl
  const dstar = pd / (pd + pg)
  const norm = Math.hypot(gx, gy)
  const scale = Math.min(1, clip / norm)
  const clipped = gx * scale
  const init = Math.log(K)

  return {
    intro: 'Give answers to 4 decimal places.',
    parts: [
      {
        prompt: 'A VAE encoder outputs ' + tex('q(z\\mid x)=N(\\mu,\\sigma^2)') + ' with ' + tex('\\mu=' + dec(mu) + ',\\ \\sigma=' + dec(sigma)) + ' for a one-dimensional latent with prior ' + tex('N(0,1)') + '. Find ' + tex('\\mathrm{KL}(q\\|p)=\\tfrac12(\\mu^2+\\sigma^2-1-\\ln\\sigma^2)') + '.',
        answer: kl, tolerance: tol4, lecture: 10,
        explanation: tex('\\tfrac12(' + dec(mu * mu) + '+' + dec(sigma * sigma) + '-1-\\ln ' + dec(sigma * sigma) + ')=' + dec(kl)) + '.',
      },
      {
        prompt: 'The expected reconstruction log-likelihood is ' + tex('E_q[\\log p(x\\mid z)]=-' + dec(recon)) + '. Find the ELBO = reconstruction term minus KL.',
        answer: -recon - kl, tolerance: tol4, lecture: 10,
        explanation: tex('-' + dec(recon) + '-' + dec(kl) + '=' + dec(-recon - kl)) + '. Maximising it trades reconstruction against staying near the prior.',
      },
      {
        prompt: 'In a GAN, the optimal discriminator at a point is ' + tex('D^*(x)=p_{\\text{data}}(x)/(p_{\\text{data}}(x)+p_g(x))') + '. Find it where ' + tex('p_{\\text{data}}=' + dec(pd) + ',\\ p_g=' + dec(pg)) + '.',
        answer: dstar, tolerance: tol4, lecture: 10,
        explanation: tex(dec(pd) + '/(' + dec(pd) + '+' + dec(pg) + ')=' + dec(dstar)) + '; it equals ' + tex('1/2') + ' when the generator matches the data.',
      },
      {
        prompt: 'Gradient clipping by norm with threshold ' + tex('c=' + clip) + ' rescales a gradient ' + tex('g') + ' to ' + tex('g\\cdot\\min(1,c/\\|g\\|)') + '. For ' + tex('g=(' + gx + ',' + gy + ')') + ', find the first component after clipping.',
        answer: clipped, tolerance: tol4, lecture: 11,
        explanation: tex('\\|g\\|=' + dec(norm) + ',\\ \\min(1,' + clip + '/' + dec(norm) + ')=' + dec(scale) + ',\\ ' + gx + '\\times' + dec(scale) + '=' + dec(clipped)) + '.',
      },
      {
        prompt: 'A sanity check before training: with ' + tex('K=' + K) + ' equally likely classes and a randomly initialised softmax classifier, the expected cross-entropy loss is about ' + tex('\\ln K') + '. Find it.',
        answer: init, tolerance: tol4, lecture: 11,
        explanation: tex('\\ln ' + K + '=' + dec(init)) + '. A much larger starting loss suggests a bug or badly scaled initialisation.',
      },
    ],
  }
}

export const genH: LQGenerator = { id: 'dl-lq-h-generative', generate: (rng) => build(sample(rng)) }
