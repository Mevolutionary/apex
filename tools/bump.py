#!/usr/bin/env python3
"""Release helper: sets the app version in all three places that must match.
Usage: python3 tools/bump.py 0.65
  index.html   VERSION='x'           (shown in the app, compared by the update check)
  version.json {"v":"x"}             (what installed copies check for a newer version, A4)
  sw.js        CACHE='apex-shell-vN' (new name so phones drop the old cached files)"""
import re,sys,json,pathlib
v=sys.argv[1];root=pathlib.Path(__file__).resolve().parent.parent
p=root/'index.html';s=p.read_text();s2,n=re.subn(r"VERSION='[^']+'",f"VERSION='{v}'",s,count=1);assert n==1;p.write_text(s2)
(root/'version.json').write_text(json.dumps({'v':v})+'\n')
p=root/'sw.js';s=p.read_text();s2,n=re.subn(r"apex-shell-v\d+",'apex-shell-v'+v.replace('.','').lstrip('0'),s,count=1);assert n==1;p.write_text(s2)
print('version',v)
