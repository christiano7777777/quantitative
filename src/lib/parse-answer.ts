import { testConfig } from '../config/test.config'
import type { Tolerance } from './types'

const NUM = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?`
const DECIMAL = new RegExp(`^${NUM}$`)
const FRACTION = new RegExp(String.raw`^(${NUM})\s*/\s*(${NUM})$`)

/**
 * Plain decimal, scientific notation, or a single fraction ("1/2", "-3/4").
 * Returns null for anything else (%, thousands separators, expressions, empty, x/0).
 */
export function parseAnswer(raw: string): number | null {
  const s = raw.trim().replace(/−/g, '-') // typographic minus
  if (DECIMAL.test(s)) return finite(Number(s))
  const m = FRACTION.exec(s)
  if (m) {
    const den = Number(m[2])
    return den === 0 ? null : finite(Number(m[1]) / den)
  }
  return null
}

function finite(x: number): number | null {
  return Number.isFinite(x) ? x : null
}

/** Correct if within the absolute OR relative tolerance (whichever are given). */
export function withinTolerance(given: number, expected: number, tol?: Tolerance): boolean {
  const t = tol && (tol.abs !== undefined || tol.rel !== undefined) ? tol : testConfig.defaultTolerance
  const err = Math.abs(given - expected)
  const eps = 1e-12 // float noise only
  if (t.abs !== undefined && err <= t.abs + eps) return true
  if ('rel' in t && t.rel !== undefined && err <= t.rel * Math.abs(expected) + eps) return true
  return false
}

export function checkAnswer(raw: string, expected: number, tol?: Tolerance): boolean {
  const x = parseAnswer(raw)
  return x !== null && withinTolerance(x, expected, tol)
}
