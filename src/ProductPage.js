import React, { useState, useEffect } from 'react';
import './ProductPage.css';
import faceSwapService from './services/faceSwapService';
import advancedFaceAlignmentService from './services/advancedFaceAlignmentService';
import { getJerseyImageUrl, getFaceImageUrl } from './utils/imageUtils';

const ProductPage = () => {
  const [userImage, setUserImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [faceDetectionResults, setFaceDetectionResults] = useState(null);
  
  // Fun loading messages
  const loadingMessages = [
    '⚽ Getting your jersey ready...',
    '💫 Detecting your superstar face...',
    '✨ AI is analyzing your features...',
    '🎨 Blending colors like magic...',
    '🚀 Creating your perfect jersey...',
    '💎 Adding pro-level details...',
    '🌟 Making you look legendary...',
    '🎯 Almost there, champ!',
    '🏆 Your masterpiece is ready!'
  ];

  useEffect(() => {
    // Load selected team data from localStorage
    const teamData = localStorage.getItem('selectedTeam');
    if (teamData) {
      setSelectedTeam(JSON.parse(teamData));
    } else {
      // Default to Chelsea if no team selected
      setSelectedTeam({
        name: 'Chelsea',
        jerseyImage: getJerseyImageUrl('chelsea_home_jersey.jpg'),
        faceImage: getFaceImageUrl('Chelsea.png')
      });
    }
  }, []);

  const handleUserFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB for best quality');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Check image dimensions
          if (img.width < 200 || img.height < 200) {
            setError('Image should be at least 200x200 pixels for best results');
            return;
          }

          setUserImage({
            file: file,
            preview: e.target.result,
            width: img.width,
            height: img.height
          });
          setError(null);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaceSwap = async () => {
    if (!userImage) {
      setError('Please upload your face image first');
      return;
    }

    setIsProcessing(true);
    setProcessingMessage(loadingMessages[0]);
    setError(null);
    setSuccess(null);
    setFaceDetectionResults(null);

    // Declare messageInterval outside try block for cleanup
    let messageInterval;

    try {
      // First, fetch the team's face image from the URL
      setProcessingMessage('🔥 Prepping your jersey...');
      const teamFaceResponse = await fetch(selectedTeam.faceImage);
      const teamFaceBlob = await teamFaceResponse.blob();
      
      // Create a File object from the blob
      const teamFaceFile = new File([teamFaceBlob], `${selectedTeam.name}-face.jpg`, {
        type: teamFaceBlob.type || 'image/jpeg'
      });

      // Dynamic loading messages - change faster and more frequently
      let messageIndex = 1;
      
      const startDynamicMessages = () => {
        messageInterval = setInterval(() => {
          if (isProcessing && messageIndex < loadingMessages.length) {
            setProcessingMessage(loadingMessages[messageIndex]);
            messageIndex++;
          } else if (messageIndex >= loadingMessages.length) {
            messageIndex = 0; // Loop back
          }
        }, 1000); // Changed from 1500ms to 1000ms for faster changes
      };
      
      startDynamicMessages();
      
      // Update to specific cool messages at certain points
      setTimeout(() => {
        if (isProcessing) {
          setProcessingMessage('⚽ Magic happening in 3... 2... 1...');
        }
      }, 2000);
      
      setTimeout(() => {
        if (isProcessing) {
          setProcessingMessage('💫 Your face is about to get upgraded...');
        }
      }, 4000);
      
      setTimeout(() => {
        if (isProcessing) {
          setProcessingMessage('🎨 AI is working its magic on your features...');
        }
      }, 6000);
      
      setTimeout(() => {
        if (isProcessing) {
          setProcessingMessage('🚀 Polishing every pixel to perfection...');
        }
      }, 8000);
      
      setTimeout(() => {
        if (isProcessing) {
          setProcessingMessage('💎 Almost ready to blow your mind...');
        }
      }, 10000);
      
      setTimeout(() => {
        if (isProcessing) {
          setProcessingMessage('🏆 Final touch - making you legendary...');
        }
      }, 12000);
      
      const result = await advancedFaceAlignmentService.performFaceSwap(
        teamFaceFile,
        userImage.file,
        faceSwapService // Pass backend service
      );

      if (result.success) {
        // Save the swapped image to localStorage and redirect to download page
        localStorage.setItem('swappedImage', result.swappedImage);
        
        // Redirect to download page immediately
        window.location.href = '/download';
      } else {
        console.log('Advanced face swap failed, trying fallback method...');
        
        // Fallback to basic face swap method
        setProcessingMessage('🔄 Switching to turbo mode for epic results...');
        
        const fallbackResult = await faceSwapService.swapFaces(
          teamFaceFile,
          userImage.file,
          {
            enhance: true,
            quality: 'high'
          }
        );

        if (fallbackResult.success) {
          // Handle different response formats
          let swappedImageData;
          if (fallbackResult.imageData) {
            swappedImageData = fallbackResult.imageData;
          } else if (fallbackResult.imageUrl) {
            swappedImageData = fallbackResult.imageUrl;
          } else {
            throw new Error('No image data received from fallback API');
          }
          
          localStorage.setItem('swappedImage', swappedImageData);
          
          // Redirect to download page immediately
          window.location.href = '/download';
        } else {
          throw new Error('Both advanced and fallback face swap methods failed');
        }
      }
      
    } catch (err) {
      setError(err.message || 'Failed to process face swap. Please try again.');
      console.error('Face swap error:', err);
    } finally {
      // Clean up any intervals
      if (typeof messageInterval !== 'undefined') {
        clearInterval(messageInterval);
      }
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const resetImages = () => {
    setUserImage(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="product-page">
      {/* Back to Home Button */}
      <div className="back-to-home">
        <button onClick={() => window.location.href = '/'} className="home-button">
          ← Back to Home
        </button>
      </div>

      <div className="product-container">
        {/* Left Side - Product Image */}
        <div className="product-image-section">
          <div className="product-image">
            <img 
              src={selectedTeam?.jerseyImage || getJerseyImageUrl('chelsea_home_jersey.jpg')} 
              alt={`${selectedTeam?.name || 'Chelsea'} Football Jersey`} 
            />
          </div>
          <div className="product-info">
            <h2>{selectedTeam?.name || 'Chelsea FC'} Official Jersey</h2>
            <p>Get your face on the official {selectedTeam?.name || 'Chelsea FC'} jersey with professional AI technology!</p>
          </div>
        </div>

        {/* Right Side - Upload and Processing */}
        <div className="upload-section">
          <div className="upload-header">
            <h3>Upload Your Face</h3>
            <p><strong>For best quality:</strong> Use high-resolution images (800x800+ pixels), clear and well-lit face looking straight at the camera. Max file size: 10MB.</p>
          </div>

          <div className="upload-area">
            <input
              type="file"
              accept="image/*"
              onChange={handleUserFileChange}
              id="user-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="user-upload" className="upload-label">
              {userImage ? (
                <div className="image-preview">
                  <img src={userImage.preview} alt="Your Face" />
                  <div className="image-overlay">
                    <span>📤 Change Photo</span>
                  </div>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">👤</div>
                  <p>Click to upload your photo</p>
                  <small>Supports: JPG, PNG, WebP</small>
                </div>
              )}
            </label>
           </div>


           <div className="action-buttons">
            <button 
              onClick={handleFaceSwap}
              disabled={!userImage || isProcessing}
              className="swap-button"
            >
              {isProcessing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
                  <span className="spinning">⚽</span>
                  <div className="processing-message animated-text" style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    {processingMessage || 'Creating Your Football Fantasy...'}
                  </div>
                  <div style={{ 
                    width: '80%', 
                    height: '4px', 
                    background: 'rgba(255,255,255,0.3)', 
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #fff, #ff6b6b, #fff)',
                      backgroundSize: '200% 100%',
                      animation: 'loadingBar 1.5s ease-in-out infinite',
                      borderRadius: '10px'
                    }}></div>
                  </div>
                </div>
              ) : (
                <>
                  <span>⚽</span>
                  Put Me on {selectedTeam?.name || 'Chelsea'} Jersey!
                </>
              )}
            </button>

            <button 
              onClick={resetImages}
              className="reset-button"
              disabled={isProcessing}
            >
              Start Over
            </button>
          </div>

          {error && (
            <div className="alert error">
              <span>❌</span>
              <span>{error}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProductPage;
