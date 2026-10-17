"""Extract topics.json and careers.json from source/skill-tree.html.

Run from the repo root:  python -I scripts/extract.py
The HTML holds the data as JS constants N (topics), CAR (careers), LEC (lecture outlines).
They are plain object literals, so unquoted keys are quoted and the result parsed as JSON.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
html = (ROOT / "source" / "skill-tree.html").read_text(encoding="utf8")


def literal(start_marker, end_marker):
    a = html.index(start_marker) + len(start_marker)
    b = html.index(end_marker, a)
    text = html[a:b].strip().rstrip(";")
    text = re.sub(r"([{,])\s*([A-Za-z_][A-Za-z0-9_]*)\s*:", r'\1"\2":', text)
    return json.loads(text)


N = literal("const N=", "const CAR=")
CAR = literal("const CAR=", "const LEC=")
LEC = literal("const LEC=", "const M={}")

DOMAIN_LABELS = {
    "math": "Math", "stat": "Probability & Statistics", "ai": "AI / ML",
    "deriv": "Derivatives & Risk", "mkt": "Markets & Trading",
    "puzzle": "Problem Solving", "cs": "Computing",
}


def lecture(row):
    out = {"title": row[0], "theory": row[1], "computation": row[2]}
    if len(row) > 3:
        out["coding"] = row[3]
    return out


ids = {n["id"] for n in N}
assert len(ids) == len(N) == 72, "expected 72 unique topics"
assert set(LEC) == ids, "every topic needs a lecture outline"

topics = []
for n in N:
    L = LEC[n["id"]]
    assert all(p in ids for p in n["p"]), n["id"]
    topics.append({
        "id": n["id"],
        "label": n["l"],
        "domain": n["d"],
        "prerequisites": n["p"],
        "courses": n["c"],
        "starred": bool(n.get("s")),
        "summary": L["s"],
        "outcomes": L["o"],
        "note": L["n"],
        "proofsNote": L["p"],
        "lectures": [lecture(r) for r in L["l"]],
    })

careers = []
for cid, c in CAR.items():
    assert all(t in ids for t in c["r"] + c["b"]), cid
    careers.append({"id": cid, "label": c["l"], "required": c["r"], "bonus": c["b"]})

out = ROOT / "src" / "data"
out.mkdir(parents=True, exist_ok=True)
(out / "topics.json").write_text(json.dumps(topics, indent=1, ensure_ascii=False) + "\n", encoding="utf8")
(out / "careers.json").write_text(json.dumps(careers, indent=1, ensure_ascii=False) + "\n", encoding="utf8")
(out / "domains.json").write_text(json.dumps(DOMAIN_LABELS, indent=1, ensure_ascii=False) + "\n", encoding="utf8")
print(f"{len(topics)} topics, {len(careers)} careers, {sum(len(t['lectures']) for t in topics)} lectures")
