"""Snapshot of the live De Bril store (buydb.in WooCommerce Store API) -> debril-home/catalog.json.
Refresh: curl -s "https://buydb.in/wp-json/wc/store/v1/products?per_page=100" -o /tmp/p.json && python3 catalog.py /tmp/p.json"""
import json, re, sys, pathlib, html

src = json.load(open(sys.argv[1]))
FIX = {'BALCK': 'BLACK', 'MANGNTIC': 'MAGNETIC', 'ACCETATE': 'ACETATE'}

def nice(tok):
    tok = FIX.get(tok, tok)
    return tok if (re.search(r'\d', tok) or len(tok) <= 2) else tok.capitalize()

out = []
for p in src:
    if not p['images']:
        continue
    raw = html.unescape(p['name']).upper()
    two = bool(re.search(r'W/\s*MA', raw))
    base = re.split(r'\s+W/', raw)[0]
    toks = [nice(t) for t in base.split()]
    last = max((i for i, t in enumerate(toks) if re.search(r'\d', t)), default=0)
    attrs = {a['name']: [t['name'] for t in a['terms']] for a in p['attributes']}
    a1 = lambda k: (attrs.get(k) or [''])[0]
    ims = list(dict.fromkeys(i['thumbnail'] for i in p['images']))
    out.append({
        'id': p['permalink'].rstrip('/').rsplit('/', 1)[-1],
        'f': list(dict.fromkeys(i['src'] for i in p['images']))[:8],
        'm': ' '.join(toks[:last + 1]),
        'c': ' '.join(toks[last + 1:]) or '—',
        'u': p['permalink'],
        'i': ims[:2],
        'g': {'child': 'Children', 'Male': 'Men', 'Female': 'Women'}.get(a1('Gender'), a1('Gender')),
        'sh': a1('Shape'),
        'mt': a1('Material').replace('Accetate', 'Acetate').replace('Combination', 'combination'),
        'col': a1('Color').replace('Colour', 'colour'),
        'two': two,
    })
dest = pathlib.Path('/Users/gokul/BOSYM /debril-home/catalog.json')
dest.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
print(len(out), 'frames ->', dest)
print(out[0]); print(out[1])
