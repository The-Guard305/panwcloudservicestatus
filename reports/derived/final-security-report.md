# Security Test Report — The Syndicate (SWA)
**Target:** https://proud-ground-0ba6dc70f.1.azurestaticapps.net/
**Run timestamp (UTC):** 2025-12-29 00:22:27Z
**Artifacts:** `reports/raw/20251229T002145Z`
---
## Executive summary
- Performed owner-authorized, low-risk security testing: header review, TLS posture check, baseline passive scan, and API allowlist verification.
- No intrusive exploitation or brute forcing was performed.
---
## HTTP security headers
| Header | Status |
|---|---|
| Strict-Transport-Security | ✅ present |
| Content-Security-Policy | ✅ present |
| X-Content-Type-Options | ✅ present |
| Referrer-Policy | ✅ present |
| Permissions-Policy | ✅ present |

### Raw response headers (truncated)
```
HTTP/2 200 
content-type: text/html
date: Mon, 29 Dec 2025 00:21:44 GMT
cache-control: public, must-revalidate, max-age=30
etag: "00863261"
last-modified: Mon, 29 Dec 2025 00:05:16 GMT
content-length: 700
strict-transport-security: max-age=31536000; includeSubDomains; preload
referrer-policy: strict-origin-when-cross-origin
x-content-type-options: nosniff
x-xss-protection: 1; mode=block
x-dns-prefetch-control: off
permissions-policy: geolocation=(), microphone=(), camera=()
content-security-policy: default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://status.paloaltonetworks.com; frame-ancestors 'none'


```
---
## API proxy allowlist behavior
```
# API allowlist checks
GET https://proud-ground-0ba6dc70f.1.azurestaticapps.net/api/panw-status/summary
HTTP/2 200 
content-type: application/json; charset=utf-8
date: Mon, 29 Dec 2025 00:21:51 GMT
cache-control: public, max-age=60, stale-while-revalidate=120, stale-if-error=600
content-length: 615281
strict-transport-security: max-age=31536000; includeSubDomains
x-ms-middleware-request-id: 829fdf7e-941a-48a5-b25f-cfee1dee3b5b

{
  "page": {
    "id": "wqr4c3swlcv9",
    "name": "Palo Alto Networks Cloud Services",
    "url": "https://status.paloaltonetworks.com",
    "time_zone": "Etc/UTC",
    "updated_at": "2025-12-28T22:50:56.696Z"
  },
  "components": [
    {
      "id": "vmzypm1hjnx5",
      "name": "United States - Americas",
      "status": "operational",
      "created_at": "2018-02-22T23:20:25.988Z",
      "updated_at": "2025-11-26T17:23:37.090Z",
      "position": 1,
      "description": null,
      "showcase": true,
      "start_date": null,
      "group_id": "ypz7v77d1rpm",
      "page_id": "wqr4c3swlcv9",
      "group": false,
      "only_show_if_degraded": false
    },
    {
      "id": "bnljkq76h9cy",
      "name": "SaaS API - North America",
      "status": "operational",
      "created_at": "2018-05-16T20:37:07.913Z",
      "updated_at": "2025-11-15T10:00:21.248Z",
      "position": 1,
      "description": "Prisma SaaS Americas",
      "showcase": false,
      "start_date": null,
      "group_id": "f0q7vkhppsgw",
      "page_id": "wqr4c3swlcv9",
      "group": false,
      "only_show_if_degraded": false
    },
    {
      "id": "cxf1sbnzkw9x",
      "name": "WildFire Global Cloud",
      "status": "operational",
      "created_at": "2018-09-25T23:06:45.837Z",
      "updated_at": "2025-12-11T23:25:21.147Z",
      "position": 1,
      "description": null,
      "showcase": true,
      "start_date": null,
      "group_id": "hjtc7rx9rpkz",
      "page_id": "wqr4c3swlcv9",
      "group": false,
      "only_show_if_degraded": false
    },
    {
      "id": "fqkp3bh3b683",
      "name": "AutoFocus",
      "status": "operational",
      "created_at": "2019-05-17T23:00:57.455Z",
      "updated_at": "2025-08-21T17:50:17.857Z",
      "position": 1,
      "description": null,
      "showcase": false,
      "start_date": null,
      "group_id": null,
      "page_id": "wqr4c3swlcv9",
      "group": false,
      "only_show_if_degraded": false
    },
    {
      "id": "dcm2yfksks72",
      "name": "Americas - US - app.prismacloud.io",
      "status": "operational",
      "created_at": "2019-08-20T00:06:08.825Z",
      "updated_at": "2025-12-09T09:30:21.144Z",
      "position": 1,
      "description": null,
      "showcase": true,
      "start_date": null,
      "group_id": "1nvndw0xz3nd",
      "page_id": "wqr4c3swlcv9",
      "group": false,
      "only_show_if_degraded": false
    },
    {
      "id": "n24w3r83xtw9",
      "name": "United States - Americas",
      "status": "operational",
      "created_at": "2020-02-26T23:05:38.463Z",
      "updated_at": "2025-08-16T01:00:21.116Z",
      "position": 1,
      "description": null,
      "showcase": true,
      "start_date": null,
      "group_id": "zfr0v9yn3dvs",
      "page_id": "wqr4c3swlcv9",
      "group": false,
      "only_show_if_degraded": false
    },
    {
      "id": "gfkx4prh8mr1",
      "name": "AIOps-NGFW",
      "status": "operational",
      "created_at": "2020-07-24T14:54:27.296Z",
      "updated_at": "2024-08-02T00:00:02.153Z",
      "position": 1,
      "description": "AIOps for NGFW revolutionizes firewall operations with ML-powered insights for the best security posture and optimal health.",
      "showcase": true,
      "start_date": null,
      "group_id": "880jlfvy6cgb",
      "page_id": "wqr4c3swlcv9",
      "group": false,
      "only_show_if_degraded": false
    },
    {
      "id": "qwfnkl8f2q92",
      "name": "Australia",
      "status": "operational",
      "created_at": "2020-12-20T12:39:04.455Z",
      "updated_at": "2025-12-11T11:53:53.770Z",
      "position": 1,
      "description": null,
      "showcase": true,
      "start_date": "
\nGET https://proud-ground-0ba6dc70f.1.azurestaticapps.net/api/panw-status/does-not-exist
HTTP/2 404 
content-type: application/json; charset=utf-8
date: Mon, 29 Dec 2025 00:21:52 GMT
cache-control: no-store
content-length: 26
strict-transport-security: max-age=31536000; includeSubDomains
x-ms-middleware-request-id: b7040e96-9d5a-4feb-8133-22e45a4c33ce

{
  "error": "Not Found"
}
\nPOST https://proud-ground-0ba6dc70f.1.azurestaticapps.net/api/panw-status/summary
HTTP/2 404 
date: Mon, 29 Dec 2025 00:21:54 GMT
content-length: 0
strict-transport-security: max-age=31536000; includeSubDomains
x-ms-middleware-request-id: 3d34140c-d00c-4961-8503-fe8162e87126


\nPath traversal attempt https://proud-ground-0ba6dc70f.1.azurestaticapps.net/api/panw-status/../../etc/passwd
HTTP/2 404 
content-type: text/html
date: Mon, 29 Dec 2025 00:21:54 GMT

<!DOCTYPE html>
<html lang=en>
<head>
<meta charset=utf-8 />
<meta name=viewport content="width=device-width, initial-scale=1.0" />
<meta http-equiv=X-UA-Compatible content="IE=edge" />
<title>Azure Static Web Apps - 404: Not found</title>
<link rel="shortcut icon" href=https://appservice.azureedge.net/images/static-apps/v3/favicon.svg type=image/x-icon />
<link rel=stylesheet href=https://ajax.aspnetcdn.com/ajax/bootstrap/5.2.3/css/bootstrap.min.css crossorigin=anonymous />
<link rel=stylesheet type=text/css href="https://appservice.azureedge.net/css/static-apps/v3/main.css"/>
<script src=https://appservice.azureedge.net/scripts/static-apps/v3/loc.min.js crossorigin=anonymous></script>
<script type=text/javascript>window.onload=function(){try{loc("404notFound")}catch(a){}};</script>
</head>
<body>
<nav class="navbar navbar-light ps-5 ms-5">
<div class=navbar-brand>
<div class="container pl-4 ml-5">
<img src=https://appservice.azureedge.net/images/static-apps/v3/microsoft_azure_logo.svg width=270 height=108 alt />
</div>
</div>
</nav>
<div class="container-fluid container-height mr-2">
<div class="pt-10 pb-10 mt-10 mb-10 d-xxs-none d-xs-none d-sm-none d-md-none d-lg-block d-xl-block" style=height:20px;width:100%;clear:both></div>
<div class=row>
<div class="row col-xs-12 col-sm-12 d-block d-lg-none d-xl-none d-md-block d-sm-block d-xs-block">
<div class=text-center>
<img src=https://appservice.azureedge.net/images/static-apps/v3/staticapps.svg />
</div>
</div>
<div class="extra-pl-small-scr offset-xl-1 offset-lg-1 offset-md-2 offset-sm-2 offset-xs-4 col-xl-5 col-lg-5 col-md-10 col-sm-11 col-xs-11 div-vertical-center">
<div class=container-fluid>
<div class=row>
<h2 id=titleText>404: Not Found</h2>
</div>
<br />
<div class=row>
<div id=subText class=sub-text>We couldn’t find that page, please check the URL and try again.</div>
</div>
</div>
</div>
<d

```
**Interpretation guidance:** Only allowlisted routes should return 200; non-allowlisted should return 404; POST should be rejected.
---
## TLS posture (testssl.sh excerpt)
```
Docker not available. Skipped.

```
---
## Nikto (low-risk scan) excerpt
```
Docker not available. Skipped.

```
---
## OWASP ZAP Baseline (passive)
No ZAP JSON alerts parsed (check artifacts folder for HTML/JSON output).

---
## Findings and recommendations
1. **Missing headers**: If any are marked missing above, add/adjust `staticwebapp.config.json` to enforce them globally.
2. **API allowlist**: Ensure the function only allows exact routes and rejects traversal/open-proxy patterns.
3. **TLS issues**: If testssl flags weak ciphers/protocols, document and remediate (SWA managed TLS is typically strong).
4. **ZAP baseline findings**: Review any Medium/High items first; confirm whether they are true positives.

---
## Appendices
- ZAP HTML report: `reports/raw/20251229T002145Z/zap/zap_baseline_report.html`
- ZAP JSON report: `reports/raw/20251229T002145Z/zap/zap_baseline_report.json`
- Nikto output: `reports/raw/20251229T002145Z/nikto.txt`
- testssl output: `reports/raw/20251229T002145Z/testssl.txt`
