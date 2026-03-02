// api/scripts.js
export default async function handler(req, res) {
  // Set CORS headers to allow only your domain
  res.setHeader('Access-Control-Allow-Origin', 'https://lokus-hub-iscript.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // Check if the request is from your domain
  const referer = req.headers.referer || '';
  const origin = req.headers.origin || '';
  
  // Allow requests only from your Vercel app
  const allowedDomains = [
    'https://lokus-hub-iscript.vercel.app',
    'http://localhost:3000', // For local development
    'http://localhost:3001'   // Add other dev ports if needed
  ];
  
  const isAllowed = allowedDomains.some(domain => 
    referer.startsWith(domain) || origin === domain
  );
  
  if (!isAllowed && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      error: 'Access Denied',
      message: 'Direct access to this endpoint is not allowed'
    });
  }
  
  // Your scripts data (from your original scripts.json)
  const scriptsData = {
    "siteTitle": "lokus hub scripts",
    "visitorCount": 1842,
    "theme": "default",
    "versions": [],
    "linkvertise": {
      "userId": "1446949",
      "callbackUrl": "https://linkvertise-callback-production.up.railway.app/callback"
    },
    "scripts": [
      {
        "id": "mm2",
        "name": "🔪 MURDER MYSTERY 2",
        "code": "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/MM2-ScriptsZ/Lokus-Hub/refs/heads/main/mm2.luazz\"))()",
        "blurred": false,
        "keySystem": "keyless",
        "keyLinks": [],
        "features": []
      },
      {
        "id": "universal",
        "name": "⚙️ UNIVERSAL [Connect Your Discord And Roblox]",
        "description": "",
        "code": "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/MM2-ScriptsZ/Lokus-Hub/refs/heads/main/legit.lua\"))()",
        "blurred": true,
        "redirectUrl": "https://is.gd/Ypi4z4",
        "image": null,
        "universeId": null,
        "keySystem": "keyless",
        "keyLinks": [],
        "features": [
          "🎮 Bloxfruit",
          "🧠 Brainrot",
          "🌊 Tsunami",
          "⚔️ Rivals",
          "🔫 Arsenal",
          "🐟 Fisch",
          "🐾 Adopt Me",
          "🌱 Garden"
        ]
      },
      // ... rest of your scripts (adopt, pvpscript1771932825701, etc.)
    ]
  };
  
  // Return the data
  res.status(200).json(scriptsData);
}
