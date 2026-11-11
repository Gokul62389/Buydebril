"""Cache-busting: stamp every site.css / *.js link in the HTML pages with a hash of the file,
so browsers fetch the new file as soon as it changes. Run after editing CSS/JS:  python3 bust.py"""
import hashlib, pathlib, re

root = pathlib.Path(__file__).parent
assets = {p.name: hashlib.md5(p.read_bytes()).hexdigest()[:8] for p in [*root.glob('*.css'), *root.glob('*.js')]}
for page in root.glob('*.html'):
    t = page.read_text()
    n = re.sub(r'((?:href|src)=")([\w-]+\.(?:css|js))(?:\?v=\w+)?(")',
               lambda m: f'{m[1]}{m[2]}?v={assets[m[2]]}{m[3]}' if m[2] in assets else m[0], t)
    if n != t:
        page.write_text(n)
        print('stamped', page.name)
