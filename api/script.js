// api/scripts.js
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if request is from your domain
  const referer = req.headers.referer || '';
  const origin = req.headers.origin || '';
  
  // Allowed domains (add your production and development domains)
  const allowedDomains = [
    'https://lokus-hub-iscript.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://lokus-hub-iscript.vercel.app' // Your production domain
  ];

  // Check if the request is from an allowed domain
  const isAllowed = allowedDomains.some(domain => 
    referer.startsWith(domain) || origin === domain
  );

  // Block direct access and unauthorized domains
  if (!isAllowed && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      error: 'Access Denied',
      message: 'Direct access to this endpoint is not allowed. Requests must come from the official website.'
    });
  }

  // Your scripts data
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
      {
        "id": "adopt",
        "name": "🐾 ADOPT ME",
        "code": "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/dikilia/Adopt-Me2.0/refs/heads/main/lokuskhan1\"))()",
        "blurred": false,
        "keySystem": "keyless",
        "keyLinks": [],
        "features": []
      },
      {
        "id": "pvpscript1771932825701",
        "name": "PVP SCRIPT",
        "description": "",
        "code": "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/MM2-ScriptsZ/Lokus-Hub/refs/heads/main/pvp.lua\"))()",
        "blurred": false,
        "redirectUrl": "https://openinapp.link/jvj3l",
        "image": null, // Removed the long base64 string
        "universeId": null,
        "keySystem": "keyless",
        "keyLinks": [],
        "features": [
          "🧠 Brainrot"
        ]
      },
      {
        "id": "quantumhubx1772024282799",
        "name": "Quantum Hub X ",
        "description": "Auto Farm\nAuto Bounty\nAuto boss\nauto dungeon\ntrade scam / freeze trade\nfruit duper\netc",
        "code": "loadstring(game:HttpGet(\"https://raw.githubusercontent.com/flazhy/QuantumOnyx/refs/heads/main/QuantumOnyx.lua\"))()",
        "blurred": true,
        "redirectUrl": "https://is.gd/Ypi4z4",
        "image": "https://i.ytimg.com/vi/y9bx65wXyC0/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDwlsPpeNA-XwgDUW-iIDhcKQHjfw",
        "universeId": null,
        "keySystem": "keyless",
        "keyLinks": [],
        "features": []
      },
      {
        "id": "adopt-me-1772359170005",
        "name": "Adopt Me",
        "description": "test",
        "code": "test",
        "blurred": false,
        "redirectUrl": "",
        "image": null,
        "universeId": null,
        "keySystem": "keyless",
        "keyLinks": [],
        "features": [],
        "author": "Lokus Hub Admin",
        "authorAvatar": null,
        "game": "Adopt Me",
        "version": "1.0.1",
        "longDescription": "test",
        "screenshots": [
          "https://imgur.com/a/fs404Ok"
        ],
        "downloads": 0,
        "favorites": 0,
        "views": 0,
        "date": "2026-03-01T09:59:30.006Z",
        "timeAgo": "Just now"
      }
    ],
    "lastUpdated": "2026-03-01"
  };

  // Add cache control headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Return the data
  return res.status(200).json(scriptsData);
}
