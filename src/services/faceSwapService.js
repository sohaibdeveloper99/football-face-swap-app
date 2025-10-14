// Face Swap API Service
// This service handles integration with our secure backend API

import axios from 'axios';

// Backend API Configuration
const BACKEND_API = {
  baseURL: 'https://football-face-swap-app.vercel.app',
  endpoints: {
    faceswap: '/api/faceswap',
    health: '/api/health',
    status: '/api/status'
  }
};

// Add axios defaults for better error handling
axios.defaults.timeout = 300000; // 5 minute timeout for face swap operations
axios.defaults.headers.common['Content-Type'] = 'application/json';

class FaceSwapService {
  constructor() {
    this.selectedProvider = 'FACEMINT'; // Default provider
  }

  // Set the API provider
  setProvider(provider) {
    this.selectedProvider = provider;
  }

  // Main face swap function - now calls our secure backend
  async swapFaces(targetImageFile, sourceImageFile, options = {}) {
    try {
      const formData = new FormData();
      formData.append('target_image', targetImageFile);
      formData.append('source_image', sourceImageFile);
      formData.append('provider', this.selectedProvider);
      
      // Add optional parameters
      if (options.enhance) {
        formData.append('enhance', options.enhance);
      }
      if (options.quality) {
        formData.append('quality', options.quality);
      }

      const response = await axios.post(
        `${BACKEND_API.baseURL}${BACKEND_API.endpoints.faceswap}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000, // 5 minute timeout for processing (face swap can take time)
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      // Backend API responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          return new Error(data.error || 'Invalid request. Please check your images.');
        case 401:
          return new Error('Authentication failed. Please check your API configuration.');
        case 403:
          return new Error('Access denied. Please check your permissions.');
        case 429:
          return new Error('Rate limit exceeded. Please try again later.');
        case 500:
          return new Error('Server error. Please try again later.');
        case 503:
          return new Error('Service temporarily unavailable. Please try again later.');
        default:
          return new Error(data.error || `API error: ${status}`);
      }
    } else if (error.request) {
      // Network error or timeout
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return new Error('Face swap is taking longer than expected. Please wait and try again, or check if the server is processing your request.');
      }
      return new Error('Cannot connect to server. Please check your internet connection and ensure the backend server is running.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred.');
    }
  }

  // Validate image file
  validateImage(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, or WebP images.');
    }
    
    return true;
  }

  // Get available providers
  getProviders() {
    const providers = ['FACEMINT', 'PIAPI', 'AKOOL'];
    return providers.map(key => ({
      key,
      name: key,
      description: this.getProviderDescription(key)
    }));
  }

  // Get provider description
  getProviderDescription(provider) {
    const descriptions = {
      FACEMINT: 'High-quality face swapping with 8K support and face enhancement',
      PIAPI: 'AI-powered face swapping with low latency and high concurrency',
      AKOOL: 'Studio-quality face swap with 4K/8K support for commercial use'
    };
    return descriptions[provider] || 'Face swapping service';
  }

  // Check API status - now calls our backend
  async checkApiStatus() {
    try {
      const response = await axios.get(
        `${BACKEND_API.baseURL}${BACKEND_API.endpoints.status}/${this.selectedProvider}`,
        {
          timeout: 10000
        }
      );
      return response.data.status;
    } catch (error) {
      return false;
    }
  }

  // Check backend health
  async checkBackendHealth() {
    try {
      const response = await axios.get(
        `${BACKEND_API.baseURL}${BACKEND_API.endpoints.health}`,
        {
          timeout: 5000
        }
      );
      return response.data.status === 'OK';
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const faceSwapService = new FaceSwapService();

export default faceSwapService;

// Export the class for custom instances
export { FaceSwapService };
