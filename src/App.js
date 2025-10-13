import React, { useState, useEffect } from 'react';
import faceSwapService from './services/faceSwapService';
import advancedFaceAlignmentService from './services/advancedFaceAlignmentService';
import AdminPanel from './AdminPanel';
import ProductPage from './ProductPage';
import DownloadPage from './DownloadPage';
import FacePage from './FacePage';
import FaceSwapPage from './FaceSwapPage';
import './App.css';

function App() {
  const [targetImage, setTargetImage] = useState(null);
  const [sourceImage, setSourceImage] = useState(null);
  const [swappedImage, setSwappedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('FACEMINT');
  const [apiStatus, setApiStatus] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);
  const [faceDetectionResults, setFaceDetectionResults] = useState(null);
  const [useAdvancedFaceSwap, setUseAdvancedFaceSwap] = useState(true);

  // Check if we're on the admin route
  const isAdminRoute = window.location.pathname === '/admin';
  
  // Check if we're on the product route
  const isProductRoute = window.location.pathname === '/product';
  
  // Check if we're on the download route
  const isDownloadRoute = window.location.pathname === '/download';
  
  // Check if we're on the face route
  const isFaceRoute = window.location.pathname === '/face';
  
  // Check if we're on the face swap route
  const isFaceSwapRoute = window.location.pathname === '/face-swap';

  // Load provider from localStorage on component mount
  useEffect(() => {
    const savedProvider = localStorage.getItem('faceSwapProvider');
    if (savedProvider) {
      setSelectedProvider(savedProvider);
      faceSwapService.setProvider(savedProvider);
    }
    
    // Initialize advanced face alignment service
    initializeAdvancedFaceSwap();
    
    // Check backend health on mount
    checkBackendHealth();
  }, []);

  const initializeAdvancedFaceSwap = async () => {
    try {
      console.log('Initializing advanced face swap service...');
      const initialized = await advancedFaceAlignmentService.initialize();
      if (initialized) {
        console.log('Advanced face swap service initialized successfully');
      } else {
        console.warn('Failed to initialize advanced face swap service, falling back to basic service');
        setUseAdvancedFaceSwap(false);
      }
    } catch (error) {
      console.error('Error initializing advanced face swap service:', error);
      setUseAdvancedFaceSwap(false);
    }
  };

  const handleFileSelect = (file, type) => {
    try {
      faceSwapService.validateImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (type === 'target') {
          setTargetImage({ file, preview: reader.result });
        } else {
          setSourceImage({ file, preview: reader.result });
        }
        setError(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTargetFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file, 'target');
    }
  };

  const handleSourceFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file, 'source');
    }
  };

  const handleFaceSwap = async () => {
    if (!targetImage || !sourceImage) {
      setError('Please upload both images before swapping faces.');
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Initializing face swap...');
    setError(null);
    setSuccess(null);
    setFaceDetectionResults(null);

    try {
      if (useAdvancedFaceSwap) {
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
          targetImage.file,
          sourceImage.file,
          faceSwapService // Pass backend service
        );

        if (result.success) {
          setSwappedImage(result.swappedImage);
          setFaceDetectionResults(result.processingInfo);
          setSuccess(`Face swap completed successfully! Detected ${result.processingInfo.jerseyFacesDetected} face(s) in jersey and ${result.processingInfo.userFacesDetected} face(s) in your photo. Faces aligned, lighting/color normalized, and sent to backend for processing.`);
        } else {
          throw new Error(result.error || 'Advanced face swap failed');
        }
      } else {
        // Fallback to basic face swap service
        setProcessingMessage('Uploading images to server...');
        
        const result = await faceSwapService.swapFaces(
          targetImage.file, 
          sourceImage.file,
          {
            enhance: true,
            quality: 'high'
          }
        );

        if (result.success) {
          // Handle different response formats
          if (result.imageData) {
            setSwappedImage(result.imageData);
          } else if (result.imageUrl) {
            setSwappedImage(result.imageUrl);
          } else {
            throw new Error('No image data received from API');
          }
          setSuccess('Face swap completed successfully!');
        } else {
          throw new Error('Face swap failed');
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

  const downloadImage = () => {
    if (swappedImage) {
      const link = document.createElement('a');
      link.href = swappedImage;
      link.download = 'face-swapped-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetImages = () => {
    setTargetImage(null);
    setSourceImage(null);
    setSwappedImage(null);
    setError(null);
    setSuccess(null);
    setFaceDetectionResults(null);
  };

  const handleProviderChange = (newProvider) => {
    setSelectedProvider(newProvider);
    faceSwapService.setProvider(newProvider);
    localStorage.setItem('faceSwapProvider', newProvider);
  };

  const checkApiStatus = async () => {
    try {
      const status = await faceSwapService.checkApiStatus();
      setApiStatus(status);
    } catch (error) {
      setApiStatus(false);
    }
  };

  const checkBackendHealth = async () => {
    try {
      const status = await faceSwapService.checkBackendHealth();
      setBackendStatus(status);
    } catch (error) {
      setBackendStatus(false);
    }
  };

  const selectJersey = (teamName, jerseyImage, faceImage) => {
    // Save selected team data to localStorage
    const teamData = {
      name: teamName,
      jerseyImage: jerseyImage,
      faceImage: faceImage
    };
    localStorage.setItem('selectedTeam', JSON.stringify(teamData));
    
    // Redirect to product page
    window.location.href = '/product';
  };

  // If we're on the admin route, show the admin panel
  if (isAdminRoute) {
    return <AdminPanel />;
  }

  // If we're on the product route, show the product page
  if (isProductRoute) {
    return <ProductPage />;
  }

  // If we're on the download route, show the download page
  if (isDownloadRoute) {
    return <DownloadPage />;
  }

  // If we're on the face route, show the face page
  if (isFaceRoute) {
    return <FacePage />;
  }

  // If we're on the face swap route, show the face swap page
  if (isFaceSwapRoute) {
    return <FaceSwapPage />;
  }


  return (
    <div className="App">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              ⚽ Become a Football Legend in Seconds! ⚽
            </h1>
            <p className="hero-subtitle">
              Transform yourself into a football legend! Upload your photo and see yourself wearing your favorite team's jersey with professional AI technology.
            </p>
            <div className="hero-actions">
              <a href="/face-swap" className="hero-button primary">
                🎯 Advanced Face Swap Studio
              </a>
              <a href="#upload-section" className="hero-button secondary">
                ⚽ Quick Face Swap
              </a>
            </div>
          </div>
          <div className="hero-image">
            <div className="football-field">
              <div className="field-lines"></div>
              <div className="center-circle"></div>
              <div className="goal-posts"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Main App Section */}
      <main className="app-main">
        <div id="upload-section" className="upload-section mobile-hidden">
          <div className="section-header">
            <h2>🚀 Create Your Football Fantasy</h2>
            <p>Upload your photo and a team jersey image to see yourself as a football star!</p>
            <div className="face-detection-info">
              <div className="detection-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={useAdvancedFaceSwap}
                    onChange={(e) => setUseAdvancedFaceSwap(e.target.checked)}
                    disabled={isProcessing}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">Advanced Face Detection & Alignment</span>
                </label>
              </div>
              <div className="detection-features">
                {useAdvancedFaceSwap ? (
                  <div className="features-list">
                    <span className="feature-item">🎯 Face Detection with Landmarks</span>
                    <span className="feature-item">🔄 Automatic Face Alignment</span>
                    <span className="feature-item">📐 Scale & Rotation Matching</span>
                    <span className="feature-item">🌐 Backend Face Swapping</span>
                    <span className="feature-item">🎨 Lighting & Color Normalization</span>
                    <span className="feature-item">✨ Hybrid Processing</span>
                  </div>
                ) : (
                  <div className="features-list">
                    <span className="feature-item">⚡ Fast Processing</span>
                    <span className="feature-item">🌐 Server-based Processing</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="upload-container">
            <div className="upload-box">
              <div className="upload-header">
                <span className="upload-icon">👕</span>
                <h3>Team Jersey</h3>
              </div>
              <p>Upload the team jersey or shirt you want to wear</p>
              <div className="file-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleTargetFileChange}
                  id="target-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="target-upload" className="file-upload-label">
                  {targetImage ? (
                    <div className="image-preview">
                      <img src={targetImage.preview} alt="Team Jersey" />
                      <div className="image-overlay">
                        <span>📤 Change Jersey</span>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <div className="upload-icon-large">👕</div>
                      <p>Click to upload team jersey</p>
                      <small>Supports: JPG, PNG, WebP</small>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="upload-box">
              <div className="upload-header">
                <span className="upload-icon">👤</span>
                <h3>Your Photo</h3>
              </div>
              <p>Upload your face photo to put on the jersey</p>
              <div className="file-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSourceFileChange}
                  id="source-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="source-upload" className="file-upload-label">
                  {sourceImage ? (
                    <div className="image-preview">
                      <img src={sourceImage.preview} alt="Your Face" />
                      <div className="image-overlay">
                        <span>📤 Change Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <div className="upload-icon-large">👤</div>
                      <p>Click to upload your photo</p>
                      <small>Supports: JPG, PNG, WebP</small>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="action-section">
            <button 
              onClick={handleFaceSwap}
              disabled={!targetImage || !sourceImage || isProcessing}
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
                  Put Me on the Team!
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

          {isProcessing && (
            <div className="progress-indicator">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <p className="progress-text">
                {processingMessage || 'Processing your face swap... This may take a few minutes.'}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="alert error">
            <span>❌</span>
            <span>{error.toString()}</span>
          </div>
        )}

        {success && (
          <div className="alert success">
            <span>✅</span>
            <span>{success.toString()}</span>
          </div>
        )}

        {swappedImage && (
          <div className="result-section">
            <h3>🏆 Your Football Fantasy is Ready!</h3>
            <div className="result-image">
              <img src={swappedImage} alt="Your Face on Team Jersey" />
              <button onClick={downloadImage} className="download-button">
                <span>💾</span>
                Download Your Jersey
              </button>
            </div>
            {faceDetectionResults && (
              <div className="face-detection-results">
                <h4>🔍 Face Detection Results</h4>
                <div className="detection-stats">
                  <div className="stat-item">
                    <span className="stat-label">Jersey Faces Detected:</span>
                    <span className="stat-value">{faceDetectionResults.jerseyFacesDetected}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Your Photo Faces Detected:</span>
                    <span className="stat-value">{faceDetectionResults.userFacesDetected}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Faces Successfully Swapped:</span>
                    <span className="stat-value">{faceDetectionResults.facesSwapped}</span>
                  </div>
                </div>
                <div className="detection-process">
                  <p>✅ Face regions and landmarks extracted</p>
                  <p>✅ User face aligned to match jersey face orientation</p>
                  <p>✅ Scale and rotation automatically adjusted</p>
                  <p>✅ Lighting and color normalized between images</p>
                  <p>✅ Skin tones preserved across different ethnicities</p>
                  <p>✅ Aligned and normalized images sent to backend</p>
                  <p>✅ Professional quality face swap completed</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features Section */}
        <section className="features-section">
          <h2>Why Choose Our Football Face Swap?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Perfect Face Matching</h3>
              <p>Advanced AI ensures your face fits perfectly on any team jersey with natural lighting and shadows.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Get your results in under 30 seconds with our optimized processing pipeline.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Professional Quality</h3>
              <p>Studio-quality results that look like professional photoshoots, not obvious edits.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>Your photos are processed securely and never stored permanently on our servers.</p>
            </div>
          </div>
        </section>

        {/* Jersey Selection Section */}
        <section className="jersey-selection-section">
          <h2>Choose Your Team Jersey</h2>
          <p>Select your favorite football team jersey to put your face on!</p>
          
          {/* Premier League Section */}
          <div className="tournament-section">
            <h3 className="tournament-title">🏆 Premier League</h3>
          <div className="jersey-grid">
            <div className="jersey-card" onClick={() => selectJersey('Arsenal', 'https://i.postimg.cc/XYsK9vQN/Arsenal.jpg', 'https://i.postimg.cc/MHZK0zsS/Arsenalman.png')}>
              <div className="jersey-image">
                <img src="https://i.postimg.cc/XYsK9vQN/Arsenal.jpg" alt="Arsenal Jersey" />
              </div>
              <h4>Arsenal</h4>
              <p>Gunners Red Jersey</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Aston Villa', 'https://i.postimg.cc/KvZgQ2Km/Aston-Villa.jpg', 'https://i.postimg.cc/Gt3hPbXN/Aston-Villa-Man.jpg')}>
              <div className="jersey-image">
                <img src="https://i.postimg.cc/KvZgQ2Km/Aston-Villa.jpg" alt="Aston Villa Jersey" />
              </div>
              <h4>Aston Villa</h4>
              <p>Claret & Blue Jersey</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('AFC Bournemouth', 'https://i.postimg.cc/Bv18tZzN/AFC-Bournemouth.jpg', 'https://i.postimg.cc/Bv18tZzN/AFC-Bournemouth.jpg')}>
              <div className="jersey-image">
                <img src="https://i.postimg.cc/Bv18tZzN/AFC-Bournemouth.jpg" alt="AFC Bournemouth Jersey" />
              </div>
              <h4>AFC Bournemouth</h4>
              <p>Cherries Red & Black</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Brentford', 'https://i.postimg.cc/rsgs7DdD/Brentford.jpg', 'https://i.postimg.cc/cC147dFD/Brentford-Man.png')}>
              <div className="jersey-image">
                <img src="https://i.postimg.cc/rsgs7DdD/Brentford.jpg" alt="Brentford Jersey" />
              </div>
              <h4>Brentford</h4>
              <p>Bees Red & White</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Brighton & Hove Albion', 'https://i.postimg.cc/tJRCd9B2/Brighton-Hove-Albion.jpg', 'https://i.postimg.cc/T12YjTt9/Brighton-Hove-Albion-Man.png')}>
              <div className="jersey-image">
                <img src="https://i.postimg.cc/tJRCd9B2/Brighton-Hove-Albion.jpg" alt="Brighton Jersey" />
              </div>
              <h4>Brighton & Hove Albion</h4>
              <p>Seagulls Blue & White</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Burnley', 'https://i.postimg.cc/cHBL8vBj/Burnley.jpg', 'https://i.postimg.cc/sX4gZM4N/Burnley-Man.jpg')}>
              <div className="jersey-image">
                <img src="https://i.postimg.cc/cHBL8vBj/Burnley.jpg" alt="Burnley Jersey" />
              </div>
              <h4>Burnley</h4>
              <p>Clarets Claret & Blue</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Chelsea', 'https://i.postimg.cc/nzGhQXGW/Chelsea.jpg', 'https://i.postimg.cc/V6WkbJWM/Chelsea-Man.png')}>
              <div className="jersey-image">
                <img src="https://i.postimg.cc/nzGhQXGW/Chelsea.jpg" alt="Chelsea Jersey" />
              </div>
              <h4>Chelsea</h4>
              <p>Blues Royal Blue</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Crystal Palace', '/jerseys/crystal_palace_home_jersey.jpg', '/faces/Crystal Palace.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/crystal_palace_home_jersey.jpg" alt="Crystal Palace Jersey" />
              </div>
                <h4>Crystal Palace</h4>
                <p>Red & Blue Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Everton', '/jerseys/everton_home_jersey.jpg', '/faces/Everton.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/everton_home_jersey.jpg" alt="Everton Jersey" />
              </div>
                <h4>Everton</h4>
                <p>Blue with Pattern</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Fulham', '/jerseys/fulham_home_jersey.jpg', '/faces/Fulham.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/fulham_home_jersey.jpg" alt="Fulham Jersey" />
              </div>
                <h4>Fulham</h4>
                <p>White with Black Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Leeds United', '/jerseys/leeds_united_home_jersey.jpg', '/faces/Leeds United.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/leeds_united_home_jersey.jpg" alt="Leeds United Jersey" />
              </div>
                <h4>Leeds United</h4>
                <p>White with Blue & Yellow</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Liverpool', '/jerseys/liverpool_home_jersey.jpg', '/faces/Liverpool.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/liverpool_home_jersey.jpg" alt="Liverpool Jersey" />
              </div>
                <h4>Liverpool</h4>
                <p>Red with White Pinstripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Manchester City', '/jerseys/manchester_city_home_jersey.jpg', '/faces/Manchester City.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/manchester_city_home_jersey.jpg" alt="Manchester City Jersey" />
              </div>
                <h4>Manchester City</h4>
                <p>Blue with White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Manchester United', '/jerseys/manchester_united_home_jersey.jpg', '/faces/Manchester United.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/manchester_united_home_jersey.jpg" alt="Manchester United Jersey" />
              </div>
                <h4>Manchester United</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Newcastle United', '/jerseys/newcastle_united_home_jersey.jpg', '/faces/Newcastle United.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/newcastle_united_home_jersey.jpg" alt="Newcastle United Jersey" />
                </div>
                <h4>Newcastle United</h4>
              <p>Black & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Nottingham Forest', '/jerseys/nottingham_forest_home_jersey.jpg', '/faces/Nottingham Forest.jpg')}>
              <div className="jersey-image">
                  <img src="/jerseys/nottingham_forest_home_jersey.jpg" alt="Nottingham Forest Jersey" />
              </div>
                <h4>Nottingham Forest</h4>
                <p>Red with White Pinstripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Sunderland', '/jerseys/sunderland_home_jersey.jpg', '/faces/Sunderland.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/sunderland_home_jersey.jpg" alt="Sunderland Jersey" />
              </div>
                <h4>Sunderland</h4>
                <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Tottenham Hotspur', '/jerseys/tottenham_hotspur_home_jersey.jpg', '/faces/Tottenham Hotspur.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/tottenham_hotspur_home_jersey.jpg" alt="Tottenham Hotspur Jersey" />
              </div>
                <h4>Tottenham Hotspur</h4>
                <p>White with Navy & Red</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('West Ham United', '/jerseys/west_ham_united_home_jersey.jpg', '/faces/West Ham United.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/west_ham_united_home_jersey.jpg" alt="West Ham United Jersey" />
              </div>
                <h4>West Ham United</h4>
                <p>Claret with White & Blue</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Wolverhampton Wanderers', '/jerseys/wolverhampton_wanderers_home_jersey.jpg', '/faces/Wolverhampton Wanderers.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/wolverhampton_wanderers_home_jersey.jpg" alt="Wolverhampton Wanderers Jersey" />
              </div>
                <h4>Wolverhampton Wanderers</h4>
                <p>Gold with Black Details</p>
              </div>
            </div>
            </div>
            
          {/* EFL Championship Section */}
          <div className="tournament-section">
            <h3 className="tournament-title">🏆 EFL Championship</h3>
            <div className="jersey-grid">
            
              <div className="jersey-card" onClick={() => selectJersey('Birmingham City', '/jerseys/birmingham_city_home_jersey.jpg', '/faces/Birmingham City.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/birmingham_city_home_jersey.jpg" alt="Birmingham City Jersey" />
              </div>
                <h4>Birmingham City</h4>
                <p>Blue with Gold Accents</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Blackburn Rovers', '/jerseys/blackburn_rovers_home_jersey.jpg', '/faces/Blackburn Rovers.jpg')}>
              <div className="jersey-image">
                  <img src="/jerseys/blackburn_rovers_home_jersey.jpg" alt="Blackburn Rovers Jersey" />
              </div>
                <h4>Blackburn Rovers</h4>
              <p>Blue & White Split</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Bristol City', '/jerseys/bristol_city_home_jersey.jpg', '/faces/Bristol City.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/bristol_city_home_jersey.jpg" alt="Bristol City Jersey" />
              </div>
                <h4>Bristol City</h4>
                <p>Red with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Charlton Athletic', '/jerseys/charlton_athletic_home_jersey.jpg', '/faces/Charlton Athletic.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/charlton_athletic_home_jersey.jpg" alt="Charlton Athletic Jersey" />
              </div>
                <h4>Charlton Athletic</h4>
                <p>Red with White Panels</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Coventry City', '/jerseys/coventry_city_home_jersey.jpg', '/faces/Coventry City.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/coventry_city_home_jersey.jpg" alt="Coventry City Jersey" />
              </div>
                <h4>Coventry City</h4>
                <p>Blue with Checkered Pattern</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Derby County', '/jerseys/derby_county_home_jersey.jpg', '/faces/Derby County.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/derby_county_home_jersey.jpg" alt="Derby County Jersey" />
              </div>
                <h4>Derby County</h4>
                <p>White with Black & Yellow</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Hull City', '/jerseys/hull_city_home_jersey.jpg', '/faces/Hull City.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/hull_city_home_jersey.jpg" alt="Hull City Jersey" />
              </div>
                <h4>Hull City</h4>
                <p>Orange with Black Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Ipswich Town', '/jerseys/ipswich_town_home_jersey.jpg', '/faces/Ipswich Town.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/ipswich_town_home_jersey.jpg" alt="Ipswich Town Jersey" />
              </div>
                <h4>Ipswich Town</h4>
                <p>Blue with Pattern</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Leicester City', '/jerseys/leicester_city_home_jersey.jpg', '/faces/Leicester City.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/leicester_city_home_jersey.jpg" alt="Leicester City Jersey" />
              </div>
                <h4>Leicester City</h4>
                <p>Blue with Gold Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Middlesbrough', '/jerseys/middlesbrough_home_jersey.jpg', '/faces/Middlesbrough.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/middlesbrough_home_jersey.jpg" alt="Middlesbrough Jersey" />
              </div>
                <h4>Middlesbrough</h4>
                <p>Red with White Band</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Millwall', '/jerseys/millwall_home_jersey.jpg', '/faces/Millwall.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/millwall_home_jersey.jpg" alt="Millwall Jersey" />
              </div>
                <h4>Millwall</h4>
                <p>Blue with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Norwich City', '/jerseys/norwich_city_home_jersey.jpg', '/faces/Norwich City.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/norwich_city_home_jersey.jpg" alt="Norwich City Jersey" />
              </div>
                <h4>Norwich City</h4>
                <p>Yellow with Green Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Oxford United', '/jerseys/oxford_united_home_jersey.jpg', '/faces/Oxford United.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/oxford_united_home_jersey.jpg" alt="Oxford United Jersey" />
              </div>
                <h4>Oxford United</h4>
                <p>Yellow with Navy Accents</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Portsmouth', '/jerseys/portsmouth_home_jersey.jpg', '/faces/Portsmouth.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/portsmouth_home_jersey.jpg" alt="Portsmouth Jersey" />
              </div>
                <h4>Portsmouth</h4>
                <p>Blue with Pattern</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Preston North End', '/jerseys/preston_north_end_home_jersey.jpg', '/faces/Preston North End.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/preston_north_end_home_jersey.jpg" alt="Preston North End Jersey" />
              </div>
                <h4>Preston North End</h4>
                <p>White with Pattern</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Queens Park Rangers', '/jerseys/queens_park_rangers_home_jersey.jpg', '/faces/Queens Park Rangers.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/queens_park_rangers_home_jersey.jpg" alt="Queens Park Rangers Jersey" />
              </div>
                <h4>Queens Park Rangers</h4>
                <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Sheffield United', '/jerseys/sheffield_united_home_jersey.jpg', '/faces/Sheffield United.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/sheffield_united_home_jersey.jpg" alt="Sheffield United Jersey" />
              </div>
                <h4>Sheffield United</h4>
              <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Sheffield Wednesday', '/jerseys/sheffield_wednesday_home_jersey.jpg', '/faces/Sheffield Wednesday.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/sheffield_wednesday_home_jersey.jpg" alt="Sheffield Wednesday Jersey" />
              </div>
                <h4>Sheffield Wednesday</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Southampton', '/jerseys/southampton_home_jersey.jpg', '/faces/Southampton.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/southampton_home_jersey.jpg" alt="Southampton Jersey" />
              </div>
                <h4>Southampton</h4>
                <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Stoke City', '/jerseys/stoke_city_home_jersey.jpg', '/faces/Stoke City.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/stoke_city_home_jersey.jpg" alt="Stoke City Jersey" />
              </div>
                <h4>Stoke City</h4>
                <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Swansea City', '/jerseys/swansea_city_home_jersey.jpg', '/faces/Swansea City.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/swansea_city_home_jersey.jpg" alt="Swansea City Jersey" />
              </div>
                <h4>Swansea City</h4>
                <p>White with Checkered Pattern</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Watford', '/jerseys/watford_home_jersey.jpg', '/faces/Watford.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/watford_home_jersey.jpg" alt="Watford Jersey" />
                </div>
                <h4>Watford</h4>
                <p>Yellow with Red Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('West Bromwich Albion', '/jerseys/west_bromwich_albion_home_jersey.jpg', '/faces/West Bromwich Albion.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/west_bromwich_albion_home_jersey.jpg" alt="West Bromwich Albion Jersey" />
                </div>
                <h4>West Bromwich Albion</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Wrexham', '/jerseys/wrexham_home_jersey.jpg', '/faces/Wrexham.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/wrexham_home_jersey.jpg" alt="Wrexham Jersey" />
              </div>
                <h4>Wrexham</h4>
                <p>Red with White Details</p>
              </div>
            </div>
            </div>
            
          {/* EFL League One Section */}
          <div className="tournament-section">
            <h3 className="tournament-title">🏆 EFL League One</h3>
            <div className="jersey-grid">
            
              <div className="jersey-card" onClick={() => selectJersey('AFC Wimbledon', '/jerseys/afc_wimbledon_home_jersey.jpg', '/faces/AFC Wimbledon.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/afc_wimbledon_home_jersey.jpg" alt="AFC Wimbledon Jersey" />
              </div>
                <h4>AFC Wimbledon</h4>
                <p>Blue with Yellow Details</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Barnsley', '/jerseys/barnsley_home_jersey.jpg', '/faces/Barnsley.png')}>
              <div className="jersey-image">
                <img src="/jerseys/barnsley_home_jersey.jpg" alt="Barnsley Jersey" />
              </div>
              <h4>Barnsley</h4>
              <p>Red with White Details</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Blackpool', '/jerseys/blackpool_home_jersey.jpg', '/faces/Blackpool.jpg')}>
              <div className="jersey-image">
                <img src="/jerseys/blackpool_home_jersey.jpg" alt="Blackpool Jersey" />
              </div>
              <h4>Blackpool</h4>
              <p>Orange with White Panels</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Bolton Wanderers', '/jerseys/bolton_wanderers_home_jersey.jpg', '/faces/Bolton Wanderers.png')}>
              <div className="jersey-image">
                <img src="/jerseys/bolton_wanderers_home_jersey.jpg" alt="Bolton Wanderers Jersey" />
              </div>
              <h4>Bolton Wanderers</h4>
              <p>White with Navy & Red</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Bradford City', '/jerseys/bradford_city_home_jersey.jpg', '/faces/Bradford City.png')}>
              <div className="jersey-image">
                <img src="/jerseys/bradford_city_home_jersey.jpg" alt="Bradford City Jersey" />
              </div>
              <h4>Bradford City</h4>
              <p>Maroon with Gold Stripes</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Burton Albion', '/jerseys/burton_albion_home_jersey.jpg', '/faces/Burton Albion.png')}>
              <div className="jersey-image">
                <img src="/jerseys/burton_albion_home_jersey.jpg" alt="Burton Albion Jersey" />
              </div>
              <h4>Burton Albion</h4>
              <p>Gold & Black Split</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Cardiff City', '/jerseys/cardiff_city_home_jersey.jpg', '/faces/Cardiff City.png')}>
              <div className="jersey-image">
                <img src="/jerseys/cardiff_city_home_jersey.jpg" alt="Cardiff City Jersey" />
              </div>
              <h4>Cardiff City</h4>
              <p>Blue with White Pinstripes</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Doncaster Rovers', '/jerseys/doncaster_rovers_home_jersey.jpg', '/faces/Doncaster Rovers.png')}>
              <div className="jersey-image">
                <img src="/jerseys/doncaster_rovers_home_jersey.jpg" alt="Doncaster Rovers Jersey" />
              </div>
              <h4>Doncaster Rovers</h4>
              <p>Red & White Stripes</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Exeter City', '/jerseys/exeter_city_home_jersey.jpg', '/faces/Exeter City.png')}>
              <div className="jersey-image">
                <img src="/jerseys/exeter_city_home_jersey.jpg" alt="Exeter City Jersey" />
              </div>
              <h4>Exeter City</h4>
              <p>Red & White Stripes</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Huddersfield Town', '/jerseys/huddersfield_town_home_jersey.jpg', '/faces/Huddersfield Town.png')}>
              <div className="jersey-image">
                <img src="/jerseys/huddersfield_town_home_jersey.jpg" alt="Huddersfield Town Jersey" />
              </div>
              <h4>Huddersfield Town</h4>
              <p>Blue & White Stripes</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Leyton Orient', '/jerseys/leyton_orient_home_jersey.jpg', '/faces/Leyton Orient.png')}>
              <div className="jersey-image">
                <img src="/jerseys/leyton_orient_home_jersey.jpg" alt="Leyton Orient Jersey" />
              </div>
              <h4>Leyton Orient</h4>
              <p>Red with Black Details</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Lincoln City', '/jerseys/lincoln_city_home_jersey.jpg', '/faces/Lincoln City.png')}>
              <div className="jersey-image">
                <img src="/jerseys/lincoln_city_home_jersey.jpg" alt="Lincoln City Jersey" />
              </div>
              <h4>Lincoln City</h4>
              <p>Red & White Stripes</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Luton Town', '/jerseys/luton_town_home_jersey.jpg', '/faces/Luton Town.png')}>
              <div className="jersey-image">
                <img src="/jerseys/luton_town_home_jersey.jpg" alt="Luton Town Jersey" />
              </div>
              <h4>Luton Town</h4>
              <p>Orange with Black Sleeves</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Mansfield Town', '/jerseys/mansfield_town_home_jersey.jpg', '/faces/Mansfield Town.png')}>
              <div className="jersey-image">
                <img src="/jerseys/mansfield_town_home_jersey.jpg" alt="Mansfield Town Jersey" />
              </div>
              <h4>Mansfield Town</h4>
              <p>Yellow with Blue Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Northampton Town', '/jerseys/northampton_town_home_jersey.jpg', '/faces/Northampton Town.png')}>
              <div className="jersey-image">
                <img src="/jerseys/northampton_town_home_jersey.jpg" alt="Northampton Town Jersey" />
              </div>
              <h4>Northampton Town</h4>
              <p>Maroon with White Accents</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Peterborough United', '/jerseys/peterborough_united_home_jersey.jpg', '/faces/Peterborough United.png')}>
              <div className="jersey-image">
                <img src="/jerseys/peterborough_united_home_jersey.jpg" alt="Peterborough United Jersey" />
              </div>
              <h4>Peterborough United</h4>
              <p>Blue with White Accents</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Plymouth Argyle', '/jerseys/plymouth_argyle_home_jersey.jpg', '/faces/Plymouth Argyle.png')}>
              <div className="jersey-image">
                <img src="/jerseys/plymouth_argyle_home_jersey.jpg" alt="Plymouth Argyle Jersey" />
              </div>
              <h4>Plymouth Argyle</h4>
              <p>Green with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Port Vale', '/jerseys/port_vale_home_jersey.jpg', '/faces/Port Vale.png')}>
              <div className="jersey-image">
                <img src="/jerseys/port_vale_home_jersey.jpg" alt="Port Vale Jersey" />
              </div>
              <h4>Port Vale</h4>
              <p>White with Black Accents</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Reading', '/jerseys/reading_home_jersey.jpg', '/faces/Reading.jpg')}>
              <div className="jersey-image">
                <img src="/jerseys/reading_home_jersey.jpg" alt="Reading Jersey" />
              </div>
              <h4>Reading</h4>
              <p>White with Blue & Red Pattern</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Rotherham United', '/jerseys/rotherham_united_home_jersey.jpg', '/faces/Rotherham United.png')}>
              <div className="jersey-image">
                <img src="/jerseys/rotherham_united_home_jersey.jpg" alt="Rotherham United Jersey" />
              </div>
              <h4>Rotherham United</h4>
              <p>Red with White Sleeves</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Stevenage', '/jerseys/stevenage_home_jersey.jpg', '/faces/Stevenage.png')}>
              <div className="jersey-image">
                <img src="/jerseys/stevenage_home_jersey.jpg" alt="Stevenage Jersey" />
              </div>
              <h4>Stevenage</h4>
              <p>White with Red Sleeves</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Stockport County', '/jerseys/stockport_county_home_jersey.jpg', '/faces/Stockport County.png')}>
              <div className="jersey-image">
                <img src="/jerseys/stockport_county_home_jersey.jpg" alt="Stockport County Jersey" />
              </div>
              <h4>Stockport County</h4>
              <p>Blue with White Accents</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Wigan Athletic', '/jerseys/wigan_athletic_home_jersey.jpg', '/faces/Wigan Athletic.png')}>
              <div className="jersey-image">
                <img src="/jerseys/wigan_athletic_home_jersey.jpg" alt="Wigan Athletic Jersey" />
              </div>
              <h4>Wigan Athletic</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Wycombe Wanderers', '/jerseys/wycombe_wanderers_home_jersey.jpg', '/faces/Wycombe Wanderers.jpg')}>
              <div className="jersey-image">
                <img src="/jerseys/wycombe_wanderers_home_jersey.jpg" alt="Wycombe Wanderers Jersey" />
              </div>
              <h4>Wycombe Wanderers</h4>
              <p>Blue Split Design</p>
              </div>
            </div>
            </div>
            
          {/* EFL League Two Section */}
          <div className="tournament-section">
            <h3 className="tournament-title">🏆 EFL League Two</h3>
            <div className="jersey-grid">
            
              <div className="jersey-card" onClick={() => selectJersey('Barnet', '/jerseys/barnet_home_jersey.jpg', '/faces/Barnet.jpg')}>
              <div className="jersey-image">
                  <img src="/jerseys/barnet_home_jersey.jpg" alt="Barnet Jersey" />
              </div>
                <h4>Barnet</h4>
                <p>Cream with Black Accents</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Barrow', '/jerseys/barrow_home_jersey.jpg', '/faces/Barrow.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/barrow_home_jersey.jpg" alt="Barrow Jersey" />
                </div>
                <h4>Barrow</h4>
                <p>White with Black Shoulders</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Bristol Rovers', '/jerseys/bristol_rovers_home_jersey.jpg', '/faces/Bristol Rovers.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/bristol_rovers_home_jersey.jpg" alt="Bristol Rovers Jersey" />
                </div>
                <h4>Bristol Rovers</h4>
                <p>Blue & White Split</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Bromley', '/jerseys/bromley_home_jersey.jpg', '/faces/Bromley.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/bromley_home_jersey.jpg" alt="Bromley Jersey" />
                </div>
                <h4>Bromley</h4>
                <p>Orange & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cambridge United', '/jerseys/cambridge_united_home_jersey.jpg', '/faces/Cambridge United.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/cambridge_united_home_jersey.jpg" alt="Cambridge United Jersey" />
                </div>
                <h4>Cambridge United</h4>
                <p>White with Black Accents</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cheltenham Town', '/jerseys/cheltenham_town_home_jersey.jpg', '/faces/Cheltenham Town.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/cheltenham_town_home_jersey.jpg" alt="Cheltenham Town Jersey" />
                </div>
                <h4>Cheltenham Town</h4>
                <p>Red & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Chesterfield', '/jerseys/chesterfield_home_jersey.jpg', '/faces/Chesterfield.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/chesterfield_home_jersey.jpg" alt="Chesterfield Jersey" />
                </div>
                <h4>Chesterfield</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Colchester United', '/jerseys/colchester_united_home_jersey.jpg', '/faces/Colchester United.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/colchester_united_home_jersey.jpg" alt="Colchester United Jersey" />
              </div>
                <h4>Colchester United</h4>
                <p>Blue & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Crawley Town', '/jerseys/crawley_town_home_jersey.jpg', '/faces/Crawley Town.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/crawley_town_home_jersey.jpg" alt="Crawley Town Jersey" />
                </div>
                <h4>Crawley Town</h4>
                <p>Red & White Design</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Crewe Alexandra', '/jerseys/crewe_alexandra_home_jersey.jpg', '/faces/Crewe Alexandra.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/crewe_alexandra_home_jersey.jpg" alt="Crewe Alexandra Jersey" />
                </div>
                <h4>Crewe Alexandra</h4>
              <p>Red with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Fleetwood Town', '/jerseys/fleetwood_town_home_jersey.jpg', '/faces/Fleetwood Town.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/fleetwood_town_home_jersey.jpg" alt="Fleetwood Town Jersey" />
              </div>
                <h4>Fleetwood Town</h4>
                <p>Red & White Design</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Gillingham', '/jerseys/gillingham_home_jersey.jpg', '/faces/Gillingham.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/gillingham_home_jersey.jpg" alt="Gillingham Jersey" />
              </div>
                <h4>Gillingham</h4>
                <p>Blue with White Lines</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Grimsby Town', '/jerseys/grimsby_town_home_jersey.jpg', '/faces/Grimsby Town.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/grimsby_town_home_jersey.jpg" alt="Grimsby Town Jersey" />
              </div>
                <h4>Grimsby Town</h4>
                <p>Black & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Harrogate Town', '/jerseys/harrogate_town_home_jersey.jpg', '/faces/Harrogate Town.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/harrogate_town_home_jersey.jpg" alt="Harrogate Town Jersey" />
              </div>
                <h4>Harrogate Town</h4>
                <p>Yellow & Grey Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Milton Keynes Irish FC', '/jerseys/milton_keynes_irish_fc_home_jersey.jpg', '/faces/Milton Keynes Irish FC.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/milton_keynes_irish_fc_home_jersey.jpg" alt="Milton Keynes Irish FC Jersey" />
              </div>
                <h4>Milton Keynes Irish FC</h4>
                <p>Green & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Newport County', '/jerseys/newport_county_home_jersey.jpg', '/jerseys/newport_county_home_jersey.jpg')}>
              <div className="jersey-image">
                  <img src="/jerseys/newport_county_home_jersey.jpg" alt="Newport County Jersey" />
              </div>
                <h4>Newport County</h4>
              <p>Gold & Black Split</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Notts County', '/jerseys/notts_county_home_jersey.jpg', '/faces/Notts County.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/notts_county_home_jersey.jpg" alt="Notts County Jersey" />
              </div>
                <h4>Notts County</h4>
                <p>Black & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Oldham Athletic', '/jerseys/oldham_athletic_home_jersey.jpg', '/faces/Oldham Athletic.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/oldham_athletic_home_jersey.jpg" alt="Oldham Athletic Jersey" />
              </div>
                <h4>Oldham Athletic</h4>
                <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Salford City', '/jerseys/salford_city_home_jersey.jpg', '/faces/Salford City.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/salford_city_home_jersey.jpg" alt="Salford City Jersey" />
              </div>
                <h4>Salford City</h4>
                <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Shrewsbury Town', '/jerseys/shrewsbury_town_home_jersey.jpg', '/faces/Shrewsbury Town.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/shrewsbury_town_home_jersey.jpg" alt="Shrewsbury Town Jersey" />
              </div>
                <h4>Shrewsbury Town</h4>
                <p>Blue & Orange Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Swindon Town', '/jerseys/swindon_town_home_jersey.jpg', '/faces/Swindon Town.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/swindon_town_home_jersey.jpg" alt="Swindon Town Jersey" />
              </div>
                <h4>Swindon Town</h4>
                <p>Red with White Shoulders</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Tranmere Rovers', '/jerseys/tranmere_rovers_home_jersey.jpg', '/faces/Tranmere Rovers.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/tranmere_rovers_home_jersey.jpg" alt="Tranmere Rovers Jersey" />
              </div>
                <h4>Tranmere Rovers</h4>
                <p>White with Blue Pinstripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Walsall FC', '/jerseys/walsall_fc_home_jersey.jpg', '/faces/Walsall FC.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/walsall_fc_home_jersey.jpg" alt="Walsall FC Jersey" />
              </div>
                <h4>Walsall FC</h4>
                <p>Red & Black Stripes</p>
              </div>
            </div>
          </div>
          
          {/* Scottish Clubs Section */}
          <div className="tournament-section">
            <h3 className="tournament-title">🏆 Scottish Clubs</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('Aberdeen', '/jerseys/Aberdeen.jpg', '/faces/Aberdeen.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Aberdeen.jpg" alt="Aberdeen Jersey" />
                </div>
                <h4>Aberdeen</h4>
              <p>Red with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Celtic', '/jerseys/Celtic.jpg', '/faces/Celtic.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Celtic.jpg" alt="Celtic Jersey" />
              </div>
                <h4>Celtic</h4>
                <p>Green & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Dundee', '/jerseys/Dundee.jpg', '/faces/Dundee.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Dundee.jpg" alt="Dundee Jersey" />
              </div>
                <h4>Dundee</h4>
                <p>Dark Blue with White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Dundee United', '/jerseys/Dundee United.jpg', '/faces/Dundee United.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Dundee United.jpg" alt="Dundee United Jersey" />
              </div>
                <h4>Dundee United</h4>
                <p>Orange & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Falkirk', '/jerseys/Falkirk.jpg', '/faces/Falkirk.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Falkirk.jpg" alt="Falkirk Jersey" />
                </div>
                <h4>Falkirk</h4>
                <p>Navy Blue with White & Red</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Hibernian', '/jerseys/Hibernian.jpg', '/faces/Hibernian.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Hibernian.jpg" alt="Hibernian Jersey" />
                </div>
                <h4>Hibernian</h4>
                <p>Green with White Sleeves</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Kilmarnock', '/jerseys/Kilmarnock.jpg', '/faces/Kilmarnock.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Kilmarnock.jpg" alt="Kilmarnock Jersey" />
                </div>
                <h4>Kilmarnock</h4>
                <p>Blue with White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Livingston', '/jerseys/Livingston.jpg', '/faces/Livingston.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Livingston.jpg" alt="Livingston Jersey" />
                </div>
                <h4>Livingston</h4>
                <p>Yellow with Black Band</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Motherwell', '/jerseys/Motherwell.jpg', '/faces/Motherwell.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Motherwell.jpg" alt="Motherwell Jersey" />
                </div>
                <h4>Motherwell</h4>
                <p>Gold with Maroon Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Rangers', '/jerseys/Rangers.jpg', '/faces/Rangers.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Rangers.jpg" alt="Rangers Jersey" />
                </div>
                <h4>Rangers</h4>
                <p>Royal Blue with White & Red</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('St Mirren', '/jerseys/St Mirren.jpg', '/faces/St Mirren.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/St Mirren.jpg" alt="St Mirren Jersey" />
                </div>
                <h4>St Mirren</h4>
                <p>White with Black Stripes</p>
              </div>
            </div>
          </div>
          
          {/* Spanish Clubs Section */}
          <div className="tournament-section">
            <h3 className="tournament-title">🏆 Spanish Clubs</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('Alaves', '/jerseys/Alaves.jpg', '/faces/Alaves.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Alaves.jpg" alt="Alaves Jersey" />
                </div>
                <h4>Alaves</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Atletico Madrid', '/jerseys/Atletico Madrid.jpg', '/faces/Atletico Madrid.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Atletico Madrid.jpg" alt="Atletico Madrid Jersey" />
              </div>
                <h4>Atletico Madrid</h4>
              <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Barcelona', '/jerseys/Barcelona.jpg', '/faces/Barcelona.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Barcelona.jpg" alt="Barcelona Jersey" />
              </div>
                <h4>Barcelona</h4>
                <p>Blue & Garnet Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Celta Vigo', '/jerseys/Celta Vigo.jpg', '/faces/Celta Vigo.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Celta Vigo.jpg" alt="Celta Vigo Jersey" />
                </div>
                <h4>Celta Vigo</h4>
                <p>Sky Blue & White</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Espanyol', '/jerseys/Espanyol.jpg', '/faces/Espanyol.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Espanyol.jpg" alt="Espanyol Jersey" />
                </div>
                <h4>Espanyol</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Getafe', '/jerseys/Getafe.jpg', '/faces/Getafe.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Getafe.jpg" alt="Getafe Jersey" />
              </div>
                <h4>Getafe</h4>
                <p>Blue with Red & Yellow</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Girona', '/jerseys/Girona.jpg', '/faces/Girona.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Girona.jpg" alt="Girona Jersey" />
              </div>
                <h4>Girona</h4>
              <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Levante', '/jerseys/Levante.jpg', '/faces/Levante.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Levante.jpg" alt="Levante Jersey" />
              </div>
                <h4>Levante</h4>
                <p>Red & Blue Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Mallorca', '/jerseys/Mallorca.jpg', '/faces/Mallorca.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Mallorca.jpg" alt="Mallorca Jersey" />
              </div>
                <h4>Mallorca</h4>
                <p>Red with Black Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Osasuna', '/jerseys/Osasuna.jpg', '/faces/Osasuna.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Osasuna.jpg" alt="Osasuna Jersey" />
              </div>
                <h4>Osasuna</h4>
                <p>Red with Blue Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Oviedo', '/jerseys/Oviedo.jpg', '/faces/Oviedo.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Oviedo.jpg" alt="Oviedo Jersey" />
              </div>
                <h4>Oviedo</h4>
                <p>Blue with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Rayo Vallecano', '/jerseys/Rayo Vallecano.jpg', '/faces/Rayo Vallecano.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Rayo Vallecano.jpg" alt="Rayo Vallecano Jersey" />
              </div>
                <h4>Rayo Vallecano</h4>
                <p>White with Red Lightning</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Real Betis', '/jerseys/Real Betis.jpg', '/faces/Real Betis.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Real Betis.jpg" alt="Real Betis Jersey" />
              </div>
                <h4>Real Betis</h4>
                <p>Green & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Real Madrid', '/jerseys/Real Madrid.jpg', '/faces/Real Madrid.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Real Madrid.jpg" alt="Real Madrid Jersey" />
              </div>
                <h4>Real Madrid</h4>
                <p>All White</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Sevilla', '/jerseys/Sevilla.jpg', '/faces/Sevilla.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Sevilla.jpg" alt="Sevilla Jersey" />
              </div>
                <h4>Sevilla</h4>
                <p>White with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Valencia', '/jerseys/Valencia.jpg', '/faces/Valencia.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Valencia.jpg" alt="Valencia Jersey" />
                </div>
                <h4>Valencia</h4>
                <p>White with Black & Orange</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Villarreal', '/jerseys/Villarreal.jpg', '/faces/Villarreal.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Villarreal.jpg" alt="Villarreal Jersey" />
                </div>
                <h4>Villarreal</h4>
                <p>Yellow with Blue Details</p>
              </div>
            </div>
          </div>
          
          {/* NFL Teams Section */}
          <div className="tournament-section">
            <h3 className="tournament-title">🏆 NFL Teams</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('Arizona Cardinals', '/jerseys/Arizona Cardinals.png', '/faces/Arizona Cardinals.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Arizona Cardinals.png" alt="Arizona Cardinals Jersey" />
                </div>
                <h4>Arizona Cardinals</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Atlanta Falcons', '/jerseys/Atlanta Falcons.jpg', '/faces/Atlanta Falcons.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Atlanta Falcons.jpg" alt="Atlanta Falcons Jersey" />
                </div>
                <h4>Atlanta Falcons</h4>
                <p>Black with Red & White</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Baltimore Ravens', '/jerseys/Baltimore Ravens.png', '/faces/Baltimore Ravens.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Baltimore Ravens.png" alt="Baltimore Ravens Jersey" />
                </div>
                <h4>Baltimore Ravens</h4>
                <p>Purple with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Buffalo Bills', '/jerseys/Buffalo Bills.png', '/faces/Buffalo Bills.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Buffalo Bills.png" alt="Buffalo Bills Jersey" />
                </div>
                <h4>Buffalo Bills</h4>
                <p>Blue with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Carolina Panthers', '/jerseys/Carolina Panthers.png', '/faces/Carolina Panthers.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Carolina Panthers.png" alt="Carolina Panthers Jersey" />
                </div>
                <h4>Carolina Panthers</h4>
                <p>Blue with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Chicago Bears', '/jerseys/Chicago Bears.png', '/faces/Chicago Bears.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Chicago Bears.png" alt="Chicago Bears Jersey" />
                </div>
                <h4>Chicago Bears</h4>
                <p>Blue with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cincinnati Bengals', '/jerseys/Cincinnati Bengals.png', '/faces/Cincinnati Bengals.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Cincinnati Bengals.png" alt="Cincinnati Bengals Jersey" />
                </div>
                <h4>Cincinnati Bengals</h4>
                <p>Black with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cleveland Browns', '/jerseys/Cleveland Browns.png', '/faces/Cleveland Browns.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Cleveland Browns.png" alt="Cleveland Browns Jersey" />
                </div>
                <h4>Cleveland Browns</h4>
                <p>Brown with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Dallas Cowboys', '/jerseys/Dallas Cowboys.png', '/faces/Dallas Cowboys.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Dallas Cowboys.png" alt="Dallas Cowboys Jersey" />
                </div>
                <h4>Dallas Cowboys</h4>
              <p>Blue with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Denver Broncos', '/jerseys/Denver Broncos.png', '/faces/Denver Broncos.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Denver Broncos.png" alt="Denver Broncos Jersey" />
              </div>
                <h4>Denver Broncos</h4>
                <p>Orange with Blue Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Detroit Lions', '/jerseys/Detroit Lions.png', '/faces/Detroit Lions.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Detroit Lions.png" alt="Detroit Lions Jersey" />
              </div>
                <h4>Detroit Lions</h4>
                <p>Blue with Silver Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Green Bay Packers', '/jerseys/Green Bay Packers.png', '/faces/Green Bay Packers.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Green Bay Packers.png" alt="Green Bay Packers Jersey" />
              </div>
                <h4>Green Bay Packers</h4>
                <p>Green with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Houston Texans', '/jerseys/Houston Texans.jpg', '/faces/Houston Texans.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Houston Texans.jpg" alt="Houston Texans Jersey" />
              </div>
                <h4>Houston Texans</h4>
                <p>Blue with Red Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Indianapolis Colts', '/jerseys/Indianapolis Colts.png', '/faces/Indianapolis Colts.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Indianapolis Colts.png" alt="Indianapolis Colts Jersey" />
              </div>
                <h4>Indianapolis Colts</h4>
                <p>Blue with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Jacksonville Jaguars', '/jerseys/Jacksonville-Jaguars.png', '/faces/Jacksonville Jaguars.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Jacksonville-Jaguars.png" alt="Jacksonville Jaguars Jersey" />
              </div>
                <h4>Jacksonville Jaguars</h4>
                <p>Teal with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Kansas City Chiefs', '/jerseys/Kansas-City-Chiefs.png', '/faces/Kansas City Chiefs.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Kansas-City-Chiefs.png" alt="Kansas City Chiefs Jersey" />
                </div>
                <h4>Kansas City Chiefs</h4>
                <p>Red with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Las Vegas Raiders', '/jerseys/Las-Vegas-Raiders.png', '/faces/Las Vegas Raiders.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Las-Vegas-Raiders.png" alt="Las Vegas Raiders Jersey" />
                </div>
                <h4>Las Vegas Raiders</h4>
                <p>Black with Silver Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Los Angeles Chargers', '/jerseys/Los-Angeles-Chargers.png', '/faces/Los Angeles Chargers.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Los-Angeles-Chargers.png" alt="Los Angeles Chargers Jersey" />
                </div>
                <h4>Los Angeles Chargers</h4>
                <p>Blue with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Los Angeles Rams', '/jerseys/Los-Angeles-Rams.png', '/faces/Los Angeles Rams.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Los-Angeles-Rams.png" alt="Los Angeles Rams Jersey" />
                </div>
                <h4>Los Angeles Rams</h4>
                <p>Blue with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Miami Dolphins', '/jerseys/Miami Dolphins.jpg', '/faces/Miami Dolphins.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Miami Dolphins.jpg" alt="Miami Dolphins Jersey" />
                </div>
                <h4>Miami Dolphins</h4>
                <p>Teal with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Minnesota Vikings', '/jerseys/Minnesota-Vikings.png', '/faces/Minnesota Vikings.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Minnesota-Vikings.png" alt="Minnesota Vikings Jersey" />
                </div>
                <h4>Minnesota Vikings</h4>
                <p>Purple with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New England Patriots', '/jerseys/New England Patriots.jpg', '/faces/New England Patriots.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/New England Patriots.jpg" alt="New England Patriots Jersey" />
                </div>
                <h4>New England Patriots</h4>
                <p>Blue with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New Orleans Saints', '/jerseys/New-Orleans-Saints.png', '/faces/New Orleans Saints.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/New-Orleans-Saints.png" alt="New Orleans Saints Jersey" />
                </div>
                <h4>New Orleans Saints</h4>
                <p>Black with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New York Giants', '/jerseys/New York Giants.jpg', '/faces/New York Giants.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/New York Giants.jpg" alt="New York Giants Jersey" />
                </div>
                <h4>New York Giants</h4>
                <p>Blue with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New York Jets', '/jerseys/New-York-Jets.png', '/faces/New York Jets.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/New-York-Jets.png" alt="New York Jets Jersey" />
                </div>
                <h4>New York Jets</h4>
                <p>Green with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Philadelphia Eagles', '/jerseys/Philadelphia-Eagles.png', '/faces/Philadelphia Eagles.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Philadelphia-Eagles.png" alt="Philadelphia Eagles Jersey" />
                </div>
                <h4>Philadelphia Eagles</h4>
                <p>Green with Silver Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Pittsburgh Steelers', '/jerseys/Pittsburgh Steelers.png', '/faces/Pittsburgh Steelers.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Pittsburgh Steelers.png" alt="Pittsburgh Steelers Jersey" />
                </div>
                <h4>Pittsburgh Steelers</h4>
                <p>Black with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('San Francisco 49ers', '/jerseys/San Francisco 49ers.png', '/faces/San Francisco 49ers.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/San Francisco 49ers.png" alt="San Francisco 49ers Jersey" />
                </div>
                <h4>San Francisco 49ers</h4>
                <p>Red with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Seattle Seahawks', '/jerseys/Seattle Seahawks.png', '/faces/Seattle Seahawks.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Seattle Seahawks.png" alt="Seattle Seahawks Jersey" />
                </div>
                <h4>Seattle Seahawks</h4>
                <p>Blue with Green Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Tampa Bay Buccaneers', '/jerseys/Tampa Bay Buccaneers.jpg', '/faces/Tampa Bay Buccaneers.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Tampa Bay Buccaneers.jpg" alt="Tampa Bay Buccaneers Jersey" />
                </div>
                <h4>Tampa Bay Buccaneers</h4>
                <p>Red with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Tennessee Titans', '/jerseys/Tennessee Titans.png', '/faces/Tennessee Titans.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Tennessee Titans.png" alt="Tennessee Titans Jersey" />
                </div>
                <h4>Tennessee Titans</h4>
                <p>Blue with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Washington Commanders', '/jerseys/Washington Commanders.png', '/faces/Washington Commanders.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Washington Commanders.png" alt="Washington Commanders Jersey" />
                </div>
                <h4>Washington Commanders</h4>
                <p>Burgundy with Gold Details</p>
              </div>
            </div>
          </div>
          
          {/* NBA Teams Section */}
          <div className="tournament-section">
            <h3 className="tournament-title">🏀 NBA Teams</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('Atlanta Hawks', '/jerseys/Atlanta Hawks.png', '/jerseys/Atlanta Hawks.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Atlanta Hawks.png" alt="Atlanta Hawks Jersey" />
                </div>
                <h4>Atlanta Hawks</h4>
              <p>Red with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Boston Celtics', '/jerseys/Boston Celtics.png', '/jerseys/Boston Celtics.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Boston Celtics.png" alt="Boston Celtics Jersey" />
              </div>
                <h4>Boston Celtics</h4>
                <p>Green with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Brooklyn Nets', '/jerseys/Brooklyn Nets.png', '/jerseys/Brooklyn Nets.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Brooklyn Nets.png" alt="Brooklyn Nets Jersey" />
              </div>
                <h4>Brooklyn Nets</h4>
                <p>Black with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Charlotte Hornets', '/jerseys/Charlotte Hornets.png', '/jerseys/Charlotte Hornets.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Charlotte Hornets.png" alt="Charlotte Hornets Jersey" />
              </div>
                <h4>Charlotte Hornets</h4>
                <p>Teal with Purple Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Chicago Bulls', '/jerseys/Chicago Bulls.jpg', '/jerseys/Chicago Bulls.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Chicago Bulls.jpg" alt="Chicago Bulls Jersey" />
                </div>
                <h4>Chicago Bulls</h4>
                <p>Red with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cleveland Cavaliers', '/jerseys/Cleveland Cavaliers.png', '/jerseys/Cleveland Cavaliers.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Cleveland Cavaliers.png" alt="Cleveland Cavaliers Jersey" />
                </div>
                <h4>Cleveland Cavaliers</h4>
                <p>Wine with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Dallas Mavericks', '/jerseys/Dallas Mavericks.png', '/jerseys/Dallas Mavericks.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Dallas Mavericks.png" alt="Dallas Mavericks Jersey" />
                </div>
                <h4>Dallas Mavericks</h4>
                <p>Blue with Silver Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Denver Nuggets', '/jerseys/Denver Nuggets.png', '/jerseys/Denver Nuggets.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Denver Nuggets.png" alt="Denver Nuggets Jersey" />
                </div>
                <h4>Denver Nuggets</h4>
                <p>Navy with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Detroit Pistons', '/jerseys/Detroit Pistons.jpg', '/jerseys/Detroit Pistons.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Detroit Pistons.jpg" alt="Detroit Pistons Jersey" />
                </div>
                <h4>Detroit Pistons</h4>
                <p>Red with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Golden State Warriors', '/jerseys/Golden State Warriors.png', '/jerseys/Golden State Warriors.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Golden State Warriors.png" alt="Golden State Warriors Jersey" />
                </div>
                <h4>Golden State Warriors</h4>
                <p>Blue with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Houston Rockets', '/jerseys/Houston Rockets.jpg', '/jerseys/Houston Rockets.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Houston Rockets.jpg" alt="Houston Rockets Jersey" />
                </div>
                <h4>Houston Rockets</h4>
              <p>Red with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Indiana Pacers', '/jerseys/Indiana Pacers.png', '/jerseys/Indiana Pacers.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Indiana Pacers.png" alt="Indiana Pacers Jersey" />
              </div>
                <h4>Indiana Pacers</h4>
                <p>Blue with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Los Angeles Clippers', '/jerseys/Los Angeles Clippers.jpg', '/jerseys/Los Angeles Clippers.jpg')}>
              <div className="jersey-image">
                  <img src="/jerseys/Los Angeles Clippers.jpg" alt="Los Angeles Clippers Jersey" />
              </div>
                <h4>Los Angeles Clippers</h4>
                <p>Blue with Red Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Los Angeles Lakers', '/jerseys/Los Angeles Lakers.png', '/jerseys/Los Angeles Lakers.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Los Angeles Lakers.png" alt="Los Angeles Lakers Jersey" />
              </div>
                <h4>Los Angeles Lakers</h4>
                <p>Purple with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Memphis Grizzlies', '/jerseys/Memphis Grizzlies.png', '/jerseys/Memphis Grizzlies.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Memphis Grizzlies.png" alt="Memphis Grizzlies Jersey" />
              </div>
                <h4>Memphis Grizzlies</h4>
                <p>Navy with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Miami Heat', '/jerseys/Miami Heat.png', '/jerseys/Miami Heat.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Miami Heat.png" alt="Miami Heat Jersey" />
              </div>
                <h4>Miami Heat</h4>
                <p>Red with Black Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Milwaukee Bucks', '/jerseys/Milwaukee Bucks.png', '/jerseys/Milwaukee Bucks.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Milwaukee Bucks.png" alt="Milwaukee Bucks Jersey" />
              </div>
                <h4>Milwaukee Bucks</h4>
                <p>Green with Cream Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Minnesota Timberwolves', '/jerseys/Minnesota Timberwolves.png', '/jerseys/Minnesota Timberwolves.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Minnesota Timberwolves.png" alt="Minnesota Timberwolves Jersey" />
                </div>
                <h4>Minnesota Timberwolves</h4>
                <p>Blue with Green Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New Orleans Pelicans', '/jerseys/New Orleans Pelicans.png', '/jerseys/New Orleans Pelicans.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/New Orleans Pelicans.png" alt="New Orleans Pelicans Jersey" />
                </div>
                <h4>New Orleans Pelicans</h4>
                <p>Navy with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New York Knicks', '/jerseys/New York Knicks.png', '/jerseys/New York Knicks.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/New York Knicks.png" alt="New York Knicks Jersey" />
                </div>
                <h4>New York Knicks</h4>
                <p>Blue with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Oklahoma City Thunder', '/jerseys/Oklahoma City Thunder.png', '/jerseys/Oklahoma City Thunder.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Oklahoma City Thunder.png" alt="Oklahoma City Thunder Jersey" />
                </div>
                <h4>Oklahoma City Thunder</h4>
                <p>Blue with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Orlando Magic', '/jerseys/Orlando Magic.png', '/jerseys/Orlando Magic.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Orlando Magic.png" alt="Orlando Magic Jersey" />
                </div>
                <h4>Orlando Magic</h4>
                <p>Blue with Silver Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Philadelphia 76ers', '/jerseys/Philadelphia 76ers.png', '/jerseys/Philadelphia 76ers.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Philadelphia 76ers.png" alt="Philadelphia 76ers Jersey" />
                </div>
                <h4>Philadelphia 76ers</h4>
                <p>Blue with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Phoenix Suns', '/jerseys/Phoenix Suns.png', '/jerseys/Phoenix Suns.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Phoenix Suns.png" alt="Phoenix Suns Jersey" />
                </div>
                <h4>Phoenix Suns</h4>
                <p>Purple with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Portland Trail Blazers', '/jerseys/Portland Trail Blazers.jpg', '/jerseys/Portland Trail Blazers.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Portland Trail Blazers.jpg" alt="Portland Trail Blazers Jersey" />
                </div>
                <h4>Portland Trail Blazers</h4>
                <p>Red with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Sacramento Kings', '/jerseys/Sacramento Kings.png', '/jerseys/Sacramento Kings.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Sacramento Kings.png" alt="Sacramento Kings Jersey" />
                </div>
                <h4>Sacramento Kings</h4>
                <p>Purple with Silver Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('San Antonio Spurs', '/jerseys/San Antonio Spurs.png', '/jerseys/San Antonio Spurs.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/San Antonio Spurs.png" alt="San Antonio Spurs Jersey" />
                </div>
                <h4>San Antonio Spurs</h4>
                <p>Black with Silver Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Toronto Raptors', '/jerseys/Toronto Raptors.jpg', '/jerseys/Toronto Raptors.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Toronto Raptors.jpg" alt="Toronto Raptors Jersey" />
                </div>
                <h4>Toronto Raptors</h4>
                <p>Red with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Utah Jazz', '/jerseys/Utah Jazz.png', '/jerseys/Utah Jazz.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Utah Jazz.png" alt="Utah Jazz Jersey" />
                </div>
                <h4>Utah Jazz</h4>
                <p>Navy with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Washington Wizards', '/jerseys/Washington Wizards.png', '/jerseys/Washington Wizards.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Washington Wizards.png" alt="Washington Wizards Jersey" />
                </div>
                <h4>Washington Wizards</h4>
                <p>Blue with Red Details</p>
              </div>
            </div>
          </div>
          
          {/* MLB Teams Section */}
          <div className="tournament-section">
            <h3 className="tournament-title">⚾ MLB Teams</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('Arizona Diamondbacks', '/jerseys/Arizona Diamondbacks.png', '/jerseys/Arizona Diamondbacks.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Arizona Diamondbacks.png" alt="Arizona Diamondbacks Jersey" />
                </div>
                <h4>Arizona Diamondbacks</h4>
                <p>Black with Teal Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Atlanta Braves', '/jerseys/Atlanta Braves.jpg', '/jerseys/Atlanta Braves.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Atlanta Braves.jpg" alt="Atlanta Braves Jersey" />
                </div>
                <h4>Atlanta Braves</h4>
                <p>White with Red & Navy</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Baltimore Orioles', '/jerseys/Baltimore Orioles.png', '/jerseys/Baltimore Orioles.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Baltimore Orioles.png" alt="Baltimore Orioles Jersey" />
                </div>
                <h4>Baltimore Orioles</h4>
                <p>Black with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Boston Red Sox', '/jerseys/Boston Red Sox.png', '/jerseys/Boston Red Sox.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Boston Red Sox.png" alt="Boston Red Sox Jersey" />
                </div>
                <h4>Boston Red Sox</h4>
                <p>Green with White & Gold</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Chicago Cubs', '/jerseys/Chicago Cubs.png', '/jerseys/Chicago Cubs.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Chicago Cubs.png" alt="Chicago Cubs Jersey" />
                </div>
                <h4>Chicago Cubs</h4>
                <p>Navy with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Chicago White Sox', '/jerseys/Chicago White Sox.png', '/jerseys/Chicago White Sox.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Chicago White Sox.png" alt="Chicago White Sox Jersey" />
                </div>
                <h4>Chicago White Sox</h4>
                <p>Black with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cincinnati Reds', '/jerseys/Cincinnati Reds.png', '/jerseys/Cincinnati Reds.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Cincinnati Reds.png" alt="Cincinnati Reds Jersey" />
                </div>
                <h4>Cincinnati Reds</h4>
                <p>White with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cleveland Guardians', '/jerseys/Cleveland Guardians.jpg', '/jerseys/Cleveland Guardians.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Cleveland Guardians.jpg" alt="Cleveland Guardians Jersey" />
                </div>
                <h4>Cleveland Guardians</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Colorado Rockies', '/jerseys/Colorado Rockies.jpg', '/jerseys/Colorado Rockies.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Colorado Rockies.jpg" alt="Colorado Rockies Jersey" />
                </div>
                <h4>Colorado Rockies</h4>
                <p>Blue & Purple Design</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Detroit Tigers', '/jerseys/Detroit Tigers.png', '/jerseys/Detroit Tigers.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Detroit Tigers.png" alt="Detroit Tigers Jersey" />
                </div>
                <h4>Detroit Tigers</h4>
              <p>White with Black Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Houston Astros', '/jerseys/Houston Astros.jpg', '/jerseys/Houston Astros.jpg')}>
              <div className="jersey-image">
                  <img src="/jerseys/Houston Astros.jpg" alt="Houston Astros Jersey" />
              </div>
                <h4>Houston Astros</h4>
                <p>Navy with Orange Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Kansas City Royals', '/jerseys/Kansas City Royals.png', '/jerseys/Kansas City Royals.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Kansas City Royals.png" alt="Kansas City Royals Jersey" />
              </div>
                <h4>Kansas City Royals</h4>
                <p>Blue with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Los Angeles Angels', '/jerseys/Los Angeles Angels.png', '/jerseys/Los Angeles Angels.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Los Angeles Angels.png" alt="Los Angeles Angels Jersey" />
              </div>
                <h4>Los Angeles Angels</h4>
                <p>White with Red Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Los Angeles Dodgers', '/jerseys/Los Angeles Dodgers.png', '/jerseys/Los Angeles Dodgers.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Los Angeles Dodgers.png" alt="Los Angeles Dodgers Jersey" />
              </div>
                <h4>Los Angeles Dodgers</h4>
                <p>White with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Miami Marlins', '/jerseys/Miami Marlins.png', '/jerseys/Miami Marlins.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Miami Marlins.png" alt="Miami Marlins Jersey" />
                </div>
                <h4>Miami Marlins</h4>
                <p>White with Black & Blue</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Milwaukee Brewers', '/jerseys/Milwaukee Brewers.png', '/jerseys/Milwaukee Brewers.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Milwaukee Brewers.png" alt="Milwaukee Brewers Jersey" />
                </div>
                <h4>Milwaukee Brewers</h4>
                <p>Blue with Yellow Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Minnesota Twins', '/jerseys/Minnesota Twins.png', '/jerseys/Minnesota Twins.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Minnesota Twins.png" alt="Minnesota Twins Jersey" />
                </div>
                <h4>Minnesota Twins</h4>
                <p>Grey with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New York Mets', '/jerseys/New York Mets.png', '/jerseys/New York Mets.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/New York Mets.png" alt="New York Mets Jersey" />
                </div>
                <h4>New York Mets</h4>
                <p>Grey with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New York Yankees', '/jerseys/New York Yankees.png', '/jerseys/New York Yankees.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/New York Yankees.png" alt="New York Yankees Jersey" />
                </div>
                <h4>New York Yankees</h4>
                <p>White with Navy Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Oakland Athletics', '/jerseys/Oakland Athletics.png', '/jerseys/Oakland Athletics.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Oakland Athletics.png" alt="Oakland Athletics Jersey" />
                </div>
                <h4>Oakland Athletics</h4>
                <p>Green with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Philadelphia Phillies', '/jerseys/Philadelphia Phillies.png', '/jerseys/Philadelphia Phillies.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Philadelphia Phillies.png" alt="Philadelphia Phillies Jersey" />
                </div>
                <h4>Philadelphia Phillies</h4>
              <p>Red with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Pittsburgh Pirates', '/jerseys/Pittsburgh Pirates.png', '/jerseys/Pittsburgh Pirates.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Pittsburgh Pirates.png" alt="Pittsburgh Pirates Jersey" />
              </div>
                <h4>Pittsburgh Pirates</h4>
                <p>Black with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('San Diego Padres', '/jerseys/San Diego Padres.png', '/jerseys/San Diego Padres.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/San Diego Padres.png" alt="San Diego Padres Jersey" />
              </div>
                <h4>San Diego Padres</h4>
                <p>Brown with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('San Francisco Giants', '/jerseys/San Francisco Giants.png', '/jerseys/San Francisco Giants.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/San Francisco Giants.png" alt="San Francisco Giants Jersey" />
              </div>
                <h4>San Francisco Giants</h4>
                <p>Cream with Orange Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Seattle Mariners', '/jerseys/Seattle Mariners.png', '/jerseys/Seattle Mariners.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Seattle Mariners.png" alt="Seattle Mariners Jersey" />
              </div>
                <h4>Seattle Mariners</h4>
                <p>Blue with Yellow Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('St. Louis Cardinals', '/jerseys/St. Louis Cardinals.jpg', '/jerseys/St. Louis Cardinals.jpg')}>
              <div className="jersey-image">
                  <img src="/jerseys/St. Louis Cardinals.jpg" alt="St. Louis Cardinals Jersey" />
              </div>
                <h4>St. Louis Cardinals</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Tampa Bay Rays', '/jerseys/Tampa Bay Rays.png', '/jerseys/Tampa Bay Rays.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Tampa Bay Rays.png" alt="Tampa Bay Rays Jersey" />
                </div>
                <h4>Tampa Bay Rays</h4>
                <p>Grey with Neon Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Texas Rangers', '/jerseys/Texas Rangers.png', '/jerseys/Texas Rangers.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Texas Rangers.png" alt="Texas Rangers Jersey" />
                </div>
                <h4>Texas Rangers</h4>
                <p>White with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Toronto Blue Jays', '/jerseys/Toronto Blue Jays.png', '/jerseys/Toronto Blue Jays.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Toronto Blue Jays.png" alt="Toronto Blue Jays Jersey" />
                </div>
                <h4>Toronto Blue Jays</h4>
                <p>Blue with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Washington Nationals', '/jerseys/Washington Nationals.png', '/jerseys/Washington Nationals.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Washington Nationals.png" alt="Washington Nationals Jersey" />
                </div>
                <h4>Washington Nationals</h4>
                <p>White with Red Details</p>
              </div>
            </div>
          </div>
          
          {/* Germany Clubs Section */}
          <div className="tournament-section">
            <h3 className="tournament-title">🇩🇪 Germany Clubs</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('Bayer Leverkusen', '/jerseys/Bayer Leverkusen.jpg', '/faces/Bayer Leverkusen.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Bayer Leverkusen.jpg" alt="Bayer Leverkusen Jersey" />
                </div>
                <h4>Bayer Leverkusen</h4>
                <p>Red with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Bayern Munich', '/jerseys/Bayern Munich.jpg', '/faces/Bayern Munich.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Bayern Munich.jpg" alt="Bayern Munich Jersey" />
                </div>
                <h4>Bayern Munich</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Borussia Dortmund', '/jerseys/Borussia Dortmund.jpg', '/faces/Borussia Dortmund.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Borussia Dortmund.jpg" alt="Borussia Dortmund Jersey" />
                </div>
                <h4>Borussia Dortmund</h4>
                <p>Yellow with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Borussia Mönchengladbach', '/jerseys/Borussia Mönchengladbach.jpg', '/faces/Borussia Mönchengladbach.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Borussia Mönchengladbach.jpg" alt="Borussia Mönchengladbach Jersey" />
                </div>
                <h4>Borussia Mönchengladbach</h4>
                <p>White with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Eintracht Frankfurt', '/jerseys/Eintracht Frankfurt.jpg', '/faces/Eintracht Frankfurt.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Eintracht Frankfurt.jpg" alt="Eintracht Frankfurt Jersey" />
                </div>
                <h4>Eintracht Frankfurt</h4>
                <p>Black & Red Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Augsburg', '/jerseys/FC Augsburg.jpg', '/faces/FC Augsburg.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/FC Augsburg.jpg" alt="FC Augsburg Jersey" />
                </div>
                <h4>FC Augsburg</h4>
                <p>White with Red & Green</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Köln', '/jerseys/FC Köln.jpg', '/jerseys/FC Köln.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/FC Köln.jpg" alt="FC Köln Jersey" />
                </div>
                <h4>FC Köln</h4>
                <p>White & Red Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Fortuna Düsseldorf', '/jerseys/Fortuna Düsseldorf.jpg', '/jerseys/Fortuna Düsseldorf.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Fortuna Düsseldorf.jpg" alt="Fortuna Düsseldorf Jersey" />
                </div>
                <h4>Fortuna Düsseldorf</h4>
                <p>Red with White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FSV Mainz 05', '/jerseys/FSV Mainz 05.jpg', '/faces/FSV Mainz 05.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/FSV Mainz 05.jpg" alt="FSV Mainz 05 Jersey" />
                </div>
                <h4>FSV Mainz 05</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Hamburger SV', '/jerseys/Hamburger SV.jpg', '/jerseys/Hamburger SV.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Hamburger SV.jpg" alt="Hamburger SV Jersey" />
                </div>
                <h4>Hamburger SV</h4>
                <p>White with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Hannover 96', '/jerseys/Hannover 96.jpg', '/jerseys/Hannover 96.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Hannover 96.jpg" alt="Hannover 96 Jersey" />
                </div>
                <h4>Hannover 96</h4>
                <p>Red & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Hertha BSC', '/jerseys/Hertha BSC.jpg', '/faces/Hertha BSC.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Hertha BSC.jpg" alt="Hertha BSC Jersey" />
                </div>
                <h4>Hertha BSC</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('RB Leipzig', '/jerseys/RB Leipzig.jpg', '/faces/RB Leipzig.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/RB Leipzig.jpg" alt="RB Leipzig Jersey" />
              </div>
                <h4>RB Leipzig</h4>
                <p>White with Red Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('SC Freiburg', '/jerseys/SC Freiburg.jpg', '/faces/SC Freiburg.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/SC Freiburg.jpg" alt="SC Freiburg Jersey" />
              </div>
                <h4>SC Freiburg</h4>
                <p>White & Red Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Union Berlin', '/jerseys/Union Berlin.jpg', '/faces/Union Berlin.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Union Berlin.jpg" alt="Union Berlin Jersey" />
              </div>
                <h4>Union Berlin</h4>
              <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('VfB Stuttgart', '/jerseys/VfB Stuttgart.jpg', '/faces/VfB Stuttgart.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/VfB Stuttgart.jpg" alt="VfB Stuttgart Jersey" />
              </div>
                <h4>VfB Stuttgart</h4>
                <p>White with Red Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('VfL Bochum', '/jerseys/VfL Bochum.jpg', '/faces/VfL Bochum.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/VfL Bochum.jpg" alt="VfL Bochum Jersey" />
              </div>
                <h4>VfL Bochum</h4>
                <p>Blue with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('VfL Wolfsburg', '/jerseys/VfL Wolfsburg.jpg', '/faces/VfL Wolfsburg.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/VfL Wolfsburg.jpg" alt="VfL Wolfsburg Jersey" />
              </div>
                <h4>VfL Wolfsburg</h4>
                <p>Green with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Werder Bremen', '/jerseys/Werder Bremen.jpg', '/faces/Werder Bremen.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/Werder Bremen.jpg" alt="Werder Bremen Jersey" />
              </div>
                <h4>Werder Bremen</h4>
                <p>Green with White Stripes</p>
              </div>
            </div>
            </div>
            
          {/* France Clubs Section */}
          <div className="tournament-section">
            <h3 className="tournament-title">🇫🇷 France Clubs</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('AJ Auxerre', '/jerseys/AJ Auxerre.jpg', '/faces/AJ Auxerre.png')}>
              <div className="jersey-image">
                  <img src="/jerseys/AJ Auxerre.jpg" alt="AJ Auxerre Jersey" />
              </div>
                <h4>AJ Auxerre</h4>
                <p>White with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Angers SCO', '/jerseys/Angers SCO.jpg', '/faces/Angers SCO.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Angers SCO.jpg" alt="Angers SCO Jersey" />
                </div>
                <h4>Angers SCO</h4>
                <p>Black & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('AS Monaco', '/jerseys/AS Monaco.jpg', '/faces/AS Monaco.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/AS Monaco.jpg" alt="AS Monaco Jersey" />
                </div>
                <h4>AS Monaco</h4>
                <p>Red & White Diagonal</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('ESTAC Troyes', '/jerseys/ESTAC Troyes.jpg', '/faces/ESTAC Troyes.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/ESTAC Troyes.jpg" alt="ESTAC Troyes Jersey" />
                </div>
                <h4>ESTAC Troyes</h4>
                <p>Blue with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Metz', '/jerseys/FC Metz.jpg', '/faces/FC Metz.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/FC Metz.jpg" alt="FC Metz Jersey" />
                </div>
                <h4>FC Metz</h4>
                <p>Maroon with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Nantes', '/jerseys/FC Nantes.jpg', '/faces/FC Nantes.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/FC Nantes.jpg" alt="FC Nantes Jersey" />
                </div>
                <h4>FC Nantes</h4>
                <p>Yellow with Green Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Montpellier HSC', '/jerseys/Montpellier HSC.jpg', '/faces/Montpellier HSC.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Montpellier HSC.jpg" alt="Montpellier HSC Jersey" />
                </div>
                <h4>Montpellier HSC</h4>
                <p>Navy Blue with Orange</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('OGC Nice', '/jerseys/OGC Nice.jpg', '/faces/OGC Nice.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/OGC Nice.jpg" alt="OGC Nice Jersey" />
                </div>
                <h4>OGC Nice</h4>
                <p>Red & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Olympique Lyonnais', '/jerseys/Olympique Lyonnais (Lyon).jpg', '/faces/Olympique Lyonnais.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Olympique Lyonnais (Lyon).jpg" alt="Olympique Lyonnais Jersey" />
                </div>
                <h4>Olympique Lyonnais</h4>
                <p>White with Red & Blue</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Paris Saint-Germain', '/jerseys/Paris Saint-Germain (PSG).jpg', '/faces/Paris Saint-Germain (PSG).png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Paris Saint-Germain (PSG).jpg" alt="Paris Saint-Germain Jersey" />
                </div>
                <h4>Paris Saint-Germain</h4>
                <p>Navy Blue with Red</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('RC Lens', '/jerseys/RC Lens.jpg', '/faces/RC Lens.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/RC Lens.jpg" alt="RC Lens Jersey" />
                </div>
                <h4>RC Lens</h4>
                <p>Yellow with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('RC Strasbourg Alsace', '/jerseys/RC Strasbourg Alsace.jpg', '/faces/RC Strasbourg Alsace.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/RC Strasbourg Alsace.jpg" alt="RC Strasbourg Alsace Jersey" />
                </div>
                <h4>RC Strasbourg Alsace</h4>
                <p>Blue with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Stade Brestois', '/jerseys/Stade Brestois (Brest).jpg', '/faces/Stade Brestois.jpeg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Stade Brestois (Brest).jpg" alt="Stade Brestois Jersey" />
                </div>
                <h4>Stade Brestois</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Stade de Reims', '/jerseys/Stade de Reims.jpg', '/faces/Stade de Reims.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Stade de Reims.jpg" alt="Stade de Reims Jersey" />
                </div>
                <h4>Stade de Reims</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Stade Rennais', '/jerseys/Stade Rennais (Rennes).jpg', '/faces/Stade Rennais.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Stade Rennais (Rennes).jpg" alt="Stade Rennais Jersey" />
                </div>
                <h4>Stade Rennais</h4>
                <p>Red with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Toulouse FC', '/jerseys/Toulouse FC.jpg', '/faces/Toulouse FC.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Toulouse FC.jpg" alt="Toulouse FC Jersey" />
                </div>
                <h4>Toulouse FC</h4>
                <p>White & Purple Split</p>
              </div>
            </div>
          </div>
          
          {/* Italy Clubs Section */}
          <div className="tournament-section">
            <h3 className="tournament-title">🇮🇹 Italy Clubs</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('AC Milan', '/jerseys/AC Milan.jpg', '/faces/AC Milan.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/AC Milan.jpg" alt="AC Milan Jersey" />
                </div>
                <h4>AC Milan</h4>
                <p>Red & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('AS Roma', '/jerseys/AS Roma.jpg', '/faces/AS Roma.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/AS Roma.jpg" alt="AS Roma Jersey" />
                </div>
                <h4>AS Roma</h4>
                <p>Maroon with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Atalanta', '/jerseys/Atalanta.jpg', '/faces/Atalanta.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Atalanta.jpg" alt="Atalanta Jersey" />
                </div>
                <h4>Atalanta</h4>
                <p>Blue & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Bologna', '/jerseys/Bologna.jpg', '/faces/Bologna.jpeg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Bologna.jpg" alt="Bologna Jersey" />
                </div>
                <h4>Bologna</h4>
                <p>Red & Blue Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cremonese', '/jerseys/Cremonese.jpg', '/jerseys/Cremonese.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Cremonese.jpg" alt="Cremonese Jersey" />
                </div>
                <h4>Cremonese</h4>
                <p>Grey & Red Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Empoli', '/jerseys/Empoli.jpg', '/faces/Empoli.jpeg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Empoli.jpg" alt="Empoli Jersey" />
                </div>
                <h4>Empoli</h4>
                <p>Blue with Wavy Pattern</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Fiorentina', '/jerseys/Fiorentina.jpg', '/faces/Fiorentina.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Fiorentina.jpg" alt="Fiorentina Jersey" />
                </div>
                <h4>Fiorentina</h4>
                <p>Purple with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Hellas Verona', '/jerseys/Hellas Verona.jpg', '/faces/Hellas Verona.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Hellas Verona.jpg" alt="Hellas Verona Jersey" />
                </div>
                <h4>Hellas Verona</h4>
                <p>Blue with Yellow Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Inter Milan', '/jerseys/Inter Milan (Internazionale).jpg', '/faces/Inter Milan.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Inter Milan (Internazionale).jpg" alt="Inter Milan Jersey" />
                </div>
                <h4>Inter Milan</h4>
                <p>Black & Blue Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Juventus', '/jerseys/Juventus.jpg', '/faces/Juventus.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Juventus.jpg" alt="Juventus Jersey" />
                </div>
                <h4>Juventus</h4>
                <p>Black & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Lazio', '/jerseys/Lazio.jpg', '/faces/Lazio.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Lazio.jpg" alt="Lazio Jersey" />
                </div>
                <h4>Lazio</h4>
                <p>Light Blue with White</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Lecce', '/jerseys/Lecce.jpg', '/faces/Lecce.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Lecce.jpg" alt="Lecce Jersey" />
                </div>
                <h4>Lecce</h4>
                <p>Yellow with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Monza', '/jerseys/Monza.jpg', '/faces/Monza.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Monza.jpg" alt="Monza Jersey" />
                </div>
                <h4>Monza</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('SSC Napoli', '/jerseys/SSC Napoli.jpg', '/faces/SSC Napoli.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/SSC Napoli.jpg" alt="SSC Napoli Jersey" />
                </div>
                <h4>SSC Napoli</h4>
                <p>Light Blue with White</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Salernitana', '/jerseys/Salernitana.jpg', '/faces/Salernitana.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Salernitana.jpg" alt="Salernitana Jersey" />
                </div>
                <h4>Salernitana</h4>
                <p>Maroon with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Sampdoria', '/jerseys/Sampdoria.jpg', '/faces/Sampdoria.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Sampdoria.jpg" alt="Sampdoria Jersey" />
                </div>
                <h4>Sampdoria</h4>
                <p>Blue with White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Sassuolo', '/jerseys/Sassuolo.jpg', '/faces/Sassuolo.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Sassuolo.jpg" alt="Sassuolo Jersey" />
                </div>
                <h4>Sassuolo</h4>
                <p>Green & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Spezia', '/jerseys/Spezia.jpg', '/faces/Spezia.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Spezia.jpg" alt="Spezia Jersey" />
                </div>
                <h4>Spezia</h4>
                <p>White with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Torino', '/jerseys/Torino.jpg', '/faces/Torino.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Torino.jpg" alt="Torino Jersey" />
                </div>
                <h4>Torino</h4>
                <p>Maroon with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Udinese', '/jerseys/Udinese.jpg', '/faces/Udinese.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Udinese.jpg" alt="Udinese Jersey" />
                </div>
                <h4>Udinese</h4>
                <p>Black & White Stripes</p>
              </div>
            </div>
          </div>
          
          {/* Holland Clubs Section */}
          <div className="tournament-section">
            <h3 className="tournament-title">🇳🇱 Holland Clubs</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('ADO Den Haag', '/jerseys/ADO Den Haag.jpg', '/faces/ADO Den Haag.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/ADO Den Haag.jpg" alt="ADO Den Haag Jersey" />
                </div>
                <h4>ADO Den Haag</h4>
                <p>Yellow & Green Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('AZ Alkmaar', '/jerseys/AZ Alkmaar.jpg', '/faces/AZ Alkmaar.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/AZ Alkmaar.jpg" alt="AZ Alkmaar Jersey" />
                </div>
                <h4>AZ Alkmaar</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cambuur', '/jerseys/Cambuur.jpg', '/faces/Cambuur.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Cambuur.jpg" alt="Cambuur Jersey" />
                </div>
                <h4>Cambuur</h4>
                <p>Yellow with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Excelsior', '/jerseys/Excelsior.jpg', '/faces/Excelsior.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Excelsior.jpg" alt="Excelsior Jersey" />
                </div>
                <h4>Excelsior</h4>
                <p>Black with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Groningen', '/jerseys/FC Groningen.jpg', '/faces/FC Groningen.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/FC Groningen.jpg" alt="FC Groningen Jersey" />
                </div>
                <h4>FC Groningen</h4>
                <p>White & Green Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Twente', '/jerseys/FC Twente.jpg', '/faces/FC Twente.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/FC Twente.jpg" alt="FC Twente Jersey" />
                </div>
                <h4>FC Twente</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Utrecht', '/jerseys/FC Utrecht.jpg', '/faces/FC Utrecht.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/FC Utrecht.jpg" alt="FC Utrecht Jersey" />
                </div>
                <h4>FC Utrecht</h4>
                <p>White & Red Split</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Feyenoord', '/jerseys/Feyenoord.jpg', '/faces/Feyenoord.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Feyenoord.jpg" alt="Feyenoord Jersey" />
                </div>
                <h4>Feyenoord</h4>
                <p>Red & White Split</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Fortuna Sittard', '/jerseys/Fortuna Sittard.jpg', '/faces/Fortuna Sittard.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Fortuna Sittard.jpg" alt="Fortuna Sittard Jersey" />
                </div>
                <h4>Fortuna Sittard</h4>
                <p>Yellow with Green Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Heracles Almelo', '/jerseys/Heracles Almelo.jpg', '/faces/Heracles Almelo.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Heracles Almelo.jpg" alt="Heracles Almelo Jersey" />
                </div>
                <h4>Heracles Almelo</h4>
                <p>Black & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('NEC Nijmegen', '/jerseys/NEC Nijmegen.jpg', '/faces/NEC Nijmegen.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/NEC Nijmegen.jpg" alt="NEC Nijmegen Jersey" />
                </div>
                <h4>NEC Nijmegen</h4>
                <p>Grey & Red Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('PEC Zwolle', '/jerseys/PEC Zwolle.jpg', '/faces/PEC Zwolle.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/PEC Zwolle.jpg" alt="PEC Zwolle Jersey" />
                </div>
                <h4>PEC Zwolle</h4>
                <p>Blue & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('RKC Waalwijk', '/jerseys/RKC Waalwijk.jpg', '/faces/RKC Waalwijk.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/RKC Waalwijk.jpg" alt="RKC Waalwijk Jersey" />
                </div>
                <h4>RKC Waalwijk</h4>
                <p>Blue with Yellow Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('SC Heerenveen', '/jerseys/SC Heerenveen.jpg', '/faces/SC Heerenveen.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/SC Heerenveen.jpg" alt="SC Heerenveen Jersey" />
                </div>
                <h4>SC Heerenveen</h4>
                <p>White & Blue Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Sparta Rotterdam', '/jerseys/Sparta Rotterdam.jpg', '/jerseys/Sparta Rotterdam.jpg')}>
                <div className="jersey-image">
                  <img src="/jerseys/Sparta Rotterdam.jpg" alt="Sparta Rotterdam Jersey" />
                </div>
                <h4>Sparta Rotterdam</h4>
                <p>Red & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Vitesse', '/jerseys/Vitesse.jpg', '/faces/Vitesse.png')}>
                <div className="jersey-image">
                  <img src="/jerseys/Vitesse.jpg" alt="Vitesse Jersey" />
                </div>
                <h4>Vitesse</h4>
                <p>Black & Yellow Stripes</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>⚽ Football Face Swap</h4>
            <p>Transform yourself into a football legend with AI-powered face swapping technology.</p>
          </div>
          <div className="footer-section">
            <h4>Features</h4>
            <ul>
              <li>Professional Quality</li>
              <li>Lightning Fast</li>
              <li>Secure Processing</li>
              <li>All Team Jerseys</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li>Help Center</li>
              <li>Contact Us</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 Football Face Swap • Powered by AI • Made with ⚽ for football fans</p>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>API Settings</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="close-button"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="provider">API Provider</label>
                <select
                  id="provider"
                  value={selectedProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="provider-select"
                >
                  {faceSwapService.getProviders().map(provider => (
                    <option key={provider.key} value={provider.key}>
                      {provider.name} - {provider.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="status-section">
                <div className="status-item">
                  <button onClick={checkBackendHealth} className="check-status-button">
                    Check Backend Status
                  </button>
                  {backendStatus !== null && (
                    <div className={`status-indicator ${backendStatus ? 'success' : 'error'}`}>
                      {backendStatus ? '✓ Backend Connected' : '✗ Backend Error'}
                    </div>
                  )}
                </div>

                <div className="status-item">
                  <button onClick={checkApiStatus} className="check-status-button">
                    Check API Status
                  </button>
                  {apiStatus !== null && (
                    <div className={`status-indicator ${apiStatus ? 'success' : 'error'}`}>
                      {apiStatus ? '✓ API Connected' : '✗ API Error'}
                    </div>
                  )}
                </div>
              </div>

              <div className="api-info">
                <h4>🔒 Secure Configuration:</h4>
                <p>Your API keys are securely stored on the backend server and never exposed to the frontend. This ensures maximum security for your application.</p>
                
                <h4>How it works:</h4>
                <ol>
                  <li>Choose an API provider from the dropdown above</li>
                  <li>Your backend server handles all API communications</li>
                  <li>API keys are stored securely in environment variables</li>
                  <li>Start swapping faces with confidence!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;