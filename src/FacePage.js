import React, { useState } from 'react';
import './FacePage.css';
import directFaceSwapService from './services/directFaceSwapService';

const FacePage = () => {
  const [jerseyImage, setJerseyImage] = useState(null);
  const [faceImage, setFaceImage] = useState(null);
  const [jerseyFileName, setJerseyFileName] = useState('');
  const [faceFileName, setFaceFileName] = useState('');
  const [processedJerseyImage, setProcessedJerseyImage] = useState(null);
  const [finalResultImage, setFinalResultImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetectionResults, setFaceDetectionResults] = useState(null);
  const [faceImageDetectionResults, setFaceImageDetectionResults] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [forceRender, setForceRender] = useState(0);
  const [jerseyFile, setJerseyFile] = useState(null);
  const [faceFile, setFaceFile] = useState(null);

  const handleJerseyUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('Jersey file selected:', file.name, file.type, file.size);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, etc.)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      setJerseyImage(URL.createObjectURL(file));
      setJerseyFileName(file.name);
      setJerseyFile(file);
      
      // Start face detection and removal process
      setIsProcessing(true);
      setProcessingStatus('Analyzing jersey image for faces...');
      
      try {
        const results = await directFaceSwapService.processJerseyImage(file);
        console.log('Face detection results:', results);
        console.log('Processed image URL:', results.processedImage);
        
        // Force re-render by setting state
        setProcessedJerseyImage(results.processedImage);
        setFaceDetectionResults(results);
        setForceRender(prev => prev + 1); // Force re-render
        
        if (results.facesDetected > 0) {
          setProcessingStatus(`✅ Detected and removed ${results.facesDetected} face(s) from jersey image`);
        } else {
          setProcessingStatus('ℹ️ No faces detected in jersey image - ready for face swap');
        }
      } catch (error) {
        console.error('Face detection error:', error);
        setProcessingStatus('⚠️ Face detection failed - using original image');
        setProcessedJerseyImage(URL.createObjectURL(file));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleFaceUpload = async (event) => {
    const original = event.target.files[0];
    if (original) {
      let file = original;
      try {
        const { normalizeImageFile } = require('./utils/fileNormalization');
        file = await normalizeImageFile(original, { maxDimension: 2000, maxBytes: 8 * 1024 * 1024 });
      } catch (err) {
        if (err && err.code === 'UNSUPPORTED_HEIC') {
          alert('iPhone HEIC detected. Please upload a JPG or PNG photo.');
          return;
        }
      }
      console.log('Face file selected:', file.name, file.type, file.size);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, etc.)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      setFaceImage(URL.createObjectURL(file));
      setFaceFileName(file.name);
      setFaceFile(file);
      
      // Start face detection on the uploaded face image
      setIsProcessing(true);
      setProcessingStatus('Analyzing your face image...');
      
      try {
        const results = await directFaceSwapService.processFaceImage(file);
        setFaceImageDetectionResults(results);
        
        if (results.facesDetected > 0) {
          setProcessingStatus(`✅ Detected ${results.facesDetected} face(s) in your image`);
        } else {
          setProcessingStatus('⚠️ No faces detected in your image - please use a clear face photo');
        }
      } catch (error) {
        console.error('Face detection error:', error);
        setProcessingStatus('⚠️ Face detection failed - please try a different image');
        setFaceImageDetectionResults(null);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const resetImages = () => {
    setJerseyImage(null);
    setFaceImage(null);
    setJerseyFileName('');
    setFaceFileName('');
    setProcessedJerseyImage(null);
    setFinalResultImage(null);
    setFaceDetectionResults(null);
    setFaceImageDetectionResults(null);
    setProcessingStatus('');
    setIsProcessing(false);
    setJerseyFile(null);
    setFaceFile(null);
    
    // Clear file inputs
    const jerseyInput = document.getElementById('jersey-upload');
    const faceInput = document.getElementById('face-upload');
    if (jerseyInput) jerseyInput.value = '';
    if (faceInput) faceInput.value = '';
  };

  const handleFaceSwap = async () => {
    if (!jerseyFile || !faceFile || !faceDetectionResults || !faceImageDetectionResults) {
      alert('Please upload both images and ensure face detection is complete for both');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Overlaying your detected face onto the jersey...');

    try {
      const resultImageUrl = await directFaceSwapService.overlayFaceOnJersey(
        jerseyFile,
        faceFile,
        faceDetectionResults.faceRegions,
        faceImageDetectionResults
      );

      setFinalResultImage(resultImageUrl);
      setProcessingStatus('✅ Face swap completed successfully!');
      
    } catch (error) {
      console.error('Face swap error:', error);
      setProcessingStatus('⚠️ Face swap failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="face-page">
      <div className="face-container">
        <div className="face-header">
          <h1 className="face-title">🎭 Face Swap Studio</h1>
          <p className="face-subtitle">Transform yourself with AI-powered face swapping technology</p>
        </div>
        
        <div className="upload-section">
          <div className="upload-box jersey-box" onClick={() => document.getElementById('jersey-upload').click()}>
            <input
              type="file"
              accept="image/*"
              onChange={handleJerseyUpload}
              className="file-input"
              id="jersey-upload"
            />
            <div className="upload-icon">👕</div>
            <h3 className="upload-label">Upload your favourite team jersey here</h3>
            <div className="upload-button">
              {jerseyImage ? 'Change Jersey' : 'Click to Select Jersey Image'}
            </div>
            {jerseyFileName && (
              <div className="file-info">
                <span className="file-name">📁 {jerseyFileName}</span>
              </div>
            )}
            {jerseyImage && (
              <div className="preview-container">
                <div className="image-comparison">
                  <div className="image-pair">
                    <div className="image-label">Original</div>
                    <img src={jerseyImage} alt="Original jersey" className="preview-image" />
                  </div>
                  <div className="image-pair">
                    <div className="image-label">Face Removed</div>
                    <div className="image-container">
                      {processedJerseyImage ? (
                        <>
                          <img 
                            key={`processed-${forceRender}`}
                            src={processedJerseyImage} 
                            alt="Processed jersey" 
                            className="preview-image"
                            style={{ 
                              display: 'block', 
                              width: '100%', 
                              height: 'auto',
                              maxWidth: '100%',
                              maxHeight: '200px',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              console.error('Failed to load processed image:', processedJerseyImage);
                              e.target.style.display = 'none';
                            }}
                            onLoad={(e) => {
                              console.log('Processed image loaded successfully');
                            }}
                          />
                        </>
                      ) : (
                        <div className="image-placeholder">
                          <div className="placeholder-content">
                            <div className="placeholder-icon">🎭</div>
                            <div className="placeholder-text">Processing...</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="upload-box face-box" onClick={() => document.getElementById('face-upload').click()}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFaceUpload}
              className="file-input"
              id="face-upload"
            />
            <div className="upload-icon">👤</div>
            <h3 className="upload-label">Upload your own pic here</h3>
            <div className="upload-button">
              {faceImage ? 'Change Photo' : 'Click to Select Your Photo'}
            </div>
            {faceFileName && (
              <div className="file-info">
                <span className="file-name">📁 {faceFileName}</span>
              </div>
            )}
            {faceImage && (
              <div className="preview-container">
                <img src={faceImage} alt="Your face" className="preview-image" />
              </div>
            )}
          </div>
        </div>

        {processingStatus && (
          <div className={`status-message ${processingStatus.includes('✅') ? 'success' : processingStatus.includes('⚠️') ? 'warning' : 'info'}`}>
            {isProcessing && <span className="spinner">⏳</span>}
            {processingStatus}
          </div>
        )}

        {faceDetectionResults && faceDetectionResults.facesDetected > 0 && (
          <div className="face-detection-info">
            <h4>🎯 Jersey Face Detection Results:</h4>
            <p>Detected {faceDetectionResults.facesDetected} face(s) in the jersey image</p>
            <div className="face-regions">
              {faceDetectionResults.faceRegions.map((region, index) => (
                <div key={index} className="face-region">
                  Face {index + 1}: Confidence {Math.round(region.confidence * 100)}%
                </div>
              ))}
            </div>
          </div>
        )}

        {faceImageDetectionResults && faceImageDetectionResults.facesDetected > 0 && (
          <div className="face-detection-info">
            <h4>👤 Your Face Detection Results:</h4>
            <p>Detected {faceImageDetectionResults.facesDetected} face(s) in your uploaded image</p>
            <div className="face-regions">
              {faceImageDetectionResults.faceRegions.map((region, index) => (
                <div key={index} className="face-region">
                  Face {index + 1}: Confidence {Math.round(region.confidence * 100)}%
                  {index === 0 && faceImageDetectionResults.bestFaceRegion && (
                    <span style={{ color: '#27ae60', fontWeight: 'bold' }}> (Selected)</span>
                  )}
                </div>
              ))}
            </div>
            {faceImageDetectionResults.bestFaceRegion && (
              <div className="debug-info">
                <p><strong>Best Face Selected:</strong></p>
                <p>Position: x={Math.round(faceImageDetectionResults.bestFaceRegion.x)}, y={Math.round(faceImageDetectionResults.bestFaceRegion.y)}</p>
                <p>Size: {Math.round(faceImageDetectionResults.bestFaceRegion.width)} x {Math.round(faceImageDetectionResults.bestFaceRegion.height)}</p>
                <p>Confidence: {Math.round(faceImageDetectionResults.bestFaceRegion.confidence * 100)}%</p>
              </div>
            )}
          </div>
        )}

        {finalResultImage && (
          <div className="result-section">
            <h3>🏆 Your Face Swap Result!</h3>
            <div className="result-image">
              <img src={finalResultImage} alt="Face swap result" className="preview-image" />
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = finalResultImage;
                  link.download = 'face-swap-result.png';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }} 
                className="download-button"
              >
                💾 Download Result
              </button>
            </div>
          </div>
        )}

        <div className="action-section">
          <button 
            className="swap-button"
            onClick={handleFaceSwap}
            disabled={!jerseyFile || !faceFile || !faceDetectionResults || !faceImageDetectionResults || isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="spinner">⏳</span>
                Processing...
              </>
            ) : (
              <>
                🎭 Start Face Swap
              </>
            )}
          </button>
          
          <button 
            className="reset-button"
            onClick={resetImages}
            disabled={isProcessing}
          >
            🔄 Reset All
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacePage;