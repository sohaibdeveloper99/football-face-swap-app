// Face Swap API Service
import axios from 'axios';

const BACKEND_API = {
  baseURL: 'https://football-face-swap-app-production-fb73.up.railway.app',
  // For local development, use: 'http://localhost:5000'
  endpoints: {
    faceswap: '/api/faceswap',
    health: '/api/health',
    status: '/api/status'
  }
};

class FaceSwapService {
  constructor() {
    this.selectedProvider = 'FACEMINT';
  }

  setProvider(provider) {
    this.selectedProvider = provider;
  }

  getProvider() {
    return this.selectedProvider;
  }

  validateImage(file) {
    // Check if file exists
    if (!file) {
      throw new Error('Please select an image file');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please select a valid image file (JPEG, PNG, or WebP)');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error('Image file is too large. Please select an image smaller than 10MB');
    }

    // Check minimum file size (at least 1KB)
    const minSize = 1024; // 1KB in bytes
    if (file.size < minSize) {
      throw new Error('Image file is too small. Please select a valid image file');
    }

    return true;
  }

  async checkBackendHealth() {
    try {
      const response = await axios.get(`${BACKEND_API.baseURL}${BACKEND_API.endpoints.health}`);
      return response.data.status === 'OK';
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  async swapFaces(targetImage, sourceImage, options = {}) {
    try {
      console.log('Starting face swap with provider:', this.selectedProvider);
      
      const formData = new FormData();
      formData.append('target_image', targetImage);
      formData.append('source_image', sourceImage);
      formData.append('provider', this.selectedProvider);
      formData.append('enhance', options.enhance || true);
      formData.append('quality', options.quality || 'high');
      formData.append('blending_mode', options.blending_mode || 'natural');
      formData.append('quality_mode', options.quality_mode || 'high');

      console.log('Sending request to backend:', `${BACKEND_API.baseURL}${BACKEND_API.endpoints.faceswap}`);
      
      const response = await axios.post(
        `${BACKEND_API.baseURL}${BACKEND_API.endpoints.faceswap}`,
        formData,
        {
          // Let axios handle Content-Type header with boundary automatically
          timeout: 300000,
        }
      );

      console.log('Face swap response:', response.data);

      if (response.data.success) {
        return {
          success: true,
          imageData: response.data.imageData,
          message: response.data.message,
          metadata: response.data.metadata || {}
        };
      } else {
        throw new Error(response.data.error || 'Face swap failed');
      }

    } catch (error) {
      const backendMsg = error?.response?.data?.error || error?.response?.data?.message;
      const err = new Error(backendMsg || error.message || 'Face swap request failed');
      console.error('Face swap error:', {
        message: err.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw err;
    }
  }

  async swapFacesChelsea(sourceImage, options = {}) {
    try {
      console.log('Starting Chelsea face swap with provider:', this.selectedProvider);
      console.log('Backend URL:', `${BACKEND_API.baseURL}${BACKEND_API.endpoints.faceswap}`);
      
      const formData = new FormData();
      formData.append('source_image', sourceImage);
      formData.append('provider', this.selectedProvider);
      formData.append('enhance', options.enhance || true);
      formData.append('quality', options.quality || 'high');
      formData.append('blending_mode', options.blending_mode || 'natural');
      formData.append('quality_mode', options.quality_mode || 'high');

      console.log('Sending Chelsea request to:', `${BACKEND_API.baseURL}${BACKEND_API.endpoints.faceswap}`);

      const response = await axios.post(
        `${BACKEND_API.baseURL}${BACKEND_API.endpoints.faceswap}`,
        formData,
        {
          // Let axios handle Content-Type header with boundary automatically
          timeout: 300000,
        }
      );

      if (response.data.success) {
        return {
          success: true,
          imageData: response.data.imageData,
          message: response.data.message,
          metadata: response.data.metadata || {}
        };
      } else {
        throw new Error(response.data.error || 'Face swap failed');
      }

    } catch (error) {
      console.error('Chelsea face swap error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw error;
    }
  }
}

const faceSwapService = new FaceSwapService();
export default faceSwapService;
