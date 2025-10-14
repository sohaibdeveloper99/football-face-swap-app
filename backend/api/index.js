// Simple Vercel serverless function
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && req.url === '/api/health') {
    res.status(200).json({
      status: 'OK',
      message: 'Face Swap API is running on Vercel',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Admin login endpoint
  if (req.method === 'POST' && req.url === '/api/admin/login') {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'football123') {
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token: 'admin-token-12345'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    return;
  }

  // Admin dashboard endpoint
  if (req.method === 'GET' && req.url === '/api/admin/dashboard') {
    const token = req.headers.authorization;
    
    if (token === 'Bearer admin-token-12345') {
      res.status(200).json({
        success: true,
        data: {
          totalSwaps: 42,
          todaySwaps: 8,
          activeUsers: 15,
          systemStatus: 'Online',
          lastBackup: '2024-01-15 10:30:00',
          apiCalls: 156,
          storageUsed: '2.3 GB'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    return;
  }

  // Face swap endpoint (simplified for demo)
  if (req.method === 'POST' && req.url === '/api/faceswap') {
    // For demo purposes, return a success response
    res.status(200).json({
      success: true,
      imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      message: '🎭 Demo Mode: Face swap completed! (Running on Vercel)',
      metadata: {
        provider: 'FACEMINT',
        processingTime: '2 seconds',
        mode: 'demo',
        platform: 'vercel'
      }
    });
    return;
  }

  // 404 for all other requests
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
}
