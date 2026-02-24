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
    
    // Get current file SHA
    const getRes = await fetch(`https://api.github.com/repos/dikilia/lokus-hub/contents/${filename || 'scripts.json'}`, {
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
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
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
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
    
    // Send Discord notification (NO REDIRECT URL INCLUDED)
    let discordResult = null;
    if (process.env.DISCORD_WEBHOOK_URL && process.env.WEBHOOK_ENABLED === 'true' && scriptData) {
      try {
        // Create embed WITHOUT redirect URL
        const embed = {
          title: isEdit ? '✏️ Script Updated' : '✨ New Script Added',
          description: `**${scriptData.name}**\n\n${scriptData.description || '*No description provided*'}`,
          color: isEdit ? 0xffaa00 : 0x00f2ea,
          fields: [
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
        
        // NO REDIRECT URL FIELD ADDED HERE - PUBLIC CAN'T SEE IT
        
        const discordRes = await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Script Manager',
            avatar_url: 'https://lokus-hub-iscript.vercel.app/favicon.ico',
            embeds: [embed]
          })
        });
        
        discordResult = { success: discordRes.ok };
      } catch (discordError) {
        console.error('Discord webhook error:', discordError);
        discordResult = { success: false, error: discordError.message };
      }
    }
    
    res.json({ success: true, commit: data.commit, discord: discordResult });
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ error: error.message });
  }
}
