import React, { useState, useEffect } from 'react';
import './ProductPage.css';
import faceSwapService from './services/faceSwapService';
import advancedFaceAlignmentService from './services/advancedFaceAlignmentService';

const ProductPage = () => {
  const [userImage, setUserImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [faceDetectionResults, setFaceDetectionResults] = useState(null);

  useEffect(() => {
    // Load selected team data from localStorage
    const teamData = localStorage.getItem('selectedTeam');
    if (teamData) {
      setSelectedTeam(JSON.parse(teamData));
    } else {
      // Default to Chelsea if no team selected
      setSelectedTeam({
        name: 'Chelsea',
        jerseyImage: 'https://i.postimg.cc/nzGhQXGW/Chelsea.jpg',
        faceImage: 'https://i.postimg.cc/V6WkbJWM/Chelsea-Man.png'
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
    setProcessingMessage('Initializing face swap...');
    setError(null);
    setSuccess(null);
    setFaceDetectionResults(null);

    try {
      // First, fetch the team's face image from the URL
      const teamFaceResponse = await fetch(selectedTeam.faceImage);
      const teamFaceBlob = await teamFaceResponse.blob();
      
      // Create a File object from the blob
      const teamFaceFile = new File([teamFaceBlob], `${selectedTeam.name}-face.jpg`, {
        type: teamFaceBlob.type || 'image/jpeg'
      });

      // Use advanced face detection and alignment with backend processing
      setProcessingMessage('Detecting faces and extracting landmarks...');
      
      // Update progress messages during processing
      setTimeout(() => {
        if (isProcessing) setProcessingMessage('Aligning faces and scaling to match...');
      }, 2000);
      
      setTimeout(() => {
        if (isProcessing) setProcessingMessage('Normalizing lighting and color matching...');
      }, 4000);
      
      setTimeout(() => {
        if (isProcessing) setProcessingMessage('Sending aligned and normalized images to backend...');
      }, 6000);
      
      const result = await advancedFaceAlignmentService.performFaceSwap(
        teamFaceFile,
        userImage.file,
        faceSwapService // Pass backend service
      );

      if (result.success) {
        // Save the swapped image to localStorage and redirect to download page
        localStorage.setItem('swappedImage', result.swappedImage);
        setFaceDetectionResults(result.processingInfo);
        setSuccess(`Face swap completed successfully! Detected ${result.processingInfo.jerseyFacesDetected} face(s) in jersey and ${result.processingInfo.userFacesDetected} face(s) in your photo. Faces aligned, lighting/color normalized, and sent to backend for processing.`);
        
        // Redirect to download page after a short delay
        setTimeout(() => {
          window.location.href = '/download';
        }, 2000);
      } else {
        console.log('Advanced face swap failed, trying fallback method...');
        
        // Fallback to basic face swap service
        setProcessingMessage('Using fallback face swap method...');
        
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
          setSuccess('Face swap completed successfully using fallback method!');
          
          // Redirect to download page after a short delay
          setTimeout(() => {
            window.location.href = '/download';
          }, 2000);
        } else {
          throw new Error('Both advanced and fallback face swap methods failed');
        }
      }
      
    } catch (err) {
      setError(err.message || 'Failed to process face swap. Please try again.');
      console.error('Face swap error:', err);
    } finally {
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
      <div className="product-container">
        {/* Left Side - Product Image */}
        <div className="product-image-section">
          <div className="product-image">
            <img 
              src={selectedTeam?.jerseyImage || "https://i.postimg.cc/nzGhQXGW/Chelsea.jpg"} 
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
                <>
                  <span className="spinning">⚽</span>
                  {processingMessage || 'Creating Your Football Fantasy...'}
                </>
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

          {success && (
            <div className="alert success">
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}

          {faceDetectionResults && (
            <div className="face-detection-results">
              <h4>🎯 Face Detection Results</h4>
              <div className="results-grid">
                <div className="result-item">
                  <span className="result-label">Jersey Faces:</span>
                  <span className="result-value">{faceDetectionResults.jerseyFacesDetected}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Your Faces:</span>
                  <span className="result-value">{faceDetectionResults.userFacesDetected}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Faces Aligned:</span>
                  <span className="result-value">{faceDetectionResults.facesAligned}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Processing:</span>
                  <span className="result-value">{faceDetectionResults.backendProcessing ? 'Backend' : 'Client'}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Back to Home Button */}
      <div className="back-to-home">
        <button onClick={() => window.location.href = '/'} className="home-button">
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default ProductPage;
