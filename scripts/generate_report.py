import os, re, json, datetime

TARGET = os.environ.get('TARGET_URL', 'https://proud-ground-0ba6dc70f.1.azurestaticapps.net/')
LATEST_PATH_FILE = 'reports/raw/LATEST_RUN_PATH.txt'


def read_text(p, limit=None):
  try:
    with open(p, 'r', errors='ignore') as f:
      data = f.read()
      if limit:
        return data[:limit]
      return data
  except FileNotFoundError:
    return ''


def extract_headers(headers_txt: str):
  # crude parse of curl -D output
  lines = [l.strip('\r') for l in headers_txt.splitlines() if l.strip()]
  hdrs = {}
  for l in lines:
    if ':' in l and not l.lower().startswith('http/'):
      k,v = l.split(':',1)
      hdrs[k.strip().lower()] = v.strip()
  return hdrs


def summarize_headers(hdrs):
  keys = ['strict-transport-security','content-security-policy','x-content-type-options','referrer-policy','permissions-policy']
  out = []
  for k in keys:
    # Display name can be Title Case, lookup key is lowercase
    display = '-'.join([w.capitalize() for w in k.split('-')])
    # Fix specific capitalizations if needed, e.g. CSP
    if k == 'content-security-policy': display = 'Content-Security-Policy'
    if k == 'strict-transport-security': display = 'Strict-Transport-Security'
    
    out.append((display, '✅ present' if k in hdrs else '❌ missing'))
  return out


def parse_zap_json(path):
  try:
    with open(path,'r') as f:
      return json.load(f)
  except Exception:
    return None


def main():
  if not os.path.exists(LATEST_PATH_FILE):
    raise SystemExit('No run found. Execute scripts/pentest.sh first.')

  run_path = read_text(LATEST_PATH_FILE).strip()
  ts = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%SZ')

  headers_raw = read_text(os.path.join(run_path,'headers.txt'))
  hdrs = extract_headers(headers_raw)
  header_summary = summarize_headers(hdrs)

  testssl = read_text(os.path.join(run_path,'testssl.txt'), limit=12000)
  nikto = read_text(os.path.join(run_path,'nikto.txt'), limit=12000)
  api_allow = read_text(os.path.join(run_path,'api_allowlist_checks.txt'), limit=12000)

  zap_json_path = os.path.join(run_path,'zap','zap_baseline_report.json')
  zap = parse_zap_json(zap_json_path)
  zap_alerts = []
  if zap and isinstance(zap, dict):
    sites = zap.get('site') or []
    for s in sites:
      for a in s.get('alerts', []) or []:
        zap_alerts.append({
          'risk': a.get('riskdesc',''),
          'name': a.get('name',''),
          'count': len(a.get('instances',[]) or [])
        })

  # Build report
  out = []
  out.append(f"# Security Test Report — The Syndicate (SWA)\n")
  out.append(f"**Target:** {TARGET}\n")
  out.append(f"**Run timestamp (UTC):** {ts}\n")
  out.append(f"**Artifacts:** `{run_path}`\n")

  out.append('---\n')
  out.append('## Executive summary\n')
  out.append('- Performed owner-authorized, low-risk security testing: header review, TLS posture check, baseline passive scan, and API allowlist verification.\n')
  out.append('- No intrusive exploitation or brute forcing was performed.\n')

  out.append('---\n')
  out.append('## HTTP security headers\n')
  out.append('| Header | Status |\n|---|---|\n')
  for k,v in header_summary:
    out.append(f"| {k} | {v} |\n")

  out.append('\n### Raw response headers (truncated)\n')
  out.append('```\n' + headers_raw[:4000] + '\n```\n')

  out.append('---\n')
  out.append('## API proxy allowlist behavior\n')
  out.append('```\n' + api_allow + '\n```\n')
  out.append('**Interpretation guidance:** Only allowlisted routes should return 200; non-allowlisted should return 404; POST should be rejected.\n')

  out.append('---\n')
  out.append('## TLS posture (testssl.sh excerpt)\n')
  out.append('```\n' + testssl + '\n```\n')

  out.append('---\n')
  out.append('## Nikto (low-risk scan) excerpt\n')
  out.append('```\n' + nikto + '\n```\n')

  out.append('---\n')
  out.append('## OWASP ZAP Baseline (passive)\n')
  if zap_alerts:
    out.append('| Risk | Alert | Instances |\n|---|---|---|\n')
    for a in sorted(zap_alerts, key=lambda x: x['risk'], reverse=True)[:50]:
      out.append(f"| {a['risk']} | {a['name']} | {a['count']} |\n")
  else:
    out.append('No ZAP JSON alerts parsed (check artifacts folder for HTML/JSON output).\n')

  out.append('\n---\n')
  out.append('## Findings and recommendations\n')
  out.append('1. **Missing headers**: If any are marked missing above, add/adjust `staticwebapp.config.json` to enforce them globally.\n')
  out.append('2. **API allowlist**: Ensure the function only allows exact routes and rejects traversal/open-proxy patterns.\n')
  out.append('3. **TLS issues**: If testssl flags weak ciphers/protocols, document and remediate (SWA managed TLS is typically strong).\n')
  out.append('4. **ZAP baseline findings**: Review any Medium/High items first; confirm whether they are true positives.\n')

  out.append('\n---\n')
  out.append('## Appendices\n')
  out.append(f"- ZAP HTML report: `{run_path}/zap/zap_baseline_report.html`\n")
  out.append(f"- ZAP JSON report: `{run_path}/zap/zap_baseline_report.json`\n")
  out.append(f"- Nikto output: `{run_path}/nikto.txt`\n")
  out.append(f"- testssl output: `{run_path}/testssl.txt`\n")

  os.makedirs('reports/derived', exist_ok=True)
  out_path = 'reports/derived/final-security-report.md'
  with open(out_path,'w') as f:
    f.write(''.join(out))

  print('✅ Wrote', out_path)


if __name__ == '__main__':
  main()
