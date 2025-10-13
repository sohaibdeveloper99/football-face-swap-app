# 🎭 AI Face Swap Web Application

A production-ready, high-quality face swapping web application with secure backend API architecture. Built with React frontend and Node.js backend for maximum security and performance.

## ✨ Features

- **🔒 Secure Architecture**: API keys stored securely on backend, never exposed to frontend
- **🎯 High-Quality Face Swapping**: Uses professional-grade APIs for studio-quality results
- **📱 Responsive Design**: Works perfectly on desktop and mobile devices
- **🛡️ Production Security**: Rate limiting, CORS protection, and security headers
- **⚡ Fast Performance**: Optimized backend API with proper error handling
- **🎨 Modern UI**: Beautiful, intuitive interface with real-time feedback
- **📊 Health Monitoring**: Backend and API status checking
- **💾 Download Results**: High-quality image downloads

## 🏗️ Architecture

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐    API Calls    ┌─────────────────┐
│   React Frontend │ ◄──────────────► │  Node.js Backend │ ◄──────────────► │  Face Swap APIs │
│   (Port 3000)    │                  │   (Port 5000)    │                  │  (Facemint/etc) │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Face swap API key from supported providers

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd footballswaptry
```

2. **Install frontend dependencies:**
```bash
npm install
```

3. **Install backend dependencies:**
```bash
cd backend
npm install
cd ..
```

4. **Configure API keys:**
```bash
# Copy the example environment file
cp backend/env.example backend/.env

# Edit backend/.env and add your API keys
# FACEMINT_API_KEY=your_actual_api_key_here
```

5. **Start both servers:**
```bash
# Option 1: Use the startup script (Windows)
start-dev.bat

# Option 2: Manual start
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
npm start
```

6. **Open the application:**
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)

## 🔑 API Setup

This application supports multiple high-quality face swap APIs. You'll need to get an API key from one of these providers:

### 1. Facemint (Recommended)
- **Website**: [https://facemint.io](https://facemint.io)
- **Features**: 8K support, face enhancement, high-quality results
- **Pricing**: Pay-per-use model
- **Best for**: Professional quality results

### 2. PiAPI
- **Website**: [https://piapi.ai](https://piapi.ai)
- **Features**: Low latency, high concurrency, AI-powered
- **Pricing**: Pay-as-you-use
- **Best for**: Fast processing and scalability

### 3. AKOOL
- **Website**: [https://akool.com](https://akool.com)
- **Features**: 4K/8K support, commercial usage, studio quality
- **Pricing**: Commercial licensing available
- **Best for**: Commercial applications

### Setting Up Your API Key

1. Sign up for an account with your chosen provider
2. Navigate to their API dashboard
3. Generate an API key
4. Click the settings button (⚙️) in the app header
5. Paste your API key in the settings modal
6. Select your API provider
7. Click "Check API Status" to verify your connection

## 📱 How to Use

1. **Upload Target Image**: Upload the image containing the face you want to replace
2. **Upload Your Face**: Upload your face image to swap with the target
3. **Configure Settings**: Set your API key and choose your provider
4. **Swap Faces**: Click "Swap Faces" to process the images
5. **Download Result**: Download your face-swapped image

## 🛠️ Technical Details

### Built With

- **React 19**: Modern React with hooks
- **React Dropzone**: Drag and drop file uploads
- **Lucide React**: Beautiful icons
- **Axios**: HTTP client for API calls
- **CSS3**: Modern styling with gradients and animations

### Project Structure

```
src/
├── App.js                 # Main application component
├── App.css               # Application styles
├── services/
│   └── faceSwapService.js # API service layer
└── index.js              # Application entry point
```

### API Service Features

- **Multiple Provider Support**: Easy switching between different APIs
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Image Validation**: Validates file types and sizes before upload
- **Response Handling**: Handles different response formats from various APIs
- **Status Checking**: API health monitoring

## 🔧 Configuration

### Environment Variables

You can set your API key as an environment variable:

```bash
# Create a .env file in the root directory
REACT_APP_FACE_SWAP_API_KEY=your_api_key_here
```

### Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### File Size Limits

- Maximum file size: 10MB per image
- Recommended resolution: 512x512 or higher for best results

## 🎨 Customization

### Styling

The application uses CSS custom properties for easy theming. You can modify colors and styles in `src/App.css`.

### Adding New API Providers

To add a new API provider:

1. Add the configuration to `API_CONFIG` in `faceSwapService.js`
2. Implement the response handling in `handleResponse()`
3. Add error handling in `handleError()`
4. Update the provider list in `getProviders()`

## 🚨 Important Notes

- **API Costs**: Face swap APIs typically charge per request. Monitor your usage.
- **Image Quality**: Higher resolution images generally produce better results.
- **Face Detection**: Ensure faces are clearly visible and well-lit for best results.
- **Privacy**: Images are processed by third-party APIs. Review their privacy policies.

## 🐛 Troubleshooting

### Common Issues

1. **"API key is required" error**
   - Make sure you've set your API key in the settings modal

2. **"Invalid file type" error**
   - Ensure your images are in supported formats (JPG, PNG, WebP)

3. **"File size too large" error**
   - Compress your images to under 10MB

4. **"API Error" status**
   - Check your API key and account status with the provider
   - Verify you have sufficient credits/quota

### Getting Help

- Check the API provider's documentation
- Verify your API key is correct
- Ensure you have sufficient credits/quota
- Check your internet connection

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- Facemint, PiAPI, and AKOOL for providing excellent face swap APIs
- React team for the amazing framework
- All open source contributors

---

**Note**: This application requires external API services to function. Make sure to set up your API key before using the face swap functionality.

**Note**: This application requires external API services to function. Make sure to set up your API key before using the face swap functionality.
**Note**: This application requires external API services to function. Make sure to set up your API key before using the face swap functionality.
