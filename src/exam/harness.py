"""Test harness for the Big Exam coding part.

One file, two users: the browser worker loads it into Pyodide, and `npm run validate-exams` runs it in a Python
subprocess (via harness_cli.py). Comparison logic therefore lives in exactly one place.

Everything crosses the boundary as JSON strings, so no JavaScript or Node object ever reaches Python.
"""
import ast
import contextlib
import io
import json
import math
import random
import traceback

import numpy as np

STDOUT_LIMIT = 20000

# what reference solutions may import when the validator runs them on the host machine
ALLOWED_MODULES = {
    'numpy', 'scipy', 'math', 'random', 'statistics', 'itertools', 'functools', 'collections', 'typing',
    'dataclasses', 'heapq', 'bisect', 'fractions', 'decimal', 'operator', 'copy', 'cmath',
}
BANNED_NAMES = {'open', 'exec', 'eval', 'compile', '__import__', 'input', 'breakpoint', 'exit', 'quit', 'globals', 'locals', 'vars', 'getattr', 'setattr', 'delattr'}


# ---------------------------------------------------------------- values

def decode(v):
    """JSON test input -> Python: {"$ndarray": [...]} becomes a numpy array, the rest stays plain Python."""
    if isinstance(v, dict):
        if set(v) == {'$ndarray'}:
            return np.array(decode(v['$ndarray']))
        return {k: decode(x) for k, x in v.items()}
    if isinstance(v, list):
        return [decode(x) for x in v]
    return v


def jsonable(v):
    """Python result -> JSON-safe value. numpy arrays and scalars become lists and numbers; NaN/inf become strings."""
    if isinstance(v, np.ndarray):
        return jsonable(v.tolist())
    if isinstance(v, np.generic):
        return jsonable(v.item())
    if isinstance(v, (list, tuple, set, frozenset)):
        return [jsonable(x) for x in (sorted(v) if isinstance(v, (set, frozenset)) else v)]
    if isinstance(v, dict):
        return {str(k): jsonable(x) for k, x in v.items()}
    if isinstance(v, float):
        if math.isnan(v):
            return 'NaN'
        if math.isinf(v):
            return 'Infinity' if v > 0 else '-Infinity'
        return v
    if v is None or isinstance(v, (bool, int, str)):
        return v
    return repr(v)


