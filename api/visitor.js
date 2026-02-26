// api/visitors.js - Real-time visitor counter using Server-Sent Events (SSE)
// This works perfectly with Vercel's serverless functions

// In-memory storage (resets on function cold start, but fine for demo)
let connectedClients = [];
let visitorCount = 0;

// Helper to broadcast count to all connected clients
function broadcastCount() {
  const message = `data: ${JSON.stringify({ count: visitorCount })}\n\n`;
  
  // Send to all connected clients
  connectedClients.forEach(client => {
    try {
      client.res.write(message);
    } catch (e) {
      // Client disconnected, will be removed on next cleanup
    }
  });
}

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Check if this is an SSE connection (Accept header includes text/event-stream)
  const acceptHeader = req.headers.accept || '';
  
  if (acceptHeader.includes('text/event-stream')) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Generate unique client ID
    const clientId = Date.now() + '-' + Math.random().toString(36).substring(2);
    
    // Add this client to the list
    connectedClients.push({ id: clientId, res });
    
    // Increment visitor count
    visitorCount++;
    
    // Send initial count
    res.write(`data: ${JSON.stringify({ count: visitorCount })}\n\n`);
    
    // Broadcast new count to all clients
    broadcastCount();
    
    // Log for debugging
    console.log(`Client ${clientId} connected. Total: ${visitorCount}`);
    
    // Remove client when connection closes
    req.on('close', () => {
      const index = connectedClients.findIndex(c => c.id === clientId);
      if (index !== -1) {
        connectedClients.splice(index, 1);
        
        // Decrement visitor count (only if still positive)
        visitorCount = Math.max(0, visitorCount - 1);
        
        // Broadcast updated count
        broadcastCount();
        
        console.log(`Client ${clientId} disconnected. Total: ${visitorCount}`);
      }
    });
    
    // Keep connection alive with periodic pings (every 30 seconds)
    const pingInterval = setInterval(() => {
      try {
        res.write(':ping\n\n');
      } catch (e) {
        clearInterval(pingInterval);
      }
    }, 30000);
    
    // Clear interval on close
    req.on('close', () => {
      clearInterval(pingInterval);
    });
    
  } else {
    // Regular GET request - just return current count
    res.json({ 
      count: visitorCount,
      clients: connectedClients.length 
    });
  }
}
