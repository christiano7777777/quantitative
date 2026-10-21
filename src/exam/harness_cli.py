"""Command line front end of harness.py for the Node validator: one JSON request on stdin, one JSON reply on stdout.

  {"op": "lint", "sources": ["code", ...]}
  {"op": "run", "helper": "...", "student": "...", "main": "f", "rngArg": null, "cases": [...]}
  {"op": "output", "helper": "...", "student": "...", "main": "f", "rngArg": null, "cases": [...]}
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import harness  # noqa: E402


def main():
    req = json.loads(sys.stdin.read())
    op = req['op']
    if op == 'lint':
        reply = {'lint': [harness.lint(s) for s in req['sources']]}
    elif op == 'run':
        reply = {'results': [harness.run_case(req['helper'], req['student'], req['main'], req.get('rngArg'), c) for c in req['cases']]}
    elif op == 'output':
        reply = {'results': [json.loads(harness.run_output_json(req['helper'], req['student'], req['main'], req.get('rngArg'), json.dumps(c))) for c in req['cases']]}
    elif op == 'summarise':
        reply = {'summary': [harness.summarise(o, cfg) for o, cfg in zip(req['outputs'], req['compares'])]}
    else:
        raise SystemExit(f'unknown op {op}')
    sys.stdout.write('\n@@EXAM-JSON@@' + json.dumps(reply))


if __name__ == '__main__':
    main()
