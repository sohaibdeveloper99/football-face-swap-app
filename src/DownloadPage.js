import React, { useState, useEffect } from 'react';
import './DownloadPage.css';

const DownloadPage = () => {
  const [swappedImage, setSwappedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get the swapped image from localStorage or URL params
    const savedImage = localStorage.getItem('swappedImage');
    if (savedImage) {
      setSwappedImage(savedImage);
      setIsLoading(false);
    } else {
      // If no image found, redirect back to product page
      window.location.href = '/product';
    }
  }, []);

  const downloadImage = () => {
    if (swappedImage) {
      const link = document.createElement('a');
      link.href = swappedImage;
      link.download = 'chelsea-face-swap.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const shareImage = () => {
    if (navigator.share && swappedImage) {
      // Convert base64 to blob for sharing
      fetch(swappedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'chelsea-face-swap.png', { type: 'image/png' });
          navigator.share({
            title: 'My Chelsea Jersey Face Swap!',
            text: 'Check out my face on the Chelsea jersey! ⚽',
            files: [file]
          });
        })
        .catch(console.error);
    } else {
      // Fallback: copy image to clipboard or show share options
      alert('Share functionality not available on this device. Use the download button instead!');
    }
  };

  const createNewSwap = () => {
    // Clear the saved image and go back to product page
    localStorage.removeItem('swappedImage');
    window.location.href = '/product';
  };

  const goHome = () => {
    // Clear the saved image and go to home
    localStorage.removeItem('swappedImage');
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="download-page">
        <div className="loading-container">
          <div className="loading-spinner">⚽</div>
          <p>Loading your Chelsea jersey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="download-page">
      <div className="download-container">
        {/* Header */}
        <div className="download-header">
          <h1>🏆 Your Chelsea Jersey is Ready!</h1>
          <p>Your face has been successfully swapped onto the official Chelsea FC jersey!</p>
        </div>

        {/* Result Image */}
        <div className="result-section">
          <div className="result-image-container">
            <img 
              src={swappedImage} 
              alt="Your Face on Chelsea Jersey" 
              className="result-image"
            />
            <div className="image-overlay">
              <div className="overlay-content">
                <h3>⚽ Chelsea FC</h3>
                <p>Official Jersey with Your Face</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={downloadImage} className="download-button primary">
            <span>💾</span>
            Download Your Jersey
          </button>
          
          <button onClick={shareImage} className="share-button">
            <span>📤</span>
            Share Your Jersey
          </button>
        </div>

        {/* Additional Options */}
        <div className="additional-options">
          <button onClick={createNewSwap} className="create-new-button">
            <span>🔄</span>
            Create Another Swap
          </button>
          
          <button onClick={goHome} className="home-button">
            <span>🏠</span>
            Back to Home
          </button>
        </div>

        {/* Features Highlight */}
        <div className="features-highlight">
          <h3>🎉 What's Next?</h3>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <span>Set as Profile Picture</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📧</span>
              <span>Share with Friends</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🖨️</span>
              <span>Print Your Jersey</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚽</span>
              <span>Try Other Teams</span>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="social-proof">
          <p>🔥 <strong>Join thousands of football fans</strong> who have created their dream jerseys!</p>
          <div className="stats">
            <div className="stat">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Jerseys Created</span>
            </div>
            <div className="stat">
              <span className="stat-number">4.9★</span>
              <span className="stat-label">User Rating</span>
            </div>
            <div className="stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Team Jerseys</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
