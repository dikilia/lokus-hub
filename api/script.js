// api/script.js - Get individual script by ID
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Script ID required' });
    }
    
    // Load scripts.json
    const fs = require('fs');
    const path = require('path');
    const scriptsPath = path.join(process.cwd(), 'scripts.json');
    const fileContent = fs.readFileSync(scriptsPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Find the script
    const script = data.scripts.find(s => s.id === id);
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Format response like ScriptBlox API
    res.status(200).json({
      script: {
        _id: script.id,
        title: script.name,
        description: script.longDescription || script.description,
        code: script.code,
        game: {
          name: script.game || 'Unknown',
          imageUrl: script.image || null
        },
        owner: {
          username: script.author || 'Anonymous',
          profilePicture: script.authorAvatar || null
        },
        views: script.views || 0,
        likes: script.favorites || 0,
        downloads: script.downloads || 0,
        createdAt: script.date || new Date().toISOString(),
        blurred: script.blurred || false,
        features: script.features || [],
        keySystem: script.keySystem || 'keyless',
        universeId: script.universeId || null
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
