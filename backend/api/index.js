const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://ajak-medical.firebaseapp.com',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/faceswap', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Face Swap API is running on Vercel',
    timestamp: new Date().toISOString()
  });
});

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'football123';

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ 
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
});

// Admin dashboard endpoint
app.get('/api/admin/dashboard', (req, res) => {
  const token = req.headers.authorization;
  
  if (token === 'Bearer admin-token-12345') {
    res.json({
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
});

// Face swap endpoint
app.post('/api/faceswap', upload.fields([
  { name: 'target_image', maxCount: 1 },
  { name: 'source_image', maxCount: 1 }
]), async (req, res) => {
  try {
    // Validate required fields
    if (!req.files || !req.files.source_image) {
      return res.status(400).json({
        success: false,
        error: 'Source image is required'
      });
    }

    const { provider = 'FACEMINT', enhance = true, quality = 'high' } = req.body;
    
    console.log('Processing face swap request...');
    console.log('Provider:', provider);
    console.log('Files received:', {
      target: req.files.target_image ? req.files.target_image[0].originalname : 'None',
      source: req.files.source_image[0].originalname
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo purposes, return the source image
    const sourceImageBuffer = req.files.source_image[0].buffer;
    const sourceBase64 = sourceImageBuffer.toString('base64');
    const demoResult = `data:${req.files.source_image[0].mimetype};base64,${sourceBase64}`;
    
    res.json({
      success: true,
      imageData: demoResult,
      message: '🎭 Demo Mode: Face swap completed! (Running on Vercel)',
      metadata: {
        provider: provider,
        processingTime: '2 seconds',
        mode: 'demo',
        platform: 'vercel'
      }
    });

  } catch (error) {
    console.error('Face swap error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      error: 'Only image files are allowed.'
    });
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Export for Vercel
module.exports = app;
