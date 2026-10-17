// LQ-H: singular values of a 3x2 matrix, the energy kept by the best rank-1 approximation, and PCA of a small 2-D data set.
// Lectures 9 (covariance matrices) and 10 (SVD, low-rank approximation, principal components).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { fixZero } from '../util'
import { dec, pm, tex, tol3 } from '../../../shared/format'

export interface Params { A: number[][]; pts: number[][] }

const eig2 = (a: number, b: number, c: number) => {
  // eigenvalues of the symmetric matrix [[a,b],[b,c]]
  const m = (a + c) / 2, d = Math.sqrt(((a - c) / 2) ** 2 + b * b)
  return [m + d, m - d]
}
const cov = (pts: number[][]) => {
  const n = pts.length
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n
  const sxx = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0) / (n - 1)
  const syy = pts.reduce((s, p) => s + (p[1] - my) ** 2, 0) / (n - 1)
  const sxy = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / (n - 1)
  return { mx, my, sxx, syy, sxy }
}

export function sample(rng: Rng): Params {
  for (;;) {
    const A = Array.from({ length: 3 }, () => [rng.int(-3, 3), rng.int(-3, 3)])
    const saa = A.reduce((s, r) => s + r[0] * r[0], 0), sbb = A.reduce((s, r) => s + r[1] * r[1], 0), sab = A.reduce((s, r) => s + r[0] * r[1], 0)
    const det = saa * sbb - sab * sab
    if (det < 4 || Math.abs(saa - sbb) + Math.abs(sab) < 3) continue
    const pts = Array.from({ length: 5 }, () => [rng.int(0, 8), rng.int(0, 8)])
    const c = cov(pts)
    if (c.sxy === 0 || Math.abs(c.sxx - c.syy) + Math.abs(c.sxy) < 1) continue
    if (new Set(pts.map((p) => p.join())).size < 5) continue
    return { A, pts }
  }
}

function buildRaw({ A, pts }: Params): LQInstance {
  const saa = A.reduce((s, r) => s + r[0] * r[0], 0), sbb = A.reduce((s, r) => s + r[1] * r[1], 0), sab = A.reduce((s, r) => s + r[0] * r[1], 0)
  const [mu1, mu2] = eig2(saa, sab, sbb)
  const s1 = Math.sqrt(mu1), s2 = Math.sqrt(mu2)
  const frac = mu1 / (mu1 + mu2)
  const c = cov(pts)
  const [v1, v2] = eig2(c.sxx, c.sxy, c.syy)
  const share = v1 / (v1 + v2)
  const cosPc = Math.abs(c.sxy) / Math.hypot(c.sxy, v1 - c.sxx)
  const n = pts.length
  return {
    intro: 'Give decimals to 3 places. Parts 1-3 use ' + tex('A=' + pm(A)) + ', and parts 4-5 use the five data points ' + tex(pts.map((p) => '(' + p[0] + ',' + p[1] + ')').join(',\\ ')) + '.',
    parts: [
      {
        prompt: 'Find the largest singular value ' + tex('\\sigma_1') + ' of ' + tex('A') + '.',
        answer: s1, tolerance: tol3, lecture: 10,
        explanation: tex('A^{\\top}A=' + pm([[saa, sab], [sab, sbb]])) + ' has trace ' + tex(saa + sbb) + ' and determinant ' + tex(saa * sbb - sab * sab) + ', so its eigenvalues are ' + tex(dec(mu1) + ',\\ ' + dec(mu2)) + ' and ' + tex('\\sigma_1=\\sqrt{' + dec(mu1) + '}=' + dec(s1)) + '.',
      },
      {
        prompt: 'Find the smaller singular value ' + tex('\\sigma_2') + '.',
        answer: s2, tolerance: tol3, lecture: 10,
        explanation: tex('\\sigma_2=\\sqrt{' + dec(mu2) + '}=' + dec(s2)) + '. As a check ' + tex('\\sigma_1^2\\sigma_2^2=\\det(A^{\\top}A)=' + (saa * sbb - sab * sab)) + '.',
      },
      {
        prompt: 'By the Eckart-Young theorem the best rank-1 approximation ' + tex('A_1=\\sigma_1u_1v_1^{\\top}') + ' keeps a fraction ' + tex('1-\\|A-A_1\\|_F^2/\\|A\\|_F^2') + ' of the squared Frobenius norm. Find this fraction.',
        answer: frac, tolerance: tol3, lecture: 10,
        explanation: tex('\\|A\\|_F^2=\\sigma_1^2+\\sigma_2^2=' + (saa + sbb)) + ' and ' + tex('\\|A-A_1\\|_F^2=\\sigma_2^2=' + dec(mu2)) + ', so the fraction is ' + tex('\\sigma_1^2/(\\sigma_1^2+\\sigma_2^2)=' + dec(frac)) + '.',
      },
      {
        prompt: 'Centre the data points and form the sample covariance matrix (divide by ' + tex(n - 1) + '). What fraction of the total variance is explained by the first principal component?',
        answer: share, tolerance: tol3, lecture: 10,
        explanation: 'Means ' + tex('(' + dec(c.mx) + ',' + dec(c.my) + ')') + ', covariance ' + tex(pm([[dec(c.sxx), dec(c.sxy)], [dec(c.sxy), dec(c.syy)]])) + ', eigenvalues ' + tex(dec(v1) + ',\\ ' + dec(v2)) + '; the share is ' + tex(dec(v1) + '/' + dec(v1 + v2) + '=' + dec(share)) + '.',
      },
      {
        prompt: 'The first principal direction is the unit eigenvector of the covariance matrix for the larger eigenvalue. Find the absolute value of its first coordinate.',
        answer: cosPc, tolerance: tol3, lecture: 10,
        explanation: tex('(S-' + dec(v1) + 'I)w=0') + ' gives ' + tex('w\\propto(s_{xy},\\ \\lambda_1-s_{xx})=(' + dec(c.sxy) + ',' + dec(v1 - c.sxx) + ')') + '; normalising, ' + tex('|w_1|=' + dec(cosPc)) + '.',
      },
    ],
  }
}

export const build = (prm: Params): LQInstance => fixZero(buildRaw(prm))

export const genH: LQGenerator = { id: 'la2-lq-h-svd', generate: (rng) => build(sample(rng)) }
