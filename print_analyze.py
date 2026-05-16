import sys
data = open('C:/Users/hp/Desktop/Veepee/analyze_out2.txt', encoding='utf-8-sig').read()
lines = data.splitlines()
out = []
for i, l in enumerate(lines):
    out.append(f'{i:3}: {l}')
open('C:/Users/hp/Desktop/Veepee/analyze_numbered.txt', 'w', encoding='utf-8').write('\n'.join(out))
print("Done,", len(lines), "lines written")
