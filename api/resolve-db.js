const NOTION_TOKEN = process.env.NOTION_TOKEN;

function extractPageId(url) {
  const match = url.match(/([a-f0-9]{32})/i) || url.match(/([a-f0-9-]{36})/i);
  if (!match) return null;
  return match[1].replace(/-/g, '');
}

function formatId(raw) {
  const s = raw.replace(/-/g, '');
  return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const { pageUrl } = req.body;
  const rawId = extractPageId(pageUrl);
  if (!rawId) { res.status(400).json({ error: '유효한 노션 URL이 아닙니다' }); return; }

  const pageId = formatId(rawId);

  // 1. 페이지 하위 블록에서 child_database 찾기
  const blocksRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28' },
  });
  const blocksData = await blocksRes.json();

  if (!blocksRes.ok) {
    res.status(blocksRes.status).json({ error: blocksData.message || '페이지를 찾을 수 없습니다' });
    return;
  }

  const db = blocksData.results?.find(b => b.type === 'child_database');
  if (!db) {
    res.status(404).json({ error: '이슈 보드 DB를 찾을 수 없습니다. Integration 연결을 확인해주세요.' });
    return;
  }

  // 2. DB 스키마 조회 → 필드 타입 확인
  const dbRes = await fetch(`https://api.notion.com/v1/databases/${db.id}`, {
    headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28' },
  });
  const dbData = await dbRes.json();

  const fieldTypes = {};
  if (dbData.properties) {
    for (const [name, prop] of Object.entries(dbData.properties)) {
      fieldTypes[name] = prop.type;
    }
  }

  res.status(200).json({ dbId: db.id, dbTitle: db.child_database?.title, fieldTypes });
}
