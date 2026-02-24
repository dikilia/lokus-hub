// api/commit.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  // Check password
  if (req.headers.authorization !== 'Bearer noobie123admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { content, message, filename } = req.body;
    if (!content || !message) return res.status(400).json({ error: 'Missing fields' });
    
    // GitHub token from environment variable (set in Vercel)
    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(500).json({ error: 'GitHub token not configured' });
    
    // Get current file SHA
    const getRes = await fetch(`https://api.github.com/repos/dikilia/lokus-hub/contents/${filename || 'scripts.json'}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    let sha = null;
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }
    
    // Commit to GitHub
    const putRes = await fetch(`https://api.github.com/repos/dikilia/lokus-hub/contents/${filename || 'scripts.json'}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        content,
        sha
      })
    });
    
    const data = await putRes.json();
    if (!putRes.ok) throw new Error(data.message);
    
    res.json({ success: true, commit: data.commit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}