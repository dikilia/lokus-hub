// api/commit.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  // ==================== AUTH CHECK ====================
  // Check if user is logged in via cookie
  const cookies = req.headers.cookie || '';
  if (!cookies.includes('admin_token=')) {
    return res.status(401).json({ error: 'Unauthorized - Please login first' });
  }
  
  // ==================== IP WHITELIST ====================
  // Get client IP (works with Vercel)
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  
  // Your allowed IPs - REPLACE WITH YOUR ACTUAL IPS
  const ALLOWED_IPS = [
    'YOUR.HOME.IP.HERE',      // Replace with your home IP
    'YOUR.MOBILE.IP.HERE',    // Replace with your mobile IP if needed
    // Add more IPs as needed
  ];
  
  // For testing, you can comment this out, but for production, uncomment:
  /*
  if (!ALLOWED_IPS.includes(clientIP)) {
    console.log(`🚫 Blocked access from IP: ${clientIP}`);
    return res.status(403).json({ error: 'Access denied - IP not whitelisted' });
  }
  */
  
  // ==================== RATE LIMITING ====================
  const rateLimit = new Map();
  
  function checkRateLimit(ip) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 20; // 20 requests per minute
    
    const userRequests = rateLimit.get(ip) || [];
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    rateLimit.set(ip, recentRequests);
    
    // Clean up old entries every hour
    if (Math.random() < 0.001) { // 0.1% chance to cleanup
      for (const [ip, times] of rateLimit.entries()) {
        const validTimes = times.filter(time => now - time < windowMs);
        if (validTimes.length === 0) {
          rateLimit.delete(ip);
        } else {
          rateLimit.set(ip, validTimes);
        }
      }
    }
    
    return true;
  }
  
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ error: 'Too many requests - please slow down' });
  }
  
  // ==================== MAIN FUNCTION ====================
  try {
    const { content, message, filename, scriptData, isEdit } = req.body;
    
    // Validate required fields
    if (!content || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get GitHub token from environment variable
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN not set in environment');
      return res.status(500).json({ error: 'GitHub token not configured' });
    }
    
    // Repository information
    const REPO_OWNER = 'dikilia';
    const REPO_NAME = 'lokus-hub';
    const FILE_PATH = filename || 'scripts.json';
    
    // ==================== GET CURRENT FILE SHA ====================
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
        // If error is not "file not found", throw it
        const errorData = await getRes.json();
        throw new Error(`GitHub API error: ${errorData.message}`);
      }
      // If 404, file doesn't exist yet (first commit) - that's fine
    } catch (error) {
      console.error('Error getting file SHA:', error);
      // Continue without SHA - will create new file
    }
    
    // ==================== COMMIT TO GITHUB ====================
    let commitData;
    try {
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
      
      commitData = await putRes.json();
      
      if (!putRes.ok) {
        throw new Error(commitData.message || 'GitHub commit failed');
      }
      
      console.log(`✅ GitHub commit successful: ${commitData.commit?.sha}`);
    } catch (error) {
      console.error('GitHub commit error:', error);
      throw new Error(`GitHub error: ${error.message}`);
    }
    
    // ==================== SEND DISCORD NOTIFICATION ====================
    let discordResult = null;
    if (process.env.DISCORD_WEBHOOK_URL && process.env.WEBHOOK_ENABLED === 'true' && scriptData) {
      try {
        // Create rich embed for Discord
        const embed = {
          title: isEdit ? '✏️ Script Updated' : '✨ New Script Added',
          description: `**${scriptData.name}**`,
          color: isEdit ? 0xffaa00 : 0x00f2ea, // Orange for edit, cyan for new
          fields: [
            { 
              name: '🔑 Key System', 
              value: scriptData.keySystem || 'keyless', 
              inline: true 
            },
            { 
              name: '🔒 Blurred', 
              value: scriptData.blurred ? 'Yes' : 'No', 
              inline: true 
            },
            { 
              name: '📦 Features', 
              value: (scriptData.features?.length || 'None'), 
              inline: true 
            }
          ],
          timestamp: new Date().toISOString(),
          footer: { 
            text: `Lokus Hub Admin • ${new Date().toLocaleString()}` 
          }
        };
        
        // Add redirect URL if exists
        if (scriptData.redirectUrl) {
          embed.fields.push({ 
            name: '🔗 Redirect URL', 
            value: scriptData.redirectUrl, 
            inline: false 
          });
        }
        
        // Send to Discord
        const discordRes = await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Script Manager',
            avatar_url: 'https://lokus-hub-iscript.vercel.app/favicon.ico',
            embeds: [embed]
          })
        });
        
        if (discordRes.ok) {
          discordResult = { success: true };
          console.log('✅ Discord notification sent');
        } else {
          const discordError = await discordRes.text();
          console.error('Discord webhook error:', discordError);
          discordResult = { success: false, error: discordError };
        }
      } catch (discordError) {
        console.error('Discord webhook exception:', discordError);
        discordResult = { success: false, error: discordError.message };
      }
    }
    
    // ==================== SUCCESS RESPONSE ====================
    return res.status(200).json({ 
      success: true, 
      commit: {
        sha: commitData.commit?.sha,
        url: commitData.commit?.html_url
      },
      discord: discordResult,
      message: '✅ Successfully committed to GitHub' + (discordResult?.success ? ' and sent Discord notification' : '')
    });
    
  } catch (error) {
    console.error('❌ Serverless function error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
