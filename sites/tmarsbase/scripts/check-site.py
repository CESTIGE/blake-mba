# -*- coding: utf-8 -*-
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json, re, gzip
root=Path(__file__).resolve().parents[1]/'dist'
class Page(HTMLParser):
 def __init__(self,source):
  super().__init__();self.ids=[];self.links=[];self.assets=[];self.h1=0;self.lang=None;self.canonical=False;self.fields=[];self.feed(source)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='html':self.lang=a.get('lang')
  if tag=='h1':self.h1+=1
  if tag=='a' and a.get('href'):self.links.append(a['href'])
  if tag in ('script','img') and a.get('src'):self.assets.append(a['src'])
  if tag=='link' and a.get('rel')=='stylesheet':self.assets.append(a['href'])
  if tag=='link' and a.get('rel')=='canonical':self.canonical=True
pages={p:Page(p.read_text()) for p in (root/'tmarsbase').rglob('index.html')}
issues=[];links=assets=0
for path,page in pages.items():
 if page.lang not in ('zh-Hant','en'):issues.append(f'{path}: missing supported language')
 if page.h1!=1:issues.append(f'{path}: {page.h1} h1 elements')
 if not page.canonical:issues.append(f'{path}: missing canonical')
 if len(page.ids)!=len(set(page.ids)):issues.append(f'{path}: duplicate IDs')
 for url in page.links+page.assets:
  parsed=urlsplit(url)
  if parsed.scheme or parsed.netloc:continue
  target=(root/parsed.path.lstrip('/')) if parsed.path.startswith('/') else (path.parent/parsed.path if parsed.path else path)
  if target.is_dir():target=target/'index.html'
  if not target.exists():issues.append(f'{path.relative_to(root)}: missing {url}')
  elif parsed.fragment and target.suffix=='.html':
   target_page=pages.get(target) or Page(target.read_text())
   if unquote(parsed.fragment) not in target_page.ids:issues.append(f'{path.relative_to(root)}: missing anchor {url}')
 links+=len(page.links);assets+=len(page.assets)
 for bad in ['问题','调整','用户','页面','客户','企业','选择','测试','数据','开发','免费','咨询','实现']:
  if bad in path.read_text():issues.append(f'{path.relative_to(root)}: simplified characters {bad}')
 for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>',path.read_text(),re.S):json.loads(m.group(1))
print(json.dumps({'pages':len(pages),'links':links,'assets':assets,'issues':issues,'javascript_gzip_bytes':sum(len(gzip.compress(p.read_bytes())) for p in (root/'assets').rglob('*.js'))},ensure_ascii=False,indent=2))
raise SystemExit(bool(issues))
