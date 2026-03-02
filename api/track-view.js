// api/track-view.js - Increment view count
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Script ID required' });
    }
    
    // Load and update scripts.json
    const fs = require('fs');
    const path = require('path');
    const scriptsPath = path.join(process.cwd(), 'scripts.json');
    const fileContent = fs.readFileSync(scriptsPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    const script = data.scripts.find(s => s.id === id);
    if (script) {
      script.views = (script.views || 0) + 1;
      fs.writeFileSync(scriptsPath, JSON.stringify(data, null, 2));
    }
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Track error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
}
