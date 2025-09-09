const express = require('express');
const path = require('path');

// Node 18+ はグローバル fetch 利用可

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// 簡易プロキシ: /proxy?url=https://example.com
app.get('/proxy', async (req, res) => {
  try {
    const target = req.query.url;
    if (!target) {
      res.status(400).send('Missing url parameter');
      return;
    }
    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      res.status(400).send('Invalid URL');
      return;
    }
    if (!/^https?:$/.test(parsed.protocol)) {
      res.status(400).send('Only http/https allowed');
      return;
    }

    // できるだけ一般的なUAで取得（ブロック回避の一助）
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

    const response = await fetch(parsed.toString(), {
      headers: { 'User-Agent': ua, Accept: '*/*' },
      redirect: 'follow'
    });

    const contentType = response.headers.get('content-type') || '';

    // HTML の場合のみ <base> を注入
    if (contentType.includes('text/html')) {
      let html = await response.text();

      // 既存の X-Frame-Options/CSP ヘッダはここでは関係なし（我々が応答ヘッダを制御）
      // 相対パス解決のため、<head> の最初に <base href="..."> を差し込む
      const baseHref = parsed.toString();
      const baseTag = `<base href="${baseHref}">`;

      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, match => `${match}\n  ${baseTag}`);
      } else {
        // <head> が無ければ作る
        html = html.replace(/<html[^>]*>/i, match => `${match}\n<head>\n  ${baseTag}\n</head>`);
        if (!/<html[^>]*>/i.test(html)) {
          // <html> すらない極端なケース
          html = `<!doctype html>\n<html>\n<head>\n  ${baseTag}\n</head>\n<body>\n${html}\n</body>\n</html>`;
        }
      }

      // 念のため content-security-policy の meta は削除（自己注入スクリプトを阻害し得るため）
      html = html.replace(/<meta[^>]*http-equiv=["']content-security-policy["'][^>]*>/gi, '');

      // 常時プロキシ化: a要素のクリック/GETフォーム送信をフックして、/proxy経由のURLに誘導
      const injectScript = `\n<script>(function(){\n  try {\n    var PROXY_PREFIX = '/proxy?url=';\n    function abs(href){\n      try { return new URL(href, document.baseURI).toString(); } catch(e){ return null; }\n    }\n    function httpish(url){\n      if(!url) return false;\n      try { var u = new URL(url); return u.protocol==='http:'||u.protocol==='https:'; } catch(e){ return false; }\n    }\n    function toProxy(url){ return PROXY_PREFIX + encodeURIComponent(url); }\n\n    document.addEventListener('click', function(e){\n      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;\n      if(!a) return;\n      var raw = a.getAttribute('href');\n      if(!raw) return;\n      if(raw.startsWith('#') || raw.startsWith('javascript:')) return;\n      var url = abs(raw);\n      if(!httpish(url)) return;\n      e.preventDefault();\n      window.location.assign(toProxy(url));\n    }, true);\n\n    document.addEventListener('submit', function(e){\n      var form = e.target;\n      if(!(form && form.tagName==='FORM')) return;\n      var method = (form.getAttribute('method')||'GET').toUpperCase();\n      var actionRaw = form.getAttribute('action') || location.href;\n      var actionAbs = abs(actionRaw);\n      if(!httpish(actionAbs)) return;\n      if(method==='GET'){\n        e.preventDefault();\n        var fd = new FormData(form);\n        var params = new URLSearchParams(fd).toString();\n        var base = actionAbs.split('#')[0];\n        var newUrl = base + (base.indexOf('?')>=0 ? '&' : '?') + params;\n        window.location.assign(toProxy(newUrl));\n      } else {\n        // POSTなどはそのまま送信（必要に応じてPOSTプロキシを実装）\n      }\n    }, true);\n  } catch(e){}\n})();</script>\n`;

      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (match) => `${match}\n  ${injectScript}`);
      } else if (/<body[^>]*>/i.test(html)) {
        html = html.replace(/<body[^>]*>/i, (match) => `${match}\n  ${injectScript}`);
      } else {
        html += injectScript;
      }

      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.send(html);
      return;
    }

    // HTML 以外はそのまま中継
    res.setHeader('content-type', contentType);
    // 一部ヘッダを転送
    const passHeaders = ['cache-control', 'content-disposition'];
    for (const h of passHeaders) {
      const val = response.headers.get(h);
      if (val) res.setHeader(h, val);
    }
    const buf = Buffer.from(await response.arrayBuffer());
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).send('Proxy error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
