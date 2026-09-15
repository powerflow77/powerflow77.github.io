"""Check generated routes, local assets, source links, and migrated record counts.

Uses only Python's standard library. Run after `bundle exec jekyll build`.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / '_site'
errors = []

class Document(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.refs = []
        self.images = []
        self.ids = set()
        self.text = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.add(a['id'])
        for attr in ('href', 'src'):
            if a.get(attr):
                self.refs.append(a[attr])
        if tag == 'img':
            self.images.append(a)

    def handle_data(self, data):
        self.text.append(data)

docs = {p: Document(p.read_text(encoding='utf-8')) for p in SITE.rglob('*.html')}
assert docs, 'No generated HTML. Run the Jekyll build first.'
all_refs = {r for d in docs.values() for r in d.refs}

for p, doc in docs.items():
    for ref in doc.refs:
        u = urlparse(ref)
        if u.scheme in ('mailto', 'tel', 'data', 'javascript'):
            continue
        if u.netloc and u.netloc != 'powerflow77.github.io':
            continue
        dest = SITE / unquote(u.path).lstrip('/') if u.path.startswith('/') or u.netloc else p.parent / unquote(u.path)
        if not u.path:
            dest = p
        if dest.is_dir():
            dest /= 'index.html'
        if not dest.exists():
            errors.append(f'{p.relative_to(SITE)}: missing {ref}')
        elif u.fragment and dest.suffix == '.html':
            target = docs.get(dest.resolve()) or docs.get(dest)
            if target and unquote(u.fragment) not in target.ids:
                errors.append(f'{p.relative_to(SITE)}: missing anchor {ref}')
    for img in doc.images:
        if 'alt' not in img:
            errors.append(f'{p.relative_to(SITE)}: image lacks alt text')
        if urlparse(img.get('src', '')).netloc:
            errors.append(f'{p.relative_to(SITE)}: remote image {img["src"]}')

for p in (SITE / 'assets/css').glob('*.css'):
    for ref in re.findall(r'url\([\'\"]?([^\)\'\"]+)', p.read_text(encoding='utf-8')):
        if ref.startswith(('data:', 'http:', 'https:', '//')):
            continue
        path = unquote(urlparse(ref).path)
        dest = SITE / path.lstrip('/') if path.startswith('/') else p.parent / path
        if not dest.exists():
            errors.append(f'{p.relative_to(SITE)}: missing CSS asset {ref}')

inventory = json.loads((ROOT / 'migration/source-inventory.json').read_text(encoding='utf-8'))
def normalize(text):
    return re.sub(r'[^\w]', '', text).replace('ㅡ', '').lower()

for page in inventory['pages']:
    for route in page['destination_routes']:
        if not (SITE / route.strip('/') / 'index.html').exists():
            errors.append(f'Missing migrated route {route}')
    for link in page['links']:
        if link['href'] not in all_refs:
            errors.append(f'Missing source link: {link["href"]}')
    migrated_text = normalize(' '.join(' '.join(docs[SITE / route.strip('/') / 'index.html'].text) for route in page['destination_routes']))
    for paragraph in page['paragraphs']:
        if paragraph.startswith('>') or paragraph in ('Researcher', 'Research Area', 'Works') or set(paragraph) <= {'ㅡ', '='}:
            continue
        if normalize(paragraph) not in migrated_text:
            errors.append(f'Missing source text on {page["slug"]}: {paragraph}')

for collection, expected, directory in [('publications', 8, '_publications'), ('projects', 7, '_portfolio')]:
    assert len(inventory[collection]) == expected
    assert len(list((ROOT / directory).glob('*.html'))) == expected

for entry in inventory['publications']:
    if entry['id'].lower() not in docs[SITE / 'publications/index.html'].ids:
        errors.append(f'Missing publication {entry["id"]}')
for entry in inventory['projects']:
    if entry['id'].lower() not in docs[SITE / 'projects/index.html'].ids:
        errors.append(f'Missing project {entry["id"]}')

assets = json.loads((ROOT / 'migration/assets.json').read_text(encoding='utf-8'))
assert len(assets) == 14
for asset in assets:
    p = ROOT / asset['file']
    if hashlib.sha256(p.read_bytes()).hexdigest() != asset['sha256']:
        errors.append(f'Original image changed: {asset["file"]}')
    if not (SITE / asset['file']).exists():
        errors.append(f'Image missing from build: {asset["file"]}')

for p in docs:
    text = p.read_text(encoding='utf-8')
    for forbidden in ('Meiyi Li', 'mli30@lsu.edu', 'vYnoysMAAAAJ', 'OPAL Lab'):
        if forbidden in text:
            errors.append(f'Reference personal content in {p.relative_to(SITE)}: {forbidden}')
    if '{{' in text or '{%' in text:
        errors.append(f'Unrendered Liquid in {p.relative_to(SITE)}')

result = {'html_pages': len(docs), 'source_pages': len(inventory['pages']), 'publications': 8, 'projects': 7, 'original_images': len(assets), 'source_links': sum(len(p['links']) for p in inventory['pages']), 'errors': errors}
print(json.dumps(result, indent=2))
if errors:
    raise SystemExit(1)
