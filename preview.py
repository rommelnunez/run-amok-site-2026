from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import hashlib
ROOT=Path(__file__).parent/'dist'
def revision():
 h=hashlib.sha256()
 for p in sorted(ROOT.rglob('*')):
  if p.is_file():h.update(str(p).encode());h.update(p.read_bytes())
 return h.hexdigest()
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  if self.path=='/__revision':
   data=revision().encode();self.send_response(200);self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data)
  elif self.path.split('?')[0] in ('/','/index.html'):
   data=(ROOT/'index.html').read_text().replace('</body>',"<script>let rev;setInterval(async()=>{try{const next=await(await fetch('/__revision',{cache:'no-store'})).text();if(rev&&rev!==next)location.reload();rev=next}catch{}},700)</script></body>").encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data)
  else:super().do_GET()
 def log_message(self,*args):pass
print('Local preview: http://localhost:8765 (automatic reload enabled)',flush=True)
ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
