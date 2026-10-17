// LQ-F: expectations by linearity: empty boxes, distinct faces, collecting coupons, shared birthdays, records.
// Lecture 8 (indicator variables and linearity).
import type { Rng } from '../../../../lib/rng'
import type { LQGenerator, LQInstance } from '../../../../lib/types'
import { dec, tex, tol4 } from '../../../shared/format'

export interface Params { balls: number; boxes: number; rolls: number; faces: number; coupons: number; people: number; seq: number }

export function sample(rng: Rng): Params {
  return { balls: rng.int(8, 20), boxes: rng.pick([5, 8, 10]), rolls: rng.int(4, 12), faces: rng.pick([6, 8, 10]), coupons: rng.pick([5, 8, 10]), people: rng.pick([15, 23, 30, 40]), seq: rng.pick([5, 8, 10, 20]) }
}

export function build({ balls, boxes, rolls, faces, coupons, people, seq }: Params): LQInstance {
  const empty = boxes * (1 - 1 / boxes) ** balls
  const distinct = faces * (1 - (1 - 1 / faces) ** rolls)
  let coupon = 0
  for (let i = 1; i <= coupons; i++) coupon += coupons / i
  const pairs = (people * (people - 1)) / 2 / 365
  let rec = 0
  for (let i = 1; i <= seq; i++) rec += 1 / i

  return {
    intro: 'Give answers to 4 decimal places.',
    parts: [
      {
        prompt: tex(balls) + ' balls are thrown independently and uniformly into ' + tex(boxes) + ' boxes. Find the expected number of empty boxes. (Use one indicator per box.)',
        answer: empty, tolerance: tol4, lecture: 8,
        explanation: 'Each box is empty with probability ' + tex('(1-1/' + boxes + ')^{' + balls + '}') + '; by linearity the mean is ' + tex(boxes + '(1-1/' + boxes + ')^{' + balls + '}') + ' = ' + dec(empty) + '.',
      },
      {
        prompt: 'A fair ' + tex(faces) + '-sided die is rolled ' + tex(rolls) + ' times. Find the expected number of different faces that appear.',
        answer: distinct, tolerance: tol4, lecture: 8,
        explanation: 'Each face appears with probability ' + tex('1-(1-1/' + faces + ')^{' + rolls + '}') + ', so the mean is ' + tex(faces + '\\{1-(1-1/' + faces + ')^{' + rolls + '}\\}') + ' = ' + dec(distinct) + '.',
      },
      {
        prompt: 'There are ' + tex(coupons) + ' equally likely coupon types, collected one at a time with replacement. Find the expected number of draws to collect all types.',
        answer: coupon, tolerance: tol4, lecture: 8,
        explanation: tex(coupons + '(1+\\tfrac12+\\dots+\\tfrac1{' + coupons + '})') + ' = ' + dec(coupon) + '.',
      },
      {
        prompt: 'Among ' + tex(people) + ' people with independent, uniformly distributed birthdays (365 days), find the expected number of pairs who share a birthday.',
        answer: pairs, tolerance: tol4, lecture: 8,
        explanation: tex('\\binom{' + people + '}2/365') + ' = ' + dec(pairs) + '. The pair indicators are dependent, but linearity does not need independence.',
      },
      {
        prompt: 'A random ordering of ' + tex(seq) + ' distinct numbers is read from left to right. A "record" is a number larger than all before it. Find the expected number of records, ' + tex('H_n=1+\\tfrac12+\\dots+\\tfrac1n') + '.',
        answer: rec, tolerance: tol4, lecture: 8,
        explanation: 'Position ' + tex('k') + ' is a record with probability ' + tex('1/k') + ', so the mean is ' + tex('H_{' + seq + '}') + ' = ' + dec(rec) + '.',
      },
    ],
  }
}

export const genF: LQGenerator = { id: 'pz-lq-f-linearity', generate: (rng) => build(sample(rng)) }
