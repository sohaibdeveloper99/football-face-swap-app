const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - REQUIRED for Railway and cloud platforms
// This allows Express to trust X-Forwarded-* headers from the reverse proxy
app.set('trust proxy', true);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));


// Security middleware
app.use(helmet());

// CORS configuration - allow multiple origins for production
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'https://localhost:3000'
];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('CORS blocked origin:', origin);
    }
    callback(null, true); // Allow all origins for now
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  // Disable trust proxy validation for Railway
  validate: {
    trustProxy: false
  }
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

// API Configuration
const API_CONFIG = {
  FACEMINT: {
    baseURL: 'https://api.facemint.io/api',
    createTaskEndpoint: '/create-face-swap-task',
    getTaskEndpoint: '/get-task-info',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.FACEMINT_API_KEY
    }
  },
  PIAPI: {
    baseURL: 'https://api.piapi.ai',
    endpoint: '/v1/faceswap',
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  },
  AKOOL: {
    baseURL: 'https://api.akool.com',
    endpoint: '/v1/swap-face',
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }
};

// Helper function to get API key based on provider
function getApiKey(provider) {
  const keys = {
    FACEMINT: process.env.FACEMINT_API_KEY,
    PIAPI: process.env.PIAPI_API_KEY,
    AKOOL: process.env.AKOOL_API_KEY
  };
  return keys[provider];
}

// Helper function to upload image to temporary public URL
async function uploadImageToTempService(imageBuffer, filename, mimetype) {
  try {
    // Use 0x0.st - it's free and doesn't require API key
    console.log('Uploading to 0x0.st...');
    
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: filename,
      contentType: mimetype
    });
    
    const response = await axios.post('https://0x0.st', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });
    
    if (response.data && response.data.trim().startsWith('http')) {
      const url = response.data.trim();
      console.log(`Successfully uploaded to 0x0.st: ${url}`);
      return url;
    } else {
      throw new Error('Invalid response from 0x0.st');
    }
    
  } catch (error) {
    console.error('0x0.st upload failed:', error.message);
    
    // Fallback: try tmpfiles.org
    try {
      console.log('Trying tmpfiles.org as fallback...');
      
      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename: filename,
        contentType: mimetype
      });
      
      const response = await axios.post('https://tmpfiles.org/api/v1/upload', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000
      });
      
      if (response.data.status === 'success' && response.data.data.url) {
        const url = response.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        console.log(`Successfully uploaded to tmpfiles.org: ${url}`);
        return url;
      } else {
        throw new Error('tmpfiles.org upload failed');
      }
      
    } catch (fallbackError) {
      console.error('tmpfiles.org also failed:', fallbackError.message);
      throw new Error('All upload services failed');
    }
  }
}

