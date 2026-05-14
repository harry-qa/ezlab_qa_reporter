const http = require('http');
const fs   = require('fs');
const path = require('path');

const NOTION_TOKEN = process.env.NOTION_TOKEN || 'ntn_N3325381038bf8A7Q5ehAdFlwKCMWyCfpbWLji3ejpe7iU';
const PORT         = process.env.PORT || 8787;

const HEADERS = {
  'Authorization':  `Bearer ${NOTION_TOKEN}`,
  'Content-Type':   'application/json',
  'Notion-Version': '2022-06-28',
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function extractPageId(url) {
  // URL에서 32자리 ID 추출 (하이픈 제거 후)
  const match = url.match(/([a-f0-9]{32})/i) || url.match(/([a-f0-9-]{36})/i);
  if (!match) return null;
  return match[1].replace(/-/g, '');
}

function formatId(raw) {
  // 32자리 → UUID 형식으로 변환
  const s = raw.replace(/-/g, '');
  return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // POST /resolve-db — 페이지 URL → 이슈 보드 DB ID 자동 탐색
  if (req.method === 'POST' && req.url === '/resolve-db') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', async () => {
      try {
        const { pageUrl } = JSON.parse(body);
        const rawId = extractPageId(pageUrl);
        if (!rawId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '유효한 노션 URL이 아닙니다' }));
          return;
        }

        const pageId = formatId(rawId);
        const notionRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
          headers: HEADERS,
        });
        const data = await notionRes.json();

        if (!notionRes.ok) {
          res.writeHead(notionRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: data.message || '페이지를 찾을 수 없습니다' }));
          return;
        }

        const db = data.results?.find(b => b.type === 'child_database');
        if (!db) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '이슈 보드 DB를 찾을 수 없습니다. Integration 연결을 확인해주세요.' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ dbId: db.id, dbTitle: db.child_database?.title }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /create — Notion 버그 티켓 생성
  if (req.method === 'POST' && req.url === '/create') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', async () => {
      try {
        const { dbId, properties } = JSON.parse(body);
        const notionRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify({ parent: { database_id: dbId }, properties }),
        });
        const data = await notionRes.json();
        res.writeHead(notionRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // GET / — index.html
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const file = fs.readFileSync(path.join(__dirname, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(file);
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`QA 버그 리포터 실행 중 → http://localhost:${PORT}`);
});
