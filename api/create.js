const NOTION_TOKEN = process.env.NOTION_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const { dbId, properties } = req.body;

  const notionRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization':  `Bearer ${NOTION_TOKEN}`,
      'Content-Type':   'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({ parent: { database_id: dbId }, properties }),
  });

  const data = await notionRes.json();
  res.status(notionRes.status).json(data);
}
