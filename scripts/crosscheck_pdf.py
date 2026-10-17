# Cross-check src/data/topics.json against the PDF text.
# Usage: pdftotext -enc UTF-8 source/Quantitative_Syllabus.pdf out.txt ; python -I scripts/crosscheck_pdf.py out.txt
# Checks lecture count, stage (= depth + 1), prerequisites and lecture-title words for every topic.
# Known benign hit: "Difference-in-differences" (the PDF truncates that word at a line wrap).
import re,json,sys
txt=open(sys.argv[1],encoding='utf8',errors='replace').read()
T=json.load(open('src/data/topics.json',encoding='utf8'))
byLabel={t['label']:t for t in T}
M={t['id']:t for t in T}
dep={}
def d(i):
    if i not in dep: dep[i]=1+max([d(p) for p in M[i]['prerequisites']],default=-1)
    return dep[i]
parts=re.split(r'\f(?=QNT-\d+ )',txt)
code2id={};rows=[]
for p in parts:
    m=re.match(r'QNT-(\d+) \S+ ([^\n]+)\n(?:\n)?([^\n]+)\n\nStage (\d+) (\d+) lectures',p)
    if not m: continue
    code,dom,title,stage,nl=m.groups()
    title=title.strip()
    if title not in byLabel: print('NO LABEL',code,repr(title)); continue
    code2id['QNT-'+code]=byLabel[title]['id']
    pm=re.search(r'Prerequisites University courses Assessment[^\n]*\n\n(.*?)\n(?:Theory|Computation|Proof)',p,re.S)
    line=pm.group(1) if pm else ''
    prereq=re.findall(r'QNT-\d+',line)
    rows.append((code,title,int(stage),int(nl),prereq,line,p))
print('topic sections parsed',len(rows))
bad=0
for code,title,stage,nl,prereq,line,p in rows:
    t=byLabel[title]
    mism=[]
    if len(t['lectures'])!=nl: mism.append(f'lectures html={len(t["lectures"])} pdf={nl}')
    if d(t['id'])+1!=stage: mism.append(f'stage html={d(t["id"])+1} pdf={stage}')
    pp=sorted(code2id.get(c,c) for c in prereq)
    if pp!=sorted(t['prerequisites']): mism.append(f'prereq html={sorted(t["prerequisites"])} pdf={pp}')
    # lecture titles present in PDF section text (whitespace-normalised)
    norm=re.sub(r'\s+','',p)
    words=set(re.findall(r"[A-Za-z0-9']+",p))
    miss=[l['title'] for l in t['lectures'] if not all(w in words for w in re.findall(r"[A-Za-z0-9']+",l['title']))]
    if miss: mism.append(f'lecture titles not found in pdf: {miss[:3]}{"..." if len(miss)>3 else ""} ({len(miss)})')
    if mism: bad+=1; print(code,title,'|',' ; '.join(mism))
print('topics with any mismatch:',bad)
