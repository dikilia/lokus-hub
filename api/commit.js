// api/commit.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  // Check auth cookie
  const cookies = req.headers.cookie || '';
  if (!cookies.includes('admin_token=')) {
    return res.status(401).json({ error: 'Unauthorized - Please login first' });
  }
  
  try {
    const { content, message, filename, scriptData, isEdit } = req.body;
    if (!content || !message) return res.status(400).json({ error: 'Missing fields' });
    
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) return res.status(500).json({ error: 'GitHub token not configured' });
    
    // GitHub repo info
    const REPO_OWNER = 'dikilia';
    const REPO_NAME = 'lokus-hub';
    const FILE_PATH = filename || 'scripts.json';
    
    // Get current file SHA (required for updating)
    let sha = null;
    try {
      const getRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
        headers: { 
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      } else if (getRes.status !== 404) {
        const errorData = await getRes.json();
        throw new Error(`GitHub API error: ${errorData.message}`);
      }
      // If 404, file doesn't exist yet - that's fine for first commit
    } catch (error) {
      console.error('Error getting file SHA:', error);
      // Continue without SHA - will create new file
    }
    
    // Commit to GitHub
    const putRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        content: content,
        sha: sha || undefined
      })
    });
    
    const data = await putRes.json();
    if (!putRes.ok) throw new Error(data.message || 'GitHub commit failed');
    
    // ==================== DISCORD WEBHOOK ====================
    let discordResult = null;
    const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
    const WEBHOOK_ENABLED = process.env.WEBHOOK_ENABLED === 'true';
    
    // Send notification for adds and edits (not deletes)
    if (WEBHOOK_URL && WEBHOOK_ENABLED && scriptData) {
      try {
        // Get game name if universeId exists
        let gameName = 'Unknown';
        if (scriptData.universeId) {
          try {
            const gameRes = await fetch(`https://games.roblox.com/v1/games?universeIds=${scriptData.universeId}`);
            const gameData = await gameRes.json();
            gameName = gameData.data[0]?.name || 'Unknown';
          } catch (e) {
            console.error('Failed to fetch game name:', e);
          }
        }
        
        // Clean description (remove HTML tags for Discord)
        const cleanDescription = scriptData.description ? scriptData.description.replace(/<[^>]*>/g, '') : '*No description*';
        
        // Create rich embed
        const embed = {
          title: isEdit ? '✏️ Script Updated' : '✨ New Script Added',
          description: `**${scriptData.name}**\n\n${cleanDescription}`,
          color: isEdit ? 0xffaa00 : 0x00f2ea,
          fields: [
            { name: '🎮 Game', value: gameName, inline: true },
            { name: '🔑 Key System', value: scriptData.keySystem || 'keyless', inline: true },
            { name: '🔒 Blurred', value: scriptData.blurred ? 'Yes' : 'No', inline: true },
            { name: '📦 Features', value: (scriptData.features?.length || 'None'), inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'Lokus Hub Admin' }
        };
        
        // Add thumbnail if image exists
        if (scriptData.image) {
          embed.thumbnail = { url: scriptData.image };
        }
        
        // Send to Discord
        const discordRes = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Script Manager',
            avatar_url: 'https://lokus-hub-iscript.vercel.app/favicon.ico',
            embeds: [embed]
          })
        });
        
        discordResult = { success: discordRes.ok };
        console.log('✅ Discord notification sent');
      } catch (discordError) {
        console.error('Discord webhook error:', discordError);
        discordResult = { success: false, error: discordError.message };
      }
    }
    
    res.json({ 
      success: true, 
      commit: {
        sha: data.commit?.sha,
        url: data.commit?.html_url
      },
      discord: discordResult,
      message: '✅ Successfully committed to GitHub'
    });
    
  } catch (error) {
    console.error('❌ Serverless function error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}
