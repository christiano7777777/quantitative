"""Set `examPhase` on every topic in src/data/topics.json (run: python -I scripts/assign_exam_phases.py).

Phase 1 is the hand-picked pilot list below. Phase 2 is every other topic on the Quant Researcher (`qr`) track, using the
same definition the skill tree uses to highlight a career: the required topics, all their prerequisites, and the bonus
topics (see careerClosure and inCareer in src/lib/graph.ts and src/pages/Tree.tsx). All other topics get null. Phase 1/2 topics listed in exam_topic_hints.WRITTEN_ONLY (no coding part)
also get examWeights {written: 1, coding: 0}.
The script keeps the file's line endings and key order, and is safe to re-run.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))  # python -I does not add the script folder
from exam_topic_hints import WRITTEN_ONLY  # noqa: E402
TOPICS = ROOT / 'src' / 'data' / 'topics.json'
CAREERS = ROOT / 'src' / 'data' / 'careers.json'
TRACK = 'qr'
PHASE1 = ['bay', 'inf', 'np']


def main() -> None:
    raw = TOPICS.read_bytes().decode('utf-8')
    eol = '\r\n' if '\r\n' in raw else '\n'
    topics = json.loads(raw)
    by_id = {t['id']: t for t in topics}
    career = next(c for c in json.loads(CAREERS.read_text(encoding='utf-8')) if c['id'] == TRACK)

    track = set(career['required'])
    stack = list(career['required'])
    while stack:
        for p in by_id[stack.pop()]['prerequisites']:
            if p not in track:
                track.add(p)
                stack.append(p)
    track |= set(career['bonus'])

    missing = [p for p in PHASE1 if p not in track]
    if missing:
        raise SystemExit(f'phase 1 topics not on the {TRACK} track: {missing}')

    out = []
    for t in topics:
        phase = 1 if t['id'] in PHASE1 else 2 if t['id'] in track else None
        new = {}
        for k, v in t.items():
            if k not in ('examPhase', 'examWeights'):
                new[k] = v
            if k == 'starred':
                new['examPhase'] = phase
                # a topic with no coding part is examined in writing only (100% written)
                if phase is not None and t['id'] in WRITTEN_ONLY:
                    new['examWeights'] = {'written': 1, 'coding': 0}
        if 'starred' not in t:
            new['examPhase'] = phase
        out.append(new)

    text = json.dumps(out, indent=1, ensure_ascii=False).replace('\n', eol) + eol
    TOPICS.write_bytes(text.encode('utf-8'))
    p1 = [t['id'] for t in out if t['examPhase'] == 1]
    p2 = [t['id'] for t in out if t['examPhase'] == 2]
    print(f'phase 1 ({len(p1)}): {" ".join(p1)}')
    print(f'phase 2 ({len(p2)}): {" ".join(p2)}')


if __name__ == '__main__':
    main()