def _num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def equal(a, b):
    """Exact comparison where 1 equals 1.0, but True does not equal 1."""
    if isinstance(a, bool) or isinstance(b, bool):
        return isinstance(a, bool) and isinstance(b, bool) and a == b
    if _num(a) and _num(b):
        return a == b
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(equal(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(equal(a[k], b[k]) for k in a)
    return a == b


def _array(out, what='output'):
    """The output as a flat float array, or an error message."""
    try:
        arr = np.asarray(out, dtype=float).ravel()
    except (TypeError, ValueError):
        return None, f'{what} must be an array of numbers'
    if arr.size == 0:
        return None, f'{what} is empty'
    if not np.all(np.isfinite(arr)):
        return None, f'{what} contains NaN or infinite values'
    return arr, None


def _within(got, exp, abs_tol, rel_tol):
    got = np.asarray(got, dtype=float)
    exp = np.asarray(exp, dtype=float)
    return got.shape == exp.shape and bool(np.all(np.abs(got - exp) <= abs_tol + rel_tol * np.abs(exp)))


def _fmt(xs):
    return '[' + ', '.join(f'{x:.6g}' for x in np.asarray(xs, dtype=float).ravel()) + ']'


STATS = {
    'mean': lambda a: float(np.mean(a)),
    'sd': lambda a: float(np.std(a, ddof=1)) if a.size > 1 else float('nan'),
    'var': lambda a: float(np.var(a, ddof=1)) if a.size > 1 else float('nan'),
    'median': lambda a: float(np.median(a)),
    'min': lambda a: float(np.min(a)),
    'max': lambda a: float(np.max(a)),
}


def compare(output, expected, cfg):
    """Returns (passed, message, got). `got` is what was compared (quantiles, summary stats or the normalised value)."""
    kind = cfg['type']
    abs_tol, rel_tol = float(cfg.get('abs', 0)), float(cfg.get('rel', 0))
    if kind == 'exact':
        got = jsonable(output)
        ok = equal(got, expected)
        return ok, ('ok' if ok else f'expected {json.dumps(expected)[:300]}, got {json.dumps(got)[:300]}'), got
    if kind == 'numeric':
        got = jsonable(output)
        try:
            g = np.asarray(output, dtype=float)
            e = np.asarray(expected, dtype=float)
        except (TypeError, ValueError):
            return False, f'expected numbers {json.dumps(expected)[:200]}, got {json.dumps(got)[:200]}', got
        if g.shape != e.shape:
            return False, f'expected shape {list(e.shape)}, got shape {list(g.shape)}', got
        ok = bool(np.all(np.isfinite(g))) and _within(g, e, abs_tol, rel_tol)
        return ok, ('ok' if ok else f'expected {_fmt(e)}, got {_fmt(g)} (tolerance abs {abs_tol:g}, rel {rel_tol:g})'), got
    arr, err = _array(output)
    if err:
        return False, err, None
    if 'length' in cfg and arr.size != cfg['length']:
        return False, f'expected {cfg["length"]} values, got {arr.size}', None
    if kind == 'quantiles':
        got = [float(x) for x in np.quantile(arr, cfg['probs'])]
        label = 'quantiles ' + _fmt(cfg['probs'])
    elif kind == 'summary':
        got = [STATS[s](arr) for s in cfg['stats']]
        label = ' '.join(cfg['stats'])
    else:
        return False, f'unknown comparison type {kind}', None
    ok = _within(got, expected, abs_tol, rel_tol)
    return ok, ('ok' if ok else f'{label}: expected {_fmt(expected)}, got {_fmt(got)} (tolerance abs {abs_tol:g}, rel {rel_tol:g})'), got


# ---------------------------------------------------------------- running

def _last_error_line(exc):
    tb = traceback.extract_tb(exc.__traceback__)
    where = next((f'line {f.lineno}' for f in reversed(tb) if f.filename == '<your code>'), None)
    return f'{type(exc).__name__}: {exc}' + (f' ({where})' if where else '')


def call_main(helper, student, main, rng_arg, case):
    """Runs the student's code in a fresh namespace and calls `main` with the case's input. Returns (output, stdout)."""
    seed = int(case['seed'])
    random.seed(seed)
    np.random.seed(seed)
    ns = {'__name__': '__exam__'}
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        if helper.strip():
            exec(compile(helper, '<helper code>', 'exec'), ns)
        exec(compile(student, '<your code>', 'exec'), ns)
        fn = ns.get(main)
        if not callable(fn):
            raise NameError(f'function {main}() is not defined')
        kwargs = decode(case.get('input', {}))
        if rng_arg:
            kwargs[rng_arg] = np.random.default_rng(seed)
        out = fn(**kwargs)
    return out, buf.getvalue()[:STDOUT_LIMIT]


def run_case(helper, student, main, rng_arg, case):
    """Runs one test case and compares. Never raises: errors become a failed result with a message."""
    res = {'id': case.get('id'), 'passed': False, 'message': '', 'got': None, 'stdout': ''}
    try:
        out, stdout = call_main(helper, student, main, rng_arg, case)
        res['stdout'] = stdout
        if out is None:
            res['message'] = f'{main}() returned None: did you forget the return statement?'
            return res
        res['passed'], res['message'], res['got'] = compare(out, case.get('expected'), case['compare'])
    except SyntaxError as e:
        res['message'] = f'SyntaxError: {e.msg} (line {e.lineno})'
    except BaseException as e:  # student code may raise anything, including SystemExit
        res['message'] = _last_error_line(e)
    return res


def run_case_json(helper, student, main, rng_arg, case_json):
    """Entry point for Pyodide: one case in, one JSON string out."""
    return json.dumps(run_case(helper, student, main, rng_arg or None, json.loads(case_json)))


def run_output_json(helper, student, main, rng_arg, case_json):
    """For --fill-expected and the oracle check: run `main` and return its JSON-safe output (no comparison)."""
    case = json.loads(case_json)
    try:
        out, stdout = call_main(helper, student, main, rng_arg or None, case)
        return json.dumps({'ok': True, 'output': jsonable(out), 'stdout': stdout})
    except BaseException as e:
        return json.dumps({'ok': False, 'message': _last_error_line(e)})


def summarise(output, cfg):
    """The value `expected` should have for this comparison, computed from a real output (used by --fill-expected)."""
    kind = cfg['type']
    if kind in ('exact', 'numeric'):
        return output
    arr, err = _array(output)
    if err:
        raise ValueError(err)
    if kind == 'quantiles':
        return [float(x) for x in np.quantile(arr, cfg['probs'])]
    return [STATS[s](arr) for s in cfg['stats']]


# ---------------------------------------------------------------- static checks (host-side validation)

def lint(source):
    """Problems that stop the validator from running this code on the host, plus the top-level function names."""
    try:
        tree = ast.parse(source)
    except SyntaxError as e:
        return {'problems': [f'SyntaxError: {e.msg} (line {e.lineno})'], 'defs': []}
    problems = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            mods = [a.name for a in node.names]
        elif isinstance(node, ast.ImportFrom):
            mods = [node.module or ''] if node.level == 0 else ['.']
        else:
            mods = []
        for m in mods:
            if m.split('.')[0] not in ALLOWED_MODULES:
                problems.append(f'import of {m!r} is not allowed (line {node.lineno})')
        if isinstance(node, ast.Name) and node.id in BANNED_NAMES:
            problems.append(f'use of {node.id!r} is not allowed (line {node.lineno})')
        if isinstance(node, ast.Attribute) and node.attr.startswith('__') and node.attr not in ('__name__', '__len__', '__init__'):
            problems.append(f'access to {node.attr!r} is not allowed (line {node.lineno})')
    defs = [n.name for n in tree.body if isinstance(n, ast.FunctionDef)]
    return {'problems': problems, 'defs': defs}
