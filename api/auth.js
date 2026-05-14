export default function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }
  const { password } = req.body;
  if (password === process.env.QA_PASSWORD) {
    res.status(200).json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: '비밀번호가 틀렸습니다' });
  }
}
