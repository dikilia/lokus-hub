// api/script/raw.js - Get raw script code only
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }
  
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).send('Script ID required');
    }
    
    const fs = require('fs');
    const path = require('path');
    const scriptsPath = path.join(process.cwd(), 'scripts.json');
    const fileContent = fs.readFileSync(scriptsPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    const script = data.scripts.find(s => s.id === id);
    
    if (!script) {
      return res.status(404).send('Script not found');
    }
    
    // Return raw code (like ScriptBlox raw endpoint)
    res.status(200).send(script.code);
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).send('Internal server error');
  }
}