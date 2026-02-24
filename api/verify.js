// api/verify.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  // Check if admin_token cookie exists
  const cookies = req.headers.cookie || '';
  const hasToken = cookies.includes('admin_token=');
  
  res.json({ authenticated: hasToken });
}