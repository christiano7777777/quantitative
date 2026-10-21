"""Builds one tailored Big Exam question-writer prompt per topic, into that topic's folder under topic-folders/:

    topic-folders/<Label> (<id>)/BIG EXAM PROMPT <Label> (<id>).md

Each prompt is the shared prompt (scripts/writer_prompt_template.md with the live schemas and examples) with the topic's own
id, name, courses, learning outcomes and lecture outline (from src/data/topics.json) filled in, plus topic-specific guidance
for the written and the coding part (scripts/exam_topic_hints.py). A topic with no coding part gets a written-only prompt.

Run:  python -I scripts/build_topic_exam_prompts.py [topic ids...]      (all topics when none are given)
tools/export_topic_folders.py runs this too, so a re-export never loses the prompts.
"""
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))  # -I does not put the script's folder on the path

import build_writer_prompt  # noqa: E402
from exam_topic_hints import HINTS  # noqa: E402

ROOT = HERE.parent
OUT = ROOT / 'topic-folders'


def assignment(t: dict, coding: bool) -> str:
    lectures = '\n'.join(
        f"{i}. {l['title']}\n   - Theory: {l.get('theory', '')}\n   - Computation: {l.get('computation', '')}"
        for i, l in enumerate(t['lectures'], 1))
    files = f"`{t['id']}.written.json`" + (f" and `{t['id']}.coding.json`" if coding else ' only')
    outcomes = '\n'.join(f'- {o}' for o in t.get('outcomes', []))
    return f'''## ASSIGNMENT (already filled in for this topic)

- **Topic id:** `{t['id']}`  (files: {files})
- **Topic:** {t['label']}
- **University courses it follows:** {t.get('courses', '')}
- **Coding part:** {'YES: write both files.' if coding else 'NO: this topic has no coding part that runs as Python in a browser. Write ONLY the written file, and ignore section 3.'}

**Summary:** {t.get('summary', '')}

**Learning outcomes:**
{outcomes}

**Lecture outline** ({len(t['lectures'])} lectures; this is the syllabus the exam must follow and cover as a whole):

{lectures}

**Source note:** {t.get('note', '')}

If the student has attached or pasted the real course notes or past papers for this topic, they override the outline above where they differ. Extra instructions from the student (if any) follow this line:

'''


def guidance(t: dict, coding: bool) -> str:
    written, coding_ideas = HINTS.get(t['id'], ('', None))
    if not written:
        written = 'the central theorems, derivations and computations of each lecture in the outline'
    code = (f'''### 4.2 Coding part for {t['label']}

Write 3 or 4 questions in the format of section 3. Kinds of question that suit this topic (choose and adapt to the outline; drop anything the outline does not cover): {coding_ideas}

Every question needs a fixed, stated setup, no data in the text, one tested function, and tests as described in section 3. Prefer deterministic comparison (`exact`, `numeric`) whenever the quantity is deterministic; use `quantiles` / `summary` only for seeded random output.''' if coding else f'''### 4.2 No coding part for {t['label']}

Write the written file only. If the outline has short procedures a student should be able to carry out (an algorithm, a command sequence, a computation), examine them in the written paper as "state the steps and the result" parts with a marking scheme.''')
    return f'''## 4. Guidance for {t['label']} ({t['id']})

### 4.1 Written part for {t['label']}

Cover all {len(t['lectures'])} lectures across 4 or 5 questions (each question spans 2 or 3 consecutive lectures; no lecture left untested). Typical content that fits this topic: {written}.

Method, in this order:
1. List each lecture's 2 or 3 central results (the theorems proved, the algorithms stated, the formulas used).
2. Build each written question from one block of lectures, with parts that move from definition to derivation to proof to a short interpretation. Take the proofs from the central results, varied enough that the student must reason rather than recall.
3. Check the whole paper fits about 2 hours and about 100 marks.

{code}

---

'''


def tailor(base: str, t: dict) -> str:
    coding = HINTS.get(t['id'], ('', ''))[1] is not None
    s = base
    a, b = s.index('## ASSIGNMENT'), s.index('---\n\n## 0.')
    s = s[:a] + assignment(t, coding) + s[b:]
    a, b = s.index('## 4. Topic guidance'), s.index('## 5. Self-check')
    s = s[:a] + guidance(t, coding) + s[b:]
    s = s.replace('# Task: write the real Big Exam questions for the "Quantitative" app',
                  f'# Task: write the real Big Exam questions for "{t["label"]}" ({t["id"]}) in the "Quantitative" app', 1)
    if not coding:
        s = s.replace('## 3. The coding file\n', '## 3. The coding file\n\n**This topic has no coding part. Skip this whole section and write only the written file.** (The section stays here only because the prompt is generated from one shared template.)\n', 1)
    s = s.replace("If the topic id or the outline above still shows `<<<`, do not invent anything: ask the student to fill it in and stop.\n", '')
    assert '<<<' not in s, t['id']
    return s


def main(ids: list[str]) -> None:
    topics = json.loads((ROOT / 'src' / 'data' / 'topics.json').read_text(encoding='utf-8'))
    base = build_writer_prompt.base_text()
    n = 0
    for t in topics:
        if ids and t['id'] not in ids:
            continue
        name = re.sub(r'[<>:"/\\|?*]', '-', t['label'])
        dest = OUT / f"{name} ({t['id']})"
        dest.mkdir(parents=True, exist_ok=True)
        (dest / f"BIG EXAM PROMPT {name} ({t['id']}).md").write_text(tailor(base, t), encoding='utf-8')
        n += 1
    print(f'{n} tailored Big Exam prompts written under {OUT}')


if __name__ == '__main__':
    main(sys.argv[1:])
