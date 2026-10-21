"""Builds PROMPT_FOR_CLAUDE_QUESTION_WRITER.md from scripts/writer_prompt_template.md plus the real schemas and the
Bayesian placeholder files, so the prompt can never show a schema that differs from the one the validator enforces.

Run:  python -I scripts/build_writer_prompt.py        (re-run after changing a schema or the template)
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXAMS = ROOT / 'content' / 'exams'


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def block(obj):
    return json.dumps(obj, indent=2, ensure_ascii=False)


def main():
    text = (ROOT / 'scripts' / 'writer_prompt_template.md').read_text(encoding='utf-8')
    parts = {
        '{{WRITTEN_SCHEMA}}': block(load(EXAMS / 'schema' / 'written.schema.json')),
        '{{CODING_SCHEMA}}': block(load(EXAMS / 'schema' / 'coding.schema.json')),
        '{{WRITTEN_EXAMPLE}}': block(load(EXAMS / 'bay.written.json')),
        '{{CODING_EXAMPLE}}': block(load(EXAMS / 'bay.coding.json')),
    }
    for key, value in parts.items():
        assert key in text, key
        text = text.replace(key, value)
    out = ROOT / 'PROMPT_FOR_CLAUDE_QUESTION_WRITER.md'
    out.write_text(text, encoding='utf-8')
    print(f'wrote {out.name}: {len(text):,} characters')


if __name__ == '__main__':
    main()
