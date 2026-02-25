// api/shorten.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Try is.gd first (most reliable, no API key needed)
    try {
      const isgdRes = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
      if (isgdRes.ok) {
        const shortUrl = await isgdRes.text();
        return res.json({ 
          success: true, 
          shortUrl: shortUrl.trim(),
          method: 'external'
        });
      }
    } catch (e) {
      console.log('is.gd failed, trying v.gd...');
    }
    
    // Try v.gd as backup
    try {
      const vgdRes = await fetch(`https://v.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
      if (vgdRes.ok) {
        const shortUrl = await vgdRes.text();
        return res.json({ 
          success: true, 
          shortUrl: shortUrl.trim(),
          method: 'external'
        });
      }
    } catch (e) {
      console.log('v.gd failed, using local fallback...');
    }
    
    // Generate a local short code as last resort
    const shortCode = Math.random().toString(36).substring(2, 8);
    const shortUrl = `${req.headers.origin}/s/${shortCode}`;
    
    // In production, you'd store this mapping in a database
    // For now, it's just a display-only link
    
    res.json({ 
      success: true, 
      shortUrl: shortUrl,
      method: 'local',
      note: 'This is a local short link (for display only)'
    });
    
  } catch (error) {
    console.error('Shorten error:', error);
    res.status(500).json({ 
      error: 'Failed to shorten URL',
      details: error.message 
    });
  }
}
