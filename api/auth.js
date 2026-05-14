export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') { res.status(405).json({ ok: false }); return; }
  const password = req.body?.password ?? '';
  const expected = process.env.QA_PASSWORD ?? '';
  if (expected && password === expected) {
    res.status(200).json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: '비밀번호가 틀렸습니다' });
  }
}
