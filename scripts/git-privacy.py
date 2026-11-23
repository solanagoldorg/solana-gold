#!/usr/bin/env python3
"""First-party commit/push privacy checks. Hooks can be bypassed; review still matters."""
import hashlib,json,os,re,subprocess,sys
TEAM='Solana Gold Labs'
ROOT_SUBJECT='Initial Solana Gold source'
DENIED=set()
def git(*args):
 return subprocess.check_output(['git',*args],stderr=subprocess.DEVNULL)
_TERMS=None
def local_terms():
 """Extra denied words kept only on the maintainer's machine in .tools/privacy-terms.txt (never committed)."""
 global _TERMS
 if _TERMS is None:
  _TERMS=[]
  try:
   root=git('rev-parse','--show-toplevel').decode().strip()
   with open(os.path.join(root,'.tools','privacy-terms.txt'),encoding='utf-8') as f:
    _TERMS=[l.strip() for l in f if l.strip() and not l.startswith('#')]
  except (OSError,subprocess.CalledProcessError):pass
 return _TERMS
def scan(data):
 if b'\0' in data:return
 text=data.decode('utf-8','replace')
 if re.search(r'/(?:Users|home)/[^\s/]+/',text):raise ValueError('Personal home-directory path')
 if re.search(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',text):raise ValueError('Email address')
 if re.search(r'(?i)'+ 'Mac'+'Book'+r'[^\s]*\.'+'local'+r'|BEGIN (?:[A-Z ]+)?PRIVATE KEY',text):raise ValueError('Machine identity or private key')
 for token in re.findall(r'[A-Za-z0-9]+(?:[-_.][A-Za-z0-9]+)*',text):
  if hashlib.sha256(token.casefold().encode()).hexdigest() in DENIED:raise ValueError('Protected personal identifier')
 for term in local_terms():
  if re.search(r'(?i)(?<![A-Za-z0-9])'+re.escape(term)+r'(?![A-Za-z0-9])',text):raise ValueError('Protected term from the local deny list')
 if re.search(r'(?i)secretKey\s*[:=]\s*\[[0-9,\s]{100,}\]',text):raise ValueError('Literal private-key array')
 try:v=json.loads(text)
 except (ValueError,TypeError):return
 if isinstance(v,list) and len(v)==64 and all(type(x)is int and 0<=x<=255 for x in v):raise ValueError('Raw keypair JSON')
def identity():
 for kind in ['AUTHOR','COMMITTER']:
  ident=git('var','GIT_'+kind+'_IDENT').decode()
  if not ident.startswith(TEAM+' <> '):raise ValueError('Use the team identity with an empty email address')
def changes():
 for path in git('diff','--cached','--name-only','--diff-filter=ACMR','-z').split(b'\0'):
  if not path:continue
  name=path.decode()
  if name.startswith(('.data/','.tools/')) or re.search(r'(?:keypair|id_rsa|id_ed25519)(?:\.json)?$',name):raise ValueError('Private runtime/key file staged')
  if name.startswith(('engine/agave/','THIRD_PARTY_NOTICES.md')):continue # Preserve upstream author/license text.
  data=git('show',':'+name)
  if len(data)>16_777_216:raise ValueError('Large staged file requires separate review')
  scan(data)
def push(lines):
 for line in lines:
  local,sha,remote,prior=line.split()
  if local!='refs/heads/main' or remote!='refs/heads/main':raise ValueError('Only the main branch is configured for publication')
  if sha=='0'*40:raise ValueError('Remote deletion requires separate review')
  try:roots=git('rev-list','--max-parents=0',sha).decode().splitlines()
  except subprocess.CalledProcessError:raise ValueError('Publication requires a valid new-project commit')
  if len(roots)!=1 or git('show','-s','--format=%s',roots[0]).decode().strip()!=ROOT_SUBJECT:raise ValueError('Publication requires the fresh project root')
  for commit in git('rev-list',sha).decode().splitlines():
   scan(git('show','-s','--format=%B',commit))
   for path in git('diff-tree','--root','--no-commit-id','--name-only','--diff-filter=ACMR','-r',commit,'-z').split(b'\0'):
    if not path:continue
    name=path.decode()
    if name.startswith(('.data/','.tools/')):raise ValueError('Private runtime history')
    if not name.startswith(('engine/agave/','THIRD_PARTY_NOTICES.md')):scan(git('show',commit+':'+name))

def main():
 try:
  mode=sys.argv[1]
  if mode=='stage':identity();changes()
  elif mode=='message':scan(open(sys.argv[2],'rb').read())
  elif mode=='push':push(sys.stdin.read().splitlines())
  else:raise ValueError('Unknown privacy check')
 except (ValueError,subprocess.CalledProcessError) as e:
  print('Privacy guard blocked the operation: '+str(e),file=sys.stderr);return 1
 return 0
if __name__=='__main__':raise SystemExit(main())
