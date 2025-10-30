import React, { useState, useEffect } from 'react';
import './DownloadPage.css';

const DownloadPage = () => {
  const [swappedImage, setSwappedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    // Get the swapped image from localStorage or URL params
    const savedImage = localStorage.getItem('swappedImage');
    // Get selected team data from localStorage
    const teamData = localStorage.getItem('selectedTeam');
    
    if (savedImage) {
      setSwappedImage(savedImage);
      setIsLoading(false);
    } else {
      // If no image found, redirect back to product page
      window.location.href = '/product';
    }
    
    if (teamData) {
      setSelectedTeam(JSON.parse(teamData));
    } else {
      // Default to Chelsea if no team selected
      setSelectedTeam({ name: 'Chelsea' });
    }
  }, []);

  const downloadImage = () => {
    if (swappedImage) {
      const link = document.createElement('a');
      link.href = swappedImage;
      const teamName = selectedTeam?.name?.toLowerCase() || 'chelsea';
      link.download = `${teamName}-face-swap.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
          <p>Loading your jersey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="download-page">
      <div className="download-container">
        {/* Header */}
        <div className="download-header">
          <h1>🏆 Your {selectedTeam?.name || 'Chelsea'} Jersey is Ready!</h1>
          <p>Your face has been successfully swapped onto the official {selectedTeam?.name || 'Chelsea'} FC jersey!</p>
        </div>

        {/* Result Image */}
        <div className="result-section">
          <div className="result-image-container">
            <img 
              src={swappedImage} 
              alt={`Your Face on ${selectedTeam?.name || 'Chelsea'} Jersey`} 
              className="result-image"
            />
            <div className="image-overlay">
              <div className="overlay-content">
                <h3>⚽ {selectedTeam?.name || 'Chelsea'} FC</h3>
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

      </div>
    </div>
  );
};

export default DownloadPage;
