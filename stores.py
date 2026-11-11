"""De Bril partner stores -> stores.json.
Source: the 'Find a store' lookups on buydb.in (admin-ajax my_ajax_action..4), crawled into stores_raw.json.
Refresh: re-crawl buydb.in/locate-us (admin-ajax my_ajax_action..4) into stores_raw.json, then  python3 stores.py stores_raw.json"""
import json, re, sys, html, pathlib

raw = json.load(open(sys.argv[1]))['raw']
SMALL = {'and', 'of', 'the', 'opp.', 'near', 'nr.'}

def tidy(s):
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s)).replace('\xa0', ' ')
    return re.sub(r'\s+', ' ', s).strip(' ,')

def title(s):
    # shouty words become Title case; real initialisms stay as written
    KEEP = {'ZAG', 'JK', 'KM', 'RG', 'SJ', 'MG', 'TV'}
    fix = lambda w: w if (not w.strip(',.').isalpha() or not w.isupper() or len(w) < 2 or w in KEEP) else ('and' if w == 'AND' else w.capitalize())
    return ' '.join(fix(w) for w in s.split()).strip()

def district_name(d):
    return {'Thiruvanathapuram': 'Thiruvananthapuram'}.get(d, d)

out, seen = [], set()
for key, h in raw.items():
    _, dist, place = key.split('|')
    for blk in re.findall(r'(?s)<div class="main_shop_name">(.*?)</div>', h.replace('\\', '')):
        name = tidy(''.join(re.findall(r'(?s)<h2>(.*?)</h2>', blk)))
        rest = re.sub(r'(?s)<h2>.*?</h2>', '', blk)
        rest = re.sub(r'^\s*<h3>', '', rest, count=1)  # outer wrapper <h3> around everything
        parts = [tidy(p) for p in re.findall(r'(?s)<(h3|h4|p)[^>]*>(.*?)</\1>', rest) for p in [p[1]]]
        parts = [p for p in parts if p]
        phone = next((p for p in parts if re.match(r'(ph|phone)', p, re.I)), '')
        addr = next((p for p in parts if p != phone), '')
        # one or more numbers, as written; drop fragments too short to dial
        nums = [n.strip() for n in re.split(r'[,/&]', re.sub(r'^(phone|ph)\s*:?\s*', '', phone, flags=re.I))]
        digits = [n for n in nums if len(re.sub(r'\D', '', n)) >= 9]
        name = title(name.rstrip(','))
        name = re.sub(r',\s*[^,]*$', '', name) if name.count(',') == 1 and name.split(',')[1].strip().lower() in place.lower() + ' chalakudy' else name
        k = (name.lower(), tuple(digits))
        if not name or k in seen:
            continue
        seen.add(k)
        out.append({'n': re.sub(r'\s+,', ',', name).strip(' ,'), 'a': addr, 'ph': digits, 'd': district_name(dist), 'p': place.strip()})

out.sort(key=lambda s: (s['d'], s['p'], s['n']))
dest = pathlib.Path(__file__).with_name('stores.json')
dest.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
print(len(out), 'stores ->', dest)
bad = [s for s in out if not s['ph'] or not s['a'] or any(len(re.sub(r'\D', '', n)) not in (10, 11, 12) for n in s['ph'])]
print('check:', bad)