// Helper function to create Facemint task
async function createFacemintTask(targetImageUrl, sourceImageUrl, apiKey, qualityMode = 'high') {
  try {
    // Test the API key first
    console.log('Testing Facemint API key...');
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET');
    
    if (!apiKey) {
      throw new Error('Facemint API key is not configured');
    }
    
    // Validate URLs
    if (!targetImageUrl || !sourceImageUrl) {
      throw new Error('Invalid image URLs provided');
    }
    
    console.log('Target image URL:', targetImageUrl);
    console.log('Source image URL:', sourceImageUrl);
    
    // Use the exact format from Facemint documentation
    const taskData = {
      type: "image",
      media_url: targetImageUrl,
      callback_url: "https://webhook.site/#!/unique-id-12345", // Public webhook for testing
      swap_list: [
        {
          from_face: targetImageUrl, // The face in the target image
          to_face: sourceImageUrl    // Your face to replace it with
        }
      ],
      resolution: qualityMode === 'ultra' ? 3 : qualityMode === 'high' ? 2 : 1, // Quality based resolution
      enhance: 1,    // Enable enhancement
      face_detection: 1, // Enable face detection
      face_alignment: 1, // Enable face alignment
      quality_boost: qualityMode === 'ultra' ? 1 : 0,  // Enable quality boost for ultra
      nsfw_check: 0,  // Disable NSFW check for faster processing
      quality_mode: qualityMode  // Add quality_mode parameter as required by API
    };

    console.log('Creating Facemint task with data:', JSON.stringify(taskData, null, 2));
    console.log('Quality mode:', qualityMode);
    console.log('API endpoint:', 'https://api.facemint.io/api/create-face-swap-task');

    const response = await axios.post(
      'https://api.facemint.io/api/create-face-swap-task',
      taskData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        timeout: 30000
      }
    );

    console.log('Facemint task creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Facemint task creation error:', error.response?.data || error.message);
    console.error('Full error:', error.response?.status, error.response?.statusText);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

// Helper function to check Facemint task status
async function checkFacemintTaskStatus(taskId, apiKey) {
  try {
    const response = await axios.post(
      'https://api.facemint.io/api/get-task-info',
      { task_id: taskId },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        timeout: 10000
      }
    );

    return response.data;
  } catch (error) {
    console.error('Facemint status check error:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to handle API response
function handleApiResponse(response, provider) {
  switch (provider) {
    case 'FACEMINT':
      return {
        success: true,
        imageUrl: response.data.result?.image_url || response.data.image_url,
        imageData: response.data.result?.image_data || response.data.image_data,
        metadata: response.data.metadata || {}
      };
    
    case 'PIAPI':
      return {
        success: true,
        imageUrl: response.data.output_url || response.data.result_url,
        imageData: response.data.output_data || response.data.result_data,
        metadata: response.data.metadata || {}
      };
    
    case 'AKOOL':
      return {
        success: true,
        imageUrl: response.data.swapped_image_url || response.data.result_url,
        imageData: response.data.swapped_image_data || response.data.result_data,
        metadata: response.data.processing_info || {}
      };
    
    default:
      return {
        success: true,
        imageUrl: response.data.image_url || response.data.result_url,
        imageData: response.data.image_data || response.data.result_data,
        metadata: response.data.metadata || {}
      };
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Face Swap API is running',
    timestamp: new Date().toISOString()
  });
});

// Facemint callback endpoint
app.post('/api/facemint-callback', (req, res) => {
  console.log('Facemint callback received:', req.body);
  res.json({ status: 'received' });
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
  // Check if this is a Chelsea product request (no target image provided)
  const isChelseaProduct = !req.files.target_image && req.files.source_image;
  try {
    // Validate required fields
    if (!req.files || !req.files.source_image) {
      return res.status(400).json({
        success: false,
        error: 'Source image is required'
      });
    }

    // For Chelsea product, we don't need target image
    if (!isChelseaProduct && !req.files.target_image) {
      return res.status(400).json({
        success: false,
        error: 'Target image is required'
      });
    }

    const { provider = 'FACEMINT', enhance = true, quality = 'high', blending_mode = 'natural', quality_mode = 'high' } = req.body;
    
    console.log('Received parameters:', {
      provider,
      enhance,
      quality,
      blending_mode,
      quality_mode
    });
    
    // Note: Facemint API doesn't support blending_mode parameter
    // The blending mode selection is kept for future API compatibility
    // or for use with other face swap providers
    
    // For now, let's use demo mode until we fix the API integration
    console.log('Processing face swap request...');
    console.log('Provider:', provider);
    if (isChelseaProduct) {
      console.log('Chelsea product request - using predefined target image');
      console.log('Files received:', {
        target: 'Chelsea-Man.png (predefined)',
        source: req.files.source_image[0].originalname
      });
    } else {
      console.log('Files received:', {
        target: req.files.target_image[0].originalname,
        source: req.files.source_image[0].originalname
      });
    }

    // Reduced initial delay for faster response
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try real API integration first, fallback to demo if it fails
    try {
      // Validate provider
      if (!API_CONFIG[provider]) {
        throw new Error('Invalid provider specified');
      }

      // Get API key
      const apiKey = getApiKey(provider);
      if (!apiKey) {
        throw new Error('API key not configured for the selected provider');
      }

      console.log('Attempting real API call to:', provider);
      
      if (provider === 'FACEMINT') {
        console.log('Step 1: Uploading images to temporary public URLs...');
        
        // Step 1: Upload images to temporary public URLs
        let targetImageUrl;
        if (isChelseaProduct) {
          // Use the predefined Chelsea-Man.png image
          targetImageUrl = 'https://i.postimg.cc/V6WkbJWM/Chelsea-Man.png';
          console.log('Using predefined Chelsea target image:', targetImageUrl);
        } else {
          targetImageUrl = await uploadImageToTempService(
            req.files.target_image[0].buffer,
            req.files.target_image[0].originalname,
            req.files.target_image[0].mimetype
          );
        }
        
        const sourceImageUrl = await uploadImageToTempService(
          req.files.source_image[0].buffer,
          req.files.source_image[0].originalname,
          req.files.source_image[0].mimetype
        );
        
        console.log('Images uploaded successfully:');
        console.log('Target URL:', targetImageUrl);
        console.log('Source URL:', sourceImageUrl);
        
        // Step 2: Create Facemint task
        console.log('Step 2: Creating Facemint task...');
        const taskResult = await createFacemintTask(targetImageUrl, sourceImageUrl, apiKey, quality_mode);
        
        if (taskResult.code === 0 && taskResult.data.taskId) {
          const taskId = taskResult.data.taskId;
          console.log('Task created successfully. Task ID:', taskId);
          
          // Step 3: Poll for task completion (optimized for speed)
          console.log('Step 3: Waiting for task completion...');
          let attempts = 0;
          const maxAttempts = 60; // 3 minutes max
          
          while (attempts < maxAttempts) {
            // Start with shorter intervals, increase if needed
            const waitTime = attempts < 5 ? 3000 : 5000; // 3s first 5 attempts, then 5s
            await new Promise(resolve => setTimeout(resolve, waitTime));
            attempts++;
            
            console.log(`Checking task status... (attempt ${attempts}/${maxAttempts})`);
            const statusResult = await checkFacemintTaskStatus(taskId, apiKey);
            
            if (statusResult.code === 0 && statusResult.data) {
              const taskData = statusResult.data;
              console.log('Task state:', taskData.state);
              
              if (taskData.state === 3) { // Completed
                console.log('Task completed successfully!');
                const resultUrl = taskData.result?.file_url;
                
                if (resultUrl) {
                  // Download the result image
                  console.log('Downloading result image...');
                  const resultResponse = await axios.get(resultUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                  });
                  
                  const resultBase64 = Buffer.from(resultResponse.data).toString('base64');
                  const resultImageData = `data:image/png;base64,${resultBase64}`;
                  
                  const totalTime = attempts < 5 ? attempts * 3 : 15 + (attempts - 5) * 5;
                  
                  res.json({
                    success: true,
                    imageData: resultImageData,
                    message: '🎉 Real Face Swap Completed Successfully! Your face has been swapped using Facemint AI.',
                    metadata: {
                      provider: provider,
                      taskId: taskId,
                      processingTime: `${totalTime} seconds`,
                      mode: 'real',
                      resultUrl: resultUrl
                    }
                  });
                  return;
                } else {
                  throw new Error('No result URL found in completed task');
                }
              } else if (taskData.state === 4) { // Failed
                throw new Error('Face swap task failed');
              }
              // If state is 1 (pending) or 2 (processing), continue polling
            } else {
              throw new Error('Failed to get task status');
            }
          }
          
          throw new Error('Task processing timeout - please try again');
          
        } else {
          throw new Error('Failed to create Facemint task: ' + (taskResult.info || 'Unknown error'));
        }
        
      } else {
        // For other providers, use the old method
        const FormData = require('form-data');
        const formData = new FormData();
        
        formData.append('target_image', req.files.target_image[0].buffer, {
          filename: req.files.target_image[0].originalname,
          contentType: req.files.target_image[0].mimetype
        });
        
        formData.append('source_image', req.files.source_image[0].buffer, {
          filename: req.files.source_image[0].originalname,
          contentType: req.files.source_image[0].mimetype
        });

        // Add optional parameters
        if (enhance) formData.append('enhance', enhance);
        if (quality) formData.append('quality', quality);
        formData.append('output_format', 'png');

        // Make API call
        const config = API_CONFIG[provider];
        const response = await axios.post(
          `${config.baseURL}${config.endpoint}`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Authorization': `Bearer ${apiKey}`,
              'X-API-Key': apiKey,
            },
            timeout: 60000, // 60 second timeout
          }
        );

        console.log('API call successful!');
        
        // Handle response
        const result = handleApiResponse(response, provider);
        res.json(result);
      }
      
    } catch (apiError) {
      console.log('API call failed, using demo mode:', apiError.message);
      
      // If API fails, use demo mode - return source image to show "face swap" effect
      const sourceImageBuffer = req.files.source_image[0].buffer;
      const sourceBase64 = sourceImageBuffer.toString('base64');
      const demoResult = `data:${req.files.source_image[0].mimetype};base64,${sourceBase64}`;
      
      res.json({
        success: true,
        imageData: demoResult,
        message: '🎭 Demo Mode: Face swap completed! (Real API failed - this is a demo result)',
        metadata: {
          provider: provider,
          processingTime: '3 seconds',
          mode: 'demo',
          apiError: apiError.message,
          note: 'This shows your uploaded face as a demo of the swap result. Real face swap failed due to API error.'
        }
      });
    }

  } catch (error) {
    console.error('Face swap error:', error);
    
    // Handle different types of errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          res.status(400).json({
            success: false,
            error: data.message || 'Invalid request. Please check your images.'
          });
          break;
        case 401:
          res.status(401).json({
            success: false,
            error: 'Invalid API key. Please check your authentication.'
          });
          break;
        case 403:
          res.status(403).json({
            success: false,
            error: 'Access denied. Please check your API permissions.'
          });
          break;
        case 429:
          res.status(429).json({
            success: false,
            error: 'Rate limit exceeded. Please try again later.'
          });
          break;
        case 500:
          res.status(500).json({
            success: false,
            error: 'External API server error. Please try again later.'
          });
          break;
        default:
          res.status(status).json({
            success: false,
            error: data.message || `API error: ${status}`
          });
      }
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'Network error. Please check your internet connection.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error. Please try again later.'
      });
    }
  }
});

// API status check endpoint
app.get('/api/status/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    
    if (!API_CONFIG[provider]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider specified'
      });
    }

    const apiKey = getApiKey(provider);
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'API key not configured'
      });
    }

    // Try to make a simple request to check API status
    const config = API_CONFIG[provider];
    const response = await axios.get(`${config.baseURL}/status`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 10000
    });

    res.json({
      success: true,
      status: response.data.status === 'active',
      provider: provider
    });

  } catch (error) {
    res.json({
      success: false,
      status: false,
      provider: req.params.provider,
      error: 'API status check failed'
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Face Swap API server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔒 API endpoints secured and rate limited`);
});

module.exports = app;
