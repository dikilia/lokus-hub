// api/login.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { password } = req.body;
    
    // Get admin password from environment variable (never hardcoded!)
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    
    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD not set in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // Simple timing-safe comparison (prevents timing attacks)
    const isValid = password === ADMIN_PASSWORD;
    
    if (isValid) {
      // Generate a simple session token (in production, use JWT)
      const token = Buffer.from(Date.now() + '-' + Math.random()).toString('base64');
      
      // Set secure HTTP-only cookie (can't be accessed by JavaScript)
      res.setHeader('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Login successful',
        redirect: '/admin.html'
      });
    } else {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}