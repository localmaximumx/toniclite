import { getUserIdFromSession, saveUserNote } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.body?.token;
    const { url, note, slug } = req.body || {};
    const noteKey = url || slug;

    if (!token || !noteKey) {
      return res.status(400).json({ error: 'Missing token or lesson url/slug.' });
    }

    const userId = await getUserIdFromSession(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    await saveUserNote(userId, noteKey, note || '');
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Save notes error:', err);
    return res.status(500).json({ error: 'Failed to save note to user database.' });
  }
}
