from pathlib import Path

project_root = Path(__file__).resolve().parent
data = open(project_root / 'analyze_out2.txt', encoding='utf-8-sig').read()
lines = data.splitlines()
out = []
for i, l in enumerate(lines):
    out.append(f'{i:3}: {l}')
open(project_root / 'analyze_numbered.txt', 'w', encoding='utf-8').write('\n'.join(out))
print("Done,", len(lines), "lines written")
