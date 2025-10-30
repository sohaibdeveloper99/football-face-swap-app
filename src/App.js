import React, { useState, useEffect } from 'react';
import faceSwapService from './services/faceSwapService';
import advancedFaceAlignmentService from './services/advancedFaceAlignmentService';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import ProductPage from './ProductPage';
import DownloadPage from './DownloadPage';
import FacePage from './FacePage';
import FaceSwapPage from './FaceSwapPage';
import { supabase } from './lib/supabase';
import { getJerseyImageUrl, getFaceImageUrl } from './utils/imageUtils';
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
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    
    // Check admin login status
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    setIsAdminLoggedIn(adminLoggedIn);
    
    // Initialize advanced face alignment service
    initializeAdvancedFaceSwap();
    
    // Check backend health on mount
    checkBackendHealth();
    
    // Test Supabase connection
    testSupabaseConnection();
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

  const testSupabaseConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase.from('_supabase_migrations').select('version').limit(1);
      if (error) {
        console.log('Supabase connection test completed (expected error for migrations table):', error.message);
      } else {
        console.log('Supabase connected successfully:', data);
      }
    } catch (error) {
      console.log('Supabase connection test completed:', error.message);
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

  const selectJersey = (teamName, jerseyFileName, faceFileName) => {
    // Check if the filenames are full URLs (external links) or filenames (Supabase)
    const jerseyImage = jerseyFileName.startsWith('http') 
      ? jerseyFileName 
      : getJerseyImageUrl(jerseyFileName);
    
    const faceImage = faceFileName.startsWith('http') 
      ? faceFileName 
      : getFaceImageUrl(faceFileName);
    
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

  // If we're on the admin route, show the admin panel with login
  if (isAdminRoute) {
    if (isAdminLoggedIn) {
      return <AdminDashboard onLogout={() => setIsAdminLoggedIn(false)} />;
    } else {
      return <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} />;
    }
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


  // Navigation menu items
  const navItems = [
    { id: 'premier-league', name: '🏆 Premier League' },
    { id: 'championship', name: '🏆 EFL Championship' },
    { id: 'league-one', name: '🏆 EFL League One' },
    { id: 'league-two', name: '🏆 EFL League Two' },
    { id: 'scottish', name: '🏆 Scottish Clubs' },
    { id: 'spanish', name: '🏆 Spanish Clubs' },
    { id: 'nfl', name: '🏆 NFL Teams' },
    { id: 'nba', name: '🏀 NBA Teams' },
    { id: 'mlb', name: '⚾ MLB Teams' },
    { id: 'germany', name: '🇩🇪 Germany Clubs' },
    { id: 'france', name: '🇫🇷 France Clubs' },
    { id: 'italy', name: '🇮🇹 Italy Clubs' },
    { id: 'holland', name: '🇳🇱 Holland Clubs' }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="main-header">
        <div className="header-container">
          <div className="header-logo-container">
            <img 
              src="https://vxwtwerojlaccjqkjupe.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202025-10-09%20at%203.17.15%20PM.jpeg" 
              alt="Football Swap Logo" 
              className="header-logo"
              onClick={() => window.location.href = '/'}
            />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="header-nav-desktop">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="nav-item"
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Mobile Hamburger Button */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <nav className="header-nav-mobile">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="nav-item-mobile"
              >
                {item.name}
              </button>
            ))}
          </nav>
        )}
      </header>

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
              <a href="#jersey-selection" className="hero-button primary">
                🎯 Choose Your Team Jersey
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
        <section id="jersey-selection" className="jersey-selection-section">
          <h2>Choose Your Team Jersey</h2>
          <p>Select your favorite football team jersey to put your face on!</p>
          
          {/* Premier League Section */}
          <div id="premier-league" className="tournament-section">
            <h3 className="tournament-title">🏆 Premier League</h3>
          <div className="jersey-grid">
            {/* Note: These teams need their jersey images uploaded to Supabase */}
            <div className="jersey-card" onClick={() => selectJersey('Arsenal', 'https://i.postimg.cc/XYsK9vQN/Arsenal.jpg', 'Arsenal.png')}>
              <div className="jersey-image">
                <img src="https://i.postimg.cc/XYsK9vQN/Arsenal.jpg" alt="Arsenal Jersey" />
              </div>
              <h4>Arsenal</h4>
              <p>Gunners Red Jersey</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Aston Villa', 'https://i.postimg.cc/KvZgQ2Km/Aston-Villa.jpg', 'Aston Villa.png')}>
              <div className="jersey-image">
                <img src="https://i.postimg.cc/KvZgQ2Km/Aston-Villa.jpg" alt="Aston Villa Jersey" />
              </div>
              <h4>Aston Villa</h4>
              <p>Claret & Blue Jersey</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('AFC Bournemouth', 'https://i.postimg.cc/Bv18tZzN/AFC-Bournemouth.jpg', 'AFC Bournemouth.png')}>
              <div className="jersey-image">
                <img src="https://i.postimg.cc/Bv18tZzN/AFC-Bournemouth.jpg" alt="AFC Bournemouth Jersey" />
              </div>
              <h4>AFC Bournemouth</h4>
              <p>Cherries Red & Black</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Brentford', 'https://i.postimg.cc/rsgs7DdD/Brentford.jpg', 'Brentford.png')}>
              <div className="jersey-image">
                <img src="https://i.postimg.cc/rsgs7DdD/Brentford.jpg" alt="Brentford Jersey" />
              </div>
              <h4>Brentford</h4>
              <p>Bees Red & White</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Brighton & Hove Albion', 'https://i.postimg.cc/tJRCd9B2/Brighton-Hove-Albion.jpg', 'Brighton & Hove Albion.png')}>
              <div className="jersey-image">
                <img src="https://i.postimg.cc/tJRCd9B2/Brighton-Hove-Albion.jpg" alt="Brighton Jersey" />
              </div>
              <h4>Brighton & Hove Albion</h4>
              <p>Seagulls Blue & White</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Burnley', 'https://i.postimg.cc/cHBL8vBj/Burnley.jpg', 'Burnley.png')}>
              <div className="jersey-image">
                <img src="https://i.postimg.cc/cHBL8vBj/Burnley.jpg" alt="Burnley Jersey" />
              </div>
              <h4>Burnley</h4>
              <p>Clarets Claret & Blue</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Chelsea', 'chelsea_home_jersey.jpg', 'Chelsea.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('chelsea_home_jersey.jpg')} alt="Chelsea Jersey" />
              </div>
              <h4>Chelsea</h4>
              <p>Blues Royal Blue</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Crystal Palace', 'crystal_palace_home_jersey.jpg', 'Crystal Palace.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('crystal_palace_home_jersey.jpg')} alt="Crystal Palace Jersey" />
              </div>
                <h4>Crystal Palace</h4>
                <p>Red & Blue Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Everton', 'everton_home_jersey.jpg', 'Everton.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('everton_home_jersey.jpg')} alt="Everton Jersey" />
              </div>
                <h4>Everton</h4>
                <p>Blue with Pattern</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Fulham', 'fulham_home_jersey.jpg', 'Fulham.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('fulham_home_jersey.jpg')} alt="Fulham Jersey" />
              </div>
                <h4>Fulham</h4>
                <p>White with Black Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Leeds United', 'leeds_united_home_jersey.jpg', 'Leeds United.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('leeds_united_home_jersey.jpg')} alt="Leeds United Jersey" />
              </div>
                <h4>Leeds United</h4>
                <p>White with Blue & Yellow</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Liverpool', 'liverpool_home_jersey.jpg', 'Liverpool.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('liverpool_home_jersey.jpg')} alt="Liverpool Jersey" />
              </div>
                <h4>Liverpool</h4>
                <p>Red with White Pinstripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Manchester City', 'manchester_city_home_jersey.jpg', 'Manchester City.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('manchester_city_home_jersey.jpg')} alt="Manchester City Jersey" />
              </div>
                <h4>Manchester City</h4>
                <p>Blue with White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Manchester United', 'manchester_united_home_jersey.jpg', 'Manchester United.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('manchester_united_home_jersey.jpg')} alt="Manchester United Jersey" />
              </div>
                <h4>Manchester United</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Newcastle United', 'newcastle_united_home_jersey.jpg', 'Newcastle United.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('newcastle_united_home_jersey.jpg')} alt="Newcastle United Jersey" />
                </div>
                <h4>Newcastle United</h4>
              <p>Black & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Nottingham Forest', 'nottingham_forest_home_jersey.jpg', 'Nottingham Forest.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('nottingham_forest_home_jersey.jpg')} alt="Nottingham Forest Jersey" />
              </div>
                <h4>Nottingham Forest</h4>
                <p>Red with White Pinstripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Sunderland', 'sunderland_home_jersey.jpg', 'Sunderland.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('sunderland_home_jersey.jpg')} alt="Sunderland Jersey" />
              </div>
                <h4>Sunderland</h4>
                <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Tottenham Hotspur', 'tottenham_hotspur_home_jersey.jpg', 'Tottenham Hotspur.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('tottenham_hotspur_home_jersey.jpg')} alt="Tottenham Hotspur Jersey" />
              </div>
                <h4>Tottenham Hotspur</h4>
                <p>White with Navy & Red</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('West Ham United', 'west_ham_united_home_jersey.jpg', 'West Ham United.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('west_ham_united_home_jersey.jpg')} alt="West Ham United Jersey" />
              </div>
                <h4>West Ham United</h4>
                <p>Claret with White & Blue</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Wolverhampton Wanderers', 'wolverhampton_wanderers_home_jersey.jpg', 'Wolverhampton Wanderers.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('wolverhampton_wanderers_home_jersey.jpg')} alt="Wolverhampton Wanderers Jersey" />
              </div>
                <h4>Wolverhampton Wanderers</h4>
                <p>Gold with Black Details</p>
              </div>
            </div>
            </div>
            
          {/* EFL Championship Section */}
          <div id="championship" className="tournament-section">
            <h3 className="tournament-title">🏆 EFL Championship</h3>
            <div className="jersey-grid">
            
              <div className="jersey-card" onClick={() => selectJersey('Birmingham City', 'birmingham_city_home_jersey.jpg', 'Birmingham City.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('birmingham_city_home_jersey.jpg')} alt="Birmingham City Jersey" />
              </div>
                <h4>Birmingham City</h4>
                <p>Blue with Gold Accents</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Blackburn Rovers', 'blackburn_rovers_home_jersey.jpg', 'Blackburn Rovers.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('blackburn_rovers_home_jersey.jpg')} alt="Blackburn Rovers Jersey" />
              </div>
                <h4>Blackburn Rovers</h4>
              <p>Blue & White Split</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Bristol City', 'bristol_city_home_jersey.jpg', 'Bristol City.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('bristol_city_home_jersey.jpg')} alt="Bristol City Jersey" />
              </div>
                <h4>Bristol City</h4>
                <p>Red with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Charlton Athletic', 'charlton_athletic_home_jersey.jpg', 'Charlton Athletic.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('charlton_athletic_home_jersey.jpg')} alt="Charlton Athletic Jersey" />
              </div>
                <h4>Charlton Athletic</h4>
                <p>Red with White Panels</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Coventry City', 'coventry_city_home_jersey.jpg', 'Coventry City.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('coventry_city_home_jersey.jpg')} alt="Coventry City Jersey" />
              </div>
                <h4>Coventry City</h4>
                <p>Blue with Checkered Pattern</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Derby County', 'derby_county_home_jersey.jpg', 'Derby County.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('derby_county_home_jersey.jpg')} alt="Derby County Jersey" />
              </div>
                <h4>Derby County</h4>
                <p>White with Black & Yellow</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Hull City', 'hull_city_home_jersey.jpg', 'Hull City.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('hull_city_home_jersey.jpg')} alt="Hull City Jersey" />
              </div>
                <h4>Hull City</h4>
                <p>Orange with Black Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Ipswich Town', 'ipswich_town_home_jersey.jpg', 'Ipswich Town.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('ipswich_town_home_jersey.jpg')} alt="Ipswich Town Jersey" />
              </div>
                <h4>Ipswich Town</h4>
                <p>Blue with Pattern</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Leicester City', 'leicester_city_home_jersey.jpg', 'Leicester City.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('leicester_city_home_jersey.jpg')} alt="Leicester City Jersey" />
              </div>
                <h4>Leicester City</h4>
                <p>Blue with Gold Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Middlesbrough', 'middlesbrough_home_jersey.jpg', 'Middlesbrough.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('middlesbrough_home_jersey.jpg')} alt="Middlesbrough Jersey" />
              </div>
                <h4>Middlesbrough</h4>
                <p>Red with White Band</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Millwall', 'millwall_home_jersey.jpg', 'Millwall.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('millwall_home_jersey.jpg')} alt="Millwall Jersey" />
              </div>
                <h4>Millwall</h4>
                <p>Blue with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Norwich City', 'norwich_city_home_jersey.jpg', 'Norwich City.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('norwich_city_home_jersey.jpg')} alt="Norwich City Jersey" />
              </div>
                <h4>Norwich City</h4>
                <p>Yellow with Green Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Oxford United', 'oxford_united_home_jersey.jpg', 'Oxford United.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('oxford_united_home_jersey.jpg')} alt="Oxford United Jersey" />
              </div>
                <h4>Oxford United</h4>
                <p>Yellow with Navy Accents</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Portsmouth', 'portsmouth_home_jersey.jpg', 'Portsmouth.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('portsmouth_home_jersey.jpg')} alt="Portsmouth Jersey" />
              </div>
                <h4>Portsmouth</h4>
                <p>Blue with Pattern</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Preston North End', 'preston_north_end_home_jersey.jpg', 'Preston North End.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('preston_north_end_home_jersey.jpg')} alt="Preston North End Jersey" />
              </div>
                <h4>Preston North End</h4>
                <p>White with Pattern</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Queens Park Rangers', 'queens_park_rangers_home_jersey.jpg', 'Queens Park Rangers.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('queens_park_rangers_home_jersey.jpg')} alt="Queens Park Rangers Jersey" />
              </div>
                <h4>Queens Park Rangers</h4>
                <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Sheffield United', 'sheffield_united_home_jersey.jpg', 'Sheffield United.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('sheffield_united_home_jersey.jpg')} alt="Sheffield United Jersey" />
              </div>
                <h4>Sheffield United</h4>
              <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Sheffield Wednesday', 'sheffield_wednesday_home_jersey.jpg', 'Sheffield Wednesday.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('sheffield_wednesday_home_jersey.jpg')} alt="Sheffield Wednesday Jersey" />
              </div>
                <h4>Sheffield Wednesday</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Southampton', 'southampton_home_jersey.jpg', 'Southampton.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('southampton_home_jersey.jpg')} alt="Southampton Jersey" />
              </div>
                <h4>Southampton</h4>
                <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Stoke City', 'stoke_city_home_jersey.jpg', 'Stoke City.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('stoke_city_home_jersey.jpg')} alt="Stoke City Jersey" />
              </div>
                <h4>Stoke City</h4>
                <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Swansea City', 'swansea_city_home_jersey.jpg', 'Swansea City.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('swansea_city_home_jersey.jpg')} alt="Swansea City Jersey" />
              </div>
                <h4>Swansea City</h4>
                <p>White with Checkered Pattern</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Watford', 'watford_home_jersey.jpg', 'Watford.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('watford_home_jersey.jpg')} alt="Watford Jersey" />
                </div>
                <h4>Watford</h4>
                <p>Yellow with Red Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('West Bromwich Albion', 'west_bromwich_albion_home_jersey.jpg', 'West Bromwich Albion.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('west_bromwich_albion_home_jersey.jpg')} alt="West Bromwich Albion Jersey" />
                </div>
                <h4>West Bromwich Albion</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Wrexham', 'wrexham_home_jersey.jpg', 'Wrexham.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('wrexham_home_jersey.jpg')} alt="Wrexham Jersey" />
              </div>
                <h4>Wrexham</h4>
                <p>Red with White Details</p>
              </div>
            </div>
            </div>
            
          {/* EFL League One Section */}
          <div id="league-one" className="tournament-section">
            <h3 className="tournament-title">🏆 EFL League One</h3>
            <div className="jersey-grid">
            
              <div className="jersey-card" onClick={() => selectJersey('AFC Wimbledon', 'afc_wimbledon_home_jersey.jpg', 'AFC Wimbledon.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('afc_wimbledon_home_jersey.jpg')} alt="AFC Wimbledon Jersey" />
              </div>
                <h4>AFC Wimbledon</h4>
                <p>Blue with Yellow Details</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Barnsley', 'barnsley_home_jersey.jpg', 'Barnsley.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('barnsley_home_jersey.jpg')} alt="Barnsley Jersey" />
              </div>
              <h4>Barnsley</h4>
              <p>Red with White Details</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Blackpool', 'blackpool_home_jersey.jpg', 'Blackpool.jpg')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('blackpool_home_jersey.jpg')} alt="Blackpool Jersey" />
              </div>
              <h4>Blackpool</h4>
              <p>Orange with White Panels</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Bolton Wanderers', 'bolton_wanderers_home_jersey.jpg', 'Bolton Wanderers.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('bolton_wanderers_home_jersey.jpg')} alt="Bolton Wanderers Jersey" />
              </div>
              <h4>Bolton Wanderers</h4>
              <p>White with Navy & Red</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Bradford City', 'bradford_city_home_jersey.jpg', 'Bradford City.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('bradford_city_home_jersey.jpg')} alt="Bradford City Jersey" />
              </div>
              <h4>Bradford City</h4>
              <p>Maroon with Gold Stripes</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Burton Albion', 'burton_albion_home_jersey.jpg', 'Burton Albion.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('burton_albion_home_jersey.jpg')} alt="Burton Albion Jersey" />
              </div>
              <h4>Burton Albion</h4>
              <p>Gold & Black Split</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Cardiff City', 'cardiff_city_home_jersey.jpg', 'Cardiff City.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('cardiff_city_home_jersey.jpg')} alt="Cardiff City Jersey" />
              </div>
              <h4>Cardiff City</h4>
              <p>Blue with White Pinstripes</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Doncaster Rovers', 'doncaster_rovers_home_jersey.jpg', 'Doncaster Rovers.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('doncaster_rovers_home_jersey.jpg')} alt="Doncaster Rovers Jersey" />
              </div>
              <h4>Doncaster Rovers</h4>
              <p>Red & White Stripes</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Exeter City', 'exeter_city_home_jersey.jpg', 'Exeter City.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('exeter_city_home_jersey.jpg')} alt="Exeter City Jersey" />
              </div>
              <h4>Exeter City</h4>
              <p>Red & White Stripes</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Huddersfield Town', 'huddersfield_town_home_jersey.jpg', 'Huddersfield Town.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('huddersfield_town_home_jersey.jpg')} alt="Huddersfield Town Jersey" />
              </div>
              <h4>Huddersfield Town</h4>
              <p>Blue & White Stripes</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Leyton Orient', 'leyton_orient_home_jersey.jpg', 'Leyton Orient.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('leyton_orient_home_jersey.jpg')} alt="Leyton Orient Jersey" />
              </div>
              <h4>Leyton Orient</h4>
              <p>Red with Black Details</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Lincoln City', 'lincoln_city_home_jersey.jpg', 'Lincoln City.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('lincoln_city_home_jersey.jpg')} alt="Lincoln City Jersey" />
              </div>
              <h4>Lincoln City</h4>
              <p>Red & White Stripes</p>
            </div>
            
            <div className="jersey-card" onClick={() => selectJersey('Luton Town', 'luton_town_home_jersey.jpg', 'Luton Town.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('luton_town_home_jersey.jpg')} alt="Luton Town Jersey" />
              </div>
              <h4>Luton Town</h4>
              <p>Orange with Black Sleeves</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Mansfield Town', 'mansfield_town_home_jersey.jpg', 'Mansfield Town.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('mansfield_town_home_jersey.jpg')} alt="Mansfield Town Jersey" />
              </div>
              <h4>Mansfield Town</h4>
              <p>Yellow with Blue Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Northampton Town', 'northampton_town_home_jersey.jpg', 'Northampton Town.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('northampton_town_home_jersey.jpg')} alt="Northampton Town Jersey" />
              </div>
              <h4>Northampton Town</h4>
              <p>Maroon with White Accents</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Peterborough United', 'peterborough_united_home_jersey.jpg', 'Peterborough United.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('peterborough_united_home_jersey.jpg')} alt="Peterborough United Jersey" />
              </div>
              <h4>Peterborough United</h4>
              <p>Blue with White Accents</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Plymouth Argyle', 'plymouth_argyle_home_jersey.jpg', 'Plymouth Argyle.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('plymouth_argyle_home_jersey.jpg')} alt="Plymouth Argyle Jersey" />
              </div>
              <h4>Plymouth Argyle</h4>
              <p>Green with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Port Vale', 'port_vale_home_jersey.jpg', 'Port Vale.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('port_vale_home_jersey.jpg')} alt="Port Vale Jersey" />
              </div>
              <h4>Port Vale</h4>
              <p>White with Black Accents</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Reading', 'reading_home_jersey.jpg', 'Reading.jpg')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('reading_home_jersey.jpg')} alt="Reading Jersey" />
              </div>
              <h4>Reading</h4>
              <p>White with Blue & Red Pattern</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Rotherham United', 'rotherham_united_home_jersey.jpg', 'Rotherham United.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('rotherham_united_home_jersey.jpg')} alt="Rotherham United Jersey" />
              </div>
              <h4>Rotherham United</h4>
              <p>Red with White Sleeves</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Stevenage', 'stevenage_home_jersey.jpg', 'Stevenage.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('stevenage_home_jersey.jpg')} alt="Stevenage Jersey" />
              </div>
              <h4>Stevenage</h4>
              <p>White with Red Sleeves</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Stockport County', 'stockport_county_home_jersey.jpg', 'Stockport County.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('stockport_county_home_jersey.jpg')} alt="Stockport County Jersey" />
              </div>
              <h4>Stockport County</h4>
              <p>Blue with White Accents</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Wigan Athletic', 'wigan_athletic_home_jersey.jpg', 'Wigan Athletic.png')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('wigan_athletic_home_jersey.jpg')} alt="Wigan Athletic Jersey" />
              </div>
              <h4>Wigan Athletic</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Wycombe Wanderers', 'wycombe_wanderers_home_jersey.jpg', 'Wycombe Wanderers.jpg')}>
              <div className="jersey-image">
                <img src={getJerseyImageUrl('wycombe_wanderers_home_jersey.jpg')} alt="Wycombe Wanderers Jersey" />
              </div>
              <h4>Wycombe Wanderers</h4>
              <p>Blue Split Design</p>
              </div>
            </div>
            </div>
            
          {/* EFL League Two Section */}
          <div id="league-two" className="tournament-section">
            <h3 className="tournament-title">🏆 EFL League Two</h3>
            <div className="jersey-grid">
            
              <div className="jersey-card" onClick={() => selectJersey('Barnet', 'barnet_home_jersey.jpg', 'Barnet.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('barnet_home_jersey.jpg')} alt="Barnet Jersey" />
              </div>
                <h4>Barnet</h4>
                <p>Cream with Black Accents</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Barrow', 'barrow_home_jersey.jpg', 'Barrow.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('barrow_home_jersey.jpg')} alt="Barrow Jersey" />
                </div>
                <h4>Barrow</h4>
                <p>White with Black Shoulders</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Bristol Rovers', 'bristol_rovers_home_jersey.jpg', 'Bristol Rovers.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('bristol_rovers_home_jersey.jpg')} alt="Bristol Rovers Jersey" />
                </div>
                <h4>Bristol Rovers</h4>
                <p>Blue & White Split</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Bromley', 'bromley_home_jersey.jpg', 'Bromley.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('bromley_home_jersey.jpg')} alt="Bromley Jersey" />
                </div>
                <h4>Bromley</h4>
                <p>Orange & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cambridge United', 'cambridge_united_home_jersey.jpg', 'Cambridge United.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('cambridge_united_home_jersey.jpg')} alt="Cambridge United Jersey" />
                </div>
                <h4>Cambridge United</h4>
                <p>White with Black Accents</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cheltenham Town', 'cheltenham_town_home_jersey.jpg', 'Cheltenham Town.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('cheltenham_town_home_jersey.jpg')} alt="Cheltenham Town Jersey" />
                </div>
                <h4>Cheltenham Town</h4>
                <p>Red & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Chesterfield', 'chesterfield_home_jersey.jpg', 'Chesterfield.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('chesterfield_home_jersey.jpg')} alt="Chesterfield Jersey" />
                </div>
                <h4>Chesterfield</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Colchester United', 'colchester_united_home_jersey.jpg', 'Colchester United.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('colchester_united_home_jersey.jpg')} alt="Colchester United Jersey" />
              </div>
                <h4>Colchester United</h4>
                <p>Blue & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Crawley Town', 'crawley_town_home_jersey.jpg', 'Crawley Town.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('crawley_town_home_jersey.jpg')} alt="Crawley Town Jersey" />
                </div>
                <h4>Crawley Town</h4>
                <p>Red & White Design</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Crewe Alexandra', 'crewe_alexandra_home_jersey.jpg', 'Crewe Alexandra.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('crewe_alexandra_home_jersey.jpg')} alt="Crewe Alexandra Jersey" />
                </div>
                <h4>Crewe Alexandra</h4>
              <p>Red with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Fleetwood Town', 'fleetwood_town_home_jersey.jpg', 'Fleetwood Town.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('fleetwood_town_home_jersey.jpg')} alt="Fleetwood Town Jersey" />
              </div>
                <h4>Fleetwood Town</h4>
                <p>Red & White Design</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Gillingham', 'gillingham_home_jersey.jpg', 'Gillingham.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('gillingham_home_jersey.jpg')} alt="Gillingham Jersey" />
              </div>
                <h4>Gillingham</h4>
                <p>Blue with White Lines</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Grimsby Town', 'grimsby_town_home_jersey.jpg', 'Grimsby Town.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('grimsby_town_home_jersey.jpg')} alt="Grimsby Town Jersey" />
              </div>
                <h4>Grimsby Town</h4>
                <p>Black & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Harrogate Town', 'harrogate_town_home_jersey.jpg', 'Harrogate Town.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('harrogate_town_home_jersey.jpg')} alt="Harrogate Town Jersey" />
              </div>
                <h4>Harrogate Town</h4>
                <p>Yellow & Grey Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Milton Keynes Irish FC', 'milton_keynes_irish_fc_home_jersey.jpg', 'Milton Keynes Irish FC.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('milton_keynes_irish_fc_home_jersey.jpg')} alt="Milton Keynes Irish FC Jersey" />
              </div>
                <h4>Milton Keynes Irish FC</h4>
                <p>Green & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Newport County', '/jerseys/newport_county_home_jersey.jpg', '/jerseys/newport_county_home_jersey.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('newport_county_home_jersey.jpg')} alt="Newport County Jersey" />
              </div>
                <h4>Newport County</h4>
              <p>Gold & Black Split</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Notts County', 'notts_county_home_jersey.jpg', 'Notts County.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('notts_county_home_jersey.jpg')} alt="Notts County Jersey" />
              </div>
                <h4>Notts County</h4>
                <p>Black & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Oldham Athletic', 'oldham_athletic_home_jersey.jpg', 'Oldham Athletic.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('oldham_athletic_home_jersey.jpg')} alt="Oldham Athletic Jersey" />
              </div>
                <h4>Oldham Athletic</h4>
                <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Salford City', 'salford_city_home_jersey.jpg', 'Salford City.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('salford_city_home_jersey.jpg')} alt="Salford City Jersey" />
              </div>
                <h4>Salford City</h4>
                <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Shrewsbury Town', 'shrewsbury_town_home_jersey.jpg', 'Shrewsbury Town.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('shrewsbury_town_home_jersey.jpg')} alt="Shrewsbury Town Jersey" />
              </div>
                <h4>Shrewsbury Town</h4>
                <p>Blue & Orange Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Swindon Town', 'swindon_town_home_jersey.jpg', 'Swindon Town.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('swindon_town_home_jersey.jpg')} alt="Swindon Town Jersey" />
              </div>
                <h4>Swindon Town</h4>
                <p>Red with White Shoulders</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Tranmere Rovers', 'tranmere_rovers_home_jersey.jpg', 'Tranmere Rovers.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('tranmere_rovers_home_jersey.jpg')} alt="Tranmere Rovers Jersey" />
              </div>
                <h4>Tranmere Rovers</h4>
                <p>White with Blue Pinstripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Walsall FC', 'walsall_fc_home_jersey.jpg', 'Walsall FC.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('walsall_fc_home_jersey.jpg')} alt="Walsall FC Jersey" />
              </div>
                <h4>Walsall FC</h4>
                <p>Red & Black Stripes</p>
              </div>
            </div>
          </div>
          
          {/* Scottish Clubs Section */}
          <div id="scottish" className="tournament-section">
            <h3 className="tournament-title">🏆 Scottish Clubs</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('Aberdeen', 'Aberdeen.jpg', 'Aberdeen.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Aberdeen.jpg')} alt="Aberdeen Jersey" />
                </div>
                <h4>Aberdeen</h4>
              <p>Red with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Celtic', 'Celtic.jpg', 'Celtic.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Celtic.jpg')} alt="Celtic Jersey" />
              </div>
                <h4>Celtic</h4>
                <p>Green & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Dundee', 'Dundee.jpg', 'Dundee.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Dundee.jpg')} alt="Dundee Jersey" />
              </div>
                <h4>Dundee</h4>
                <p>Dark Blue with White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Dundee United', 'Dundee United.jpg', 'Dundee United.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Dundee United.jpg')} alt="Dundee United Jersey" />
              </div>
                <h4>Dundee United</h4>
                <p>Orange & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Falkirk', 'Falkirk.jpg', 'Falkirk.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Falkirk.jpg')} alt="Falkirk Jersey" />
                </div>
                <h4>Falkirk</h4>
                <p>Navy Blue with White & Red</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Hibernian', 'Hibernian.jpg', 'Hibernian.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Hibernian.jpg')} alt="Hibernian Jersey" />
                </div>
                <h4>Hibernian</h4>
                <p>Green with White Sleeves</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Kilmarnock', 'Kilmarnock.jpg', 'Kilmarnock.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Kilmarnock.jpg')} alt="Kilmarnock Jersey" />
                </div>
                <h4>Kilmarnock</h4>
                <p>Blue with White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Livingston', 'Livingston.jpg', 'Livingston.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Livingston.jpg')} alt="Livingston Jersey" />
                </div>
                <h4>Livingston</h4>
                <p>Yellow with Black Band</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Motherwell', 'Motherwell.jpg', 'Motherwell.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Motherwell.jpg')} alt="Motherwell Jersey" />
                </div>
                <h4>Motherwell</h4>
                <p>Gold with Maroon Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Rangers', 'Rangers.jpg', 'Rangers.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Rangers.jpg')} alt="Rangers Jersey" />
                </div>
                <h4>Rangers</h4>
                <p>Royal Blue with White & Red</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('St Mirren', 'St Mirren.jpg', 'St Mirren.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('St Mirren.jpg')} alt="St Mirren Jersey" />
                </div>
                <h4>St Mirren</h4>
                <p>White with Black Stripes</p>
              </div>
            </div>
          </div>
          
          {/* Spanish Clubs Section */}
          <div id="spanish" className="tournament-section">
            <h3 className="tournament-title">🏆 Spanish Clubs</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('Alaves', 'Alaves.jpg', 'Alaves.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Alaves.jpg')} alt="Alaves Jersey" />
                </div>
                <h4>Alaves</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Atletico Madrid', 'Atletico Madrid.jpg', 'Atletico Madrid.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Atletico Madrid.jpg')} alt="Atletico Madrid Jersey" />
              </div>
                <h4>Atletico Madrid</h4>
              <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Barcelona', 'Barcelona.jpg', 'Barcelona.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Barcelona.jpg')} alt="Barcelona Jersey" />
              </div>
                <h4>Barcelona</h4>
                <p>Blue & Garnet Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Celta Vigo', 'Celta Vigo.jpg', 'Celta Vigo.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Celta Vigo.jpg')} alt="Celta Vigo Jersey" />
                </div>
                <h4>Celta Vigo</h4>
                <p>Sky Blue & White</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Espanyol', 'Espanyol.jpg', 'Espanyol.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Espanyol.jpg')} alt="Espanyol Jersey" />
                </div>
                <h4>Espanyol</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Getafe', 'Getafe.jpg', 'Getafe.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Getafe.jpg')} alt="Getafe Jersey" />
              </div>
                <h4>Getafe</h4>
                <p>Blue with Red & Yellow</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Girona', 'Girona.jpg', 'Girona.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Girona.jpg')} alt="Girona Jersey" />
              </div>
                <h4>Girona</h4>
              <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Levante', 'Levante.jpg', 'Levante.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Levante.jpg')} alt="Levante Jersey" />
              </div>
                <h4>Levante</h4>
                <p>Red & Blue Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Mallorca', 'Mallorca.jpg', 'Mallorca.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Mallorca.jpg')} alt="Mallorca Jersey" />
              </div>
                <h4>Mallorca</h4>
                <p>Red with Black Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Osasuna', 'Osasuna.jpg', 'Osasuna.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Osasuna.jpg')} alt="Osasuna Jersey" />
              </div>
                <h4>Osasuna</h4>
                <p>Red with Blue Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Oviedo', 'Oviedo.jpg', 'Oviedo.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Oviedo.jpg')} alt="Oviedo Jersey" />
              </div>
                <h4>Oviedo</h4>
                <p>Blue with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Rayo Vallecano', 'Rayo Vallecano.jpg', 'Rayo Vallecano.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Rayo Vallecano.jpg')} alt="Rayo Vallecano Jersey" />
              </div>
                <h4>Rayo Vallecano</h4>
                <p>White with Red Lightning</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Real Betis', 'Real Betis.jpg', 'Real Betis.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Real Betis.jpg')} alt="Real Betis Jersey" />
              </div>
                <h4>Real Betis</h4>
                <p>Green & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Real Madrid', 'Real Madrid.jpg', 'Real Madrid.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Real Madrid.jpg')} alt="Real Madrid Jersey" />
              </div>
                <h4>Real Madrid</h4>
                <p>All White</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Sevilla', 'Sevilla.jpg', 'Sevilla.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Sevilla.jpg')} alt="Sevilla Jersey" />
              </div>
                <h4>Sevilla</h4>
                <p>White with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Valencia', 'Valencia.jpg', 'Valencia.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Valencia.jpg')} alt="Valencia Jersey" />
                </div>
                <h4>Valencia</h4>
                <p>White with Black & Orange</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Villarreal', 'Villarreal.jpg', 'Villarreal.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Villarreal.jpg')} alt="Villarreal Jersey" />
                </div>
                <h4>Villarreal</h4>
                <p>Yellow with Blue Details</p>
              </div>
            </div>
          </div>
          
          {/* NFL Teams Section */}
          <div id="nfl" className="tournament-section">
            <h3 className="tournament-title">🏆 NFL Teams</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('Arizona Cardinals', 'Arizona Cardinals.png', 'Arizona Cardinals.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Arizona Cardinals.png')} alt="Arizona Cardinals Jersey" />
                </div>
                <h4>Arizona Cardinals</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Atlanta Falcons', 'Atlanta Falcons.jpg', 'Atlanta Falcons.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Atlanta Falcons.jpg')} alt="Atlanta Falcons Jersey" />
                </div>
                <h4>Atlanta Falcons</h4>
                <p>Black with Red & White</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Baltimore Ravens', 'Baltimore Ravens.png', 'Baltimore Ravens.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Baltimore Ravens.png')} alt="Baltimore Ravens Jersey" />
                </div>
                <h4>Baltimore Ravens</h4>
                <p>Purple with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Buffalo Bills', 'Buffalo Bills.png', 'Buffalo Bills.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Buffalo Bills.png')} alt="Buffalo Bills Jersey" />
                </div>
                <h4>Buffalo Bills</h4>
                <p>Blue with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Carolina Panthers', 'Carolina Panthers.png', 'Carolina Panthers.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Carolina Panthers.png')} alt="Carolina Panthers Jersey" />
                </div>
                <h4>Carolina Panthers</h4>
                <p>Blue with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Chicago Bears', 'Chicago Bears.png', 'Chicago Bears.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Chicago Bears.png')} alt="Chicago Bears Jersey" />
                </div>
                <h4>Chicago Bears</h4>
                <p>Blue with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cincinnati Bengals', 'Cincinnati Bengals.png', 'Cincinnati Bengals.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Cincinnati Bengals.png')} alt="Cincinnati Bengals Jersey" />
                </div>
                <h4>Cincinnati Bengals</h4>
                <p>Black with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cleveland Browns', 'Cleveland Browns.png', 'Cleveland Browns.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Cleveland Browns.png')} alt="Cleveland Browns Jersey" />
                </div>
                <h4>Cleveland Browns</h4>
                <p>Brown with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Dallas Cowboys', 'Dallas Cowboys.png', 'Dallas Cowboys.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Dallas Cowboys.png')} alt="Dallas Cowboys Jersey" />
                </div>
                <h4>Dallas Cowboys</h4>
              <p>Blue with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Denver Broncos', 'Denver Broncos.png', 'Denver Broncos.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Denver Broncos.png')} alt="Denver Broncos Jersey" />
              </div>
                <h4>Denver Broncos</h4>
                <p>Orange with Blue Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Detroit Lions', 'Detroit Lions.png', 'Detroit Lions.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Detroit Lions.png')} alt="Detroit Lions Jersey" />
              </div>
                <h4>Detroit Lions</h4>
                <p>Blue with Silver Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Green Bay Packers', 'Green Bay Packers.png', 'Green Bay Packers.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Green Bay Packers.png')} alt="Green Bay Packers Jersey" />
              </div>
                <h4>Green Bay Packers</h4>
                <p>Green with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Houston Texans', 'Houston Texans.jpg', 'Houston Texans.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Houston Texans.jpg')} alt="Houston Texans Jersey" />
              </div>
                <h4>Houston Texans</h4>
                <p>Blue with Red Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Indianapolis Colts', 'Indianapolis Colts.png', 'Indianapolis Colts.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Indianapolis Colts.png')} alt="Indianapolis Colts Jersey" />
              </div>
                <h4>Indianapolis Colts</h4>
                <p>Blue with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Jacksonville Jaguars', 'Jacksonville-Jaguars.png', 'Jacksonville Jaguars.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Jacksonville-Jaguars.png')} alt="Jacksonville Jaguars Jersey" />
              </div>
                <h4>Jacksonville Jaguars</h4>
                <p>Teal with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Kansas City Chiefs', 'Kansas-City-Chiefs.png', 'Kansas City Chiefs.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Kansas-City-Chiefs.png')} alt="Kansas City Chiefs Jersey" />
                </div>
                <h4>Kansas City Chiefs</h4>
                <p>Red with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Las Vegas Raiders', 'Las-Vegas-Raiders.png', 'Las Vegas Raiders.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Las-Vegas-Raiders.png')} alt="Las Vegas Raiders Jersey" />
                </div>
                <h4>Las Vegas Raiders</h4>
                <p>Black with Silver Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Los Angeles Chargers', 'Los-Angeles-Chargers.png', 'Los Angeles Chargers.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Los-Angeles-Chargers.png')} alt="Los Angeles Chargers Jersey" />
                </div>
                <h4>Los Angeles Chargers</h4>
                <p>Blue with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Los Angeles Rams', 'Los-Angeles-Rams.png', 'Los Angeles Rams.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Los-Angeles-Rams.png')} alt="Los Angeles Rams Jersey" />
                </div>
                <h4>Los Angeles Rams</h4>
                <p>Blue with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Miami Dolphins', 'Miami Dolphins.jpg', 'Miami Dolphins.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Miami Dolphins.jpg')} alt="Miami Dolphins Jersey" />
                </div>
                <h4>Miami Dolphins</h4>
                <p>Teal with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Minnesota Vikings', 'Minnesota-Vikings.png', 'Minnesota Vikings.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Minnesota-Vikings.png')} alt="Minnesota Vikings Jersey" />
                </div>
                <h4>Minnesota Vikings</h4>
                <p>Purple with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New England Patriots', 'New England Patriots.jpg', 'New England Patriots.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('New England Patriots.jpg')} alt="New England Patriots Jersey" />
                </div>
                <h4>New England Patriots</h4>
                <p>Blue with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New Orleans Saints', 'New-Orleans-Saints.png', 'New Orleans Saints.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('New-Orleans-Saints.png')} alt="New Orleans Saints Jersey" />
                </div>
                <h4>New Orleans Saints</h4>
                <p>Black with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New York Giants', 'New York Giants.jpg', 'New York Giants.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('New York Giants.jpg')} alt="New York Giants Jersey" />
                </div>
                <h4>New York Giants</h4>
                <p>Blue with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New York Jets', 'New-York-Jets.png', 'New York Jets.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('New-York-Jets.png')} alt="New York Jets Jersey" />
                </div>
                <h4>New York Jets</h4>
                <p>Green with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Philadelphia Eagles', 'Philadelphia-Eagles.png', 'Philadelphia Eagles.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Philadelphia-Eagles.png')} alt="Philadelphia Eagles Jersey" />
                </div>
                <h4>Philadelphia Eagles</h4>
                <p>Green with Silver Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Pittsburgh Steelers', 'Pittsburgh Steelers.png', 'Pittsburgh Steelers.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Pittsburgh Steelers.png')} alt="Pittsburgh Steelers Jersey" />
                </div>
                <h4>Pittsburgh Steelers</h4>
                <p>Black with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('San Francisco 49ers', 'San Francisco 49ers.png', 'San Francisco 49ers.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('San Francisco 49ers.png')} alt="San Francisco 49ers Jersey" />
                </div>
                <h4>San Francisco 49ers</h4>
                <p>Red with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Seattle Seahawks', 'Seattle Seahawks.png', 'Seattle Seahawks.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Seattle Seahawks.png')} alt="Seattle Seahawks Jersey" />
                </div>
                <h4>Seattle Seahawks</h4>
                <p>Blue with Green Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Tampa Bay Buccaneers', 'Tampa Bay Buccaneers.jpg', 'Tampa Bay Buccaneers.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Tampa Bay Buccaneers.jpg')} alt="Tampa Bay Buccaneers Jersey" />
                </div>
                <h4>Tampa Bay Buccaneers</h4>
                <p>Red with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Tennessee Titans', 'Tennessee Titans.png', 'Tennessee Titans.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Tennessee Titans.png')} alt="Tennessee Titans Jersey" />
                </div>
                <h4>Tennessee Titans</h4>
                <p>Blue with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Washington Commanders', 'Washington Commanders.png', 'Washington Commanders.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Washington Commanders.png')} alt="Washington Commanders Jersey" />
                </div>
                <h4>Washington Commanders</h4>
                <p>Burgundy with Gold Details</p>
              </div>
            </div>
          </div>
          
          {/* NBA Teams Section */}
          <div id="nba" className="tournament-section">
            <h3 className="tournament-title">🏀 NBA Teams</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('Atlanta Hawks', 'Atlanta Hawks.png', 'Atlanta Hawks.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Atlanta Hawks.png')} alt="Atlanta Hawks Jersey" />
                </div>
                <h4>Atlanta Hawks</h4>
              <p>Red with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Boston Celtics', 'Boston Celtics.png', 'Boston Celtics.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Boston Celtics.png')} alt="Boston Celtics Jersey" />
              </div>
                <h4>Boston Celtics</h4>
                <p>Green with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Brooklyn Nets', 'Brooklyn Nets.png', 'Brooklyn Nets.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Brooklyn Nets.png')} alt="Brooklyn Nets Jersey" />
              </div>
                <h4>Brooklyn Nets</h4>
                <p>Black with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Charlotte Hornets', 'Charlotte Hornets.png', 'Charlotte Hornets.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Charlotte Hornets.png')} alt="Charlotte Hornets Jersey" />
              </div>
                <h4>Charlotte Hornets</h4>
                <p>Teal with Purple Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Chicago Bulls', 'Chicago Bulls.jpg', 'Chicago Bulls.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Chicago Bulls.jpg')} alt="Chicago Bulls Jersey" />
                </div>
                <h4>Chicago Bulls</h4>
                <p>Red with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cleveland Cavaliers', 'Cleveland Cavaliers.png', 'Cleveland Cavaliers.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Cleveland Cavaliers.png')} alt="Cleveland Cavaliers Jersey" />
                </div>
                <h4>Cleveland Cavaliers</h4>
                <p>Wine with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Dallas Mavericks', 'Dallas Mavericks.png', 'Dallas Mavericks.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Dallas Mavericks.png')} alt="Dallas Mavericks Jersey" />
                </div>
                <h4>Dallas Mavericks</h4>
                <p>Blue with Silver Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Denver Nuggets', 'Denver Nuggets.png', 'Denver Nuggets.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Denver Nuggets.png')} alt="Denver Nuggets Jersey" />
                </div>
                <h4>Denver Nuggets</h4>
                <p>Navy with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Detroit Pistons', 'Detroit Pistons.jpg', 'Detroit Pistons.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Detroit Pistons.jpg')} alt="Detroit Pistons Jersey" />
                </div>
                <h4>Detroit Pistons</h4>
                <p>Red with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Golden State Warriors', 'Golden State Warriors.png', 'Golden State Warriors.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Golden State Warriors.png')} alt="Golden State Warriors Jersey" />
                </div>
                <h4>Golden State Warriors</h4>
                <p>Blue with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Houston Rockets', 'Houston Rockets.jpg', 'Houston Rockets.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Houston Rockets.jpg')} alt="Houston Rockets Jersey" />
                </div>
                <h4>Houston Rockets</h4>
              <p>Red with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Indiana Pacers', 'Indiana Pacers.png', 'Indiana Pacers.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Indiana Pacers.png')} alt="Indiana Pacers Jersey" />
              </div>
                <h4>Indiana Pacers</h4>
                <p>Blue with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Los Angeles Clippers', 'Los Angeles Clippers.jpg', 'Los Angeles Clippers.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Los Angeles Clippers.jpg')} alt="Los Angeles Clippers Jersey" />
              </div>
                <h4>Los Angeles Clippers</h4>
                <p>Blue with Red Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Los Angeles Lakers', 'Los Angeles Lakers.png', 'Los Angeles Lakers.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Los Angeles Lakers.png')} alt="Los Angeles Lakers Jersey" />
              </div>
                <h4>Los Angeles Lakers</h4>
                <p>Purple with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Memphis Grizzlies', 'Memphis Grizzlies.png', 'Memphis Grizzlies.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Memphis Grizzlies.png')} alt="Memphis Grizzlies Jersey" />
              </div>
                <h4>Memphis Grizzlies</h4>
                <p>Navy with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Miami Heat', 'Miami Heat.png', 'Miami Heat.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Miami Heat.png')} alt="Miami Heat Jersey" />
              </div>
                <h4>Miami Heat</h4>
                <p>Red with Black Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Milwaukee Bucks', 'Milwaukee Bucks.png', 'Milwaukee Bucks.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Milwaukee Bucks.png')} alt="Milwaukee Bucks Jersey" />
              </div>
                <h4>Milwaukee Bucks</h4>
                <p>Green with Cream Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Minnesota Timberwolves', 'Minnesota Timberwolves.png', 'Minnesota Timberwolves.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Minnesota Timberwolves.png')} alt="Minnesota Timberwolves Jersey" />
                </div>
                <h4>Minnesota Timberwolves</h4>
                <p>Blue with Green Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New Orleans Pelicans', 'New Orleans Pelicans.png', 'New Orleans Pelicans.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('New Orleans Pelicans.png')} alt="New Orleans Pelicans Jersey" />
                </div>
                <h4>New Orleans Pelicans</h4>
                <p>Navy with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New York Knicks', 'New York Knicks.png', 'New York Knicks.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('New York Knicks.png')} alt="New York Knicks Jersey" />
                </div>
                <h4>New York Knicks</h4>
                <p>Blue with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Oklahoma City Thunder', 'Oklahoma City Thunder.png', 'Oklahoma City Thunder.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Oklahoma City Thunder.png')} alt="Oklahoma City Thunder Jersey" />
                </div>
                <h4>Oklahoma City Thunder</h4>
                <p>Blue with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Orlando Magic', 'Orlando Magic.png', 'Orlando Magic.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Orlando Magic.png')} alt="Orlando Magic Jersey" />
                </div>
                <h4>Orlando Magic</h4>
                <p>Blue with Silver Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Philadelphia 76ers', 'Philadelphia 76ers.png', 'Philadelphia 76ers.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Philadelphia 76ers.png')} alt="Philadelphia 76ers Jersey" />
                </div>
                <h4>Philadelphia 76ers</h4>
                <p>Blue with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Phoenix Suns', 'Phoenix Suns.png', 'Phoenix Suns.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Phoenix Suns.png')} alt="Phoenix Suns Jersey" />
                </div>
                <h4>Phoenix Suns</h4>
                <p>Purple with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Portland Trail Blazers', 'Portland Trail Blazers.jpg', 'Portland Trail Blazers.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Portland Trail Blazers.jpg')} alt="Portland Trail Blazers Jersey" />
                </div>
                <h4>Portland Trail Blazers</h4>
                <p>Red with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Sacramento Kings', 'Sacramento Kings.png', 'Sacramento Kings.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Sacramento Kings.png')} alt="Sacramento Kings Jersey" />
                </div>
                <h4>Sacramento Kings</h4>
                <p>Purple with Silver Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('San Antonio Spurs', 'San Antonio Spurs.png', 'San Antonio Spurs.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('San Antonio Spurs.png')} alt="San Antonio Spurs Jersey" />
                </div>
                <h4>San Antonio Spurs</h4>
                <p>Black with Silver Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Toronto Raptors', 'Toronto Raptors.jpg', 'Toronto Raptors.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Toronto Raptors.jpg')} alt="Toronto Raptors Jersey" />
                </div>
                <h4>Toronto Raptors</h4>
                <p>Red with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Utah Jazz', 'Utah Jazz.png', 'Utah Jazz.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Utah Jazz.png')} alt="Utah Jazz Jersey" />
                </div>
                <h4>Utah Jazz</h4>
                <p>Navy with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Washington Wizards', 'Washington Wizards.png', 'Washington Wizards.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Washington Wizards.png')} alt="Washington Wizards Jersey" />
                </div>
                <h4>Washington Wizards</h4>
                <p>Blue with Red Details</p>
              </div>
            </div>
          </div>
          
          {/* MLB Teams Section */}
          <div id="mlb" className="tournament-section">
            <h3 className="tournament-title">⚾ MLB Teams</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('Arizona Diamondbacks', 'Arizona Diamondbacks.png', 'Arizona Diamondbacks.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Arizona Diamondbacks.png')} alt="Arizona Diamondbacks Jersey" />
                </div>
                <h4>Arizona Diamondbacks</h4>
                <p>Black with Teal Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Atlanta Braves', 'Atlanta Braves.jpg', 'Atlanta Braves.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Atlanta Braves.jpg')} alt="Atlanta Braves Jersey" />
                </div>
                <h4>Atlanta Braves</h4>
                <p>White with Red & Navy</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Baltimore Orioles', 'Baltimore Orioles.png', 'Baltimore Orioles.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Baltimore Orioles.png')} alt="Baltimore Orioles Jersey" />
                </div>
                <h4>Baltimore Orioles</h4>
                <p>Black with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Boston Red Sox', 'Boston Red Sox.png', 'Boston Red Sox.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Boston Red Sox.png')} alt="Boston Red Sox Jersey" />
                </div>
                <h4>Boston Red Sox</h4>
                <p>Green with White & Gold</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Chicago Cubs', 'Chicago Cubs.png', 'Chicago Cubs.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Chicago Cubs.png')} alt="Chicago Cubs Jersey" />
                </div>
                <h4>Chicago Cubs</h4>
                <p>Navy with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Chicago White Sox', 'Chicago White Sox.png', 'Chicago White Sox.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Chicago White Sox.png')} alt="Chicago White Sox Jersey" />
                </div>
                <h4>Chicago White Sox</h4>
                <p>Black with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cincinnati Reds', 'Cincinnati Reds.png', 'Cincinnati Reds.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Cincinnati Reds.png')} alt="Cincinnati Reds Jersey" />
                </div>
                <h4>Cincinnati Reds</h4>
                <p>White with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cleveland Guardians', 'Cleveland Guardians.jpg', 'Cleveland Guardians.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Cleveland Guardians.jpg')} alt="Cleveland Guardians Jersey" />
                </div>
                <h4>Cleveland Guardians</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Colorado Rockies', 'Colorado Rockies.jpg', 'Colorado Rockies.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Colorado Rockies.jpg')} alt="Colorado Rockies Jersey" />
                </div>
                <h4>Colorado Rockies</h4>
                <p>Blue & Purple Design</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Detroit Tigers', 'Detroit Tigers.png', 'Detroit Tigers.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Detroit Tigers.png')} alt="Detroit Tigers Jersey" />
                </div>
                <h4>Detroit Tigers</h4>
              <p>White with Black Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Houston Astros', 'Houston Astros.jpg', 'Houston Astros.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Houston Astros.jpg')} alt="Houston Astros Jersey" />
              </div>
                <h4>Houston Astros</h4>
                <p>Navy with Orange Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Kansas City Royals', 'Kansas City Royals.png', 'Kansas City Royals.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Kansas City Royals.png')} alt="Kansas City Royals Jersey" />
              </div>
                <h4>Kansas City Royals</h4>
                <p>Blue with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Los Angeles Angels', 'Los Angeles Angels.png', 'Los Angeles Angels.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Los Angeles Angels.png')} alt="Los Angeles Angels Jersey" />
              </div>
                <h4>Los Angeles Angels</h4>
                <p>White with Red Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Los Angeles Dodgers', 'Los Angeles Dodgers.png', 'Los Angeles Dodgers.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Los Angeles Dodgers.png')} alt="Los Angeles Dodgers Jersey" />
              </div>
                <h4>Los Angeles Dodgers</h4>
                <p>White with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Miami Marlins', 'Miami Marlins.png', 'Miami Marlins.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Miami Marlins.png')} alt="Miami Marlins Jersey" />
                </div>
                <h4>Miami Marlins</h4>
                <p>White with Black & Blue</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Milwaukee Brewers', 'Milwaukee Brewers.png', 'Milwaukee Brewers.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Milwaukee Brewers.png')} alt="Milwaukee Brewers Jersey" />
                </div>
                <h4>Milwaukee Brewers</h4>
                <p>Blue with Yellow Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Minnesota Twins', 'Minnesota Twins.png', 'Minnesota Twins.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Minnesota Twins.png')} alt="Minnesota Twins Jersey" />
                </div>
                <h4>Minnesota Twins</h4>
                <p>Grey with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New York Mets', 'New York Mets.png', 'New York Mets.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('New York Mets.png')} alt="New York Mets Jersey" />
                </div>
                <h4>New York Mets</h4>
                <p>Grey with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('New York Yankees', 'New York Yankees.png', 'New York Yankees.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('New York Yankees.png')} alt="New York Yankees Jersey" />
                </div>
                <h4>New York Yankees</h4>
                <p>White with Navy Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Oakland Athletics', 'Oakland Athletics.png', 'Oakland Athletics.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Oakland Athletics.png')} alt="Oakland Athletics Jersey" />
                </div>
                <h4>Oakland Athletics</h4>
                <p>Green with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Philadelphia Phillies', 'Philadelphia Phillies.png', 'Philadelphia Phillies.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Philadelphia Phillies.png')} alt="Philadelphia Phillies Jersey" />
                </div>
                <h4>Philadelphia Phillies</h4>
              <p>Red with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Pittsburgh Pirates', 'Pittsburgh Pirates.png', 'Pittsburgh Pirates.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Pittsburgh Pirates.png')} alt="Pittsburgh Pirates Jersey" />
              </div>
                <h4>Pittsburgh Pirates</h4>
                <p>Black with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('San Diego Padres', 'San Diego Padres.png', 'San Diego Padres.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('San Diego Padres.png')} alt="San Diego Padres Jersey" />
              </div>
                <h4>San Diego Padres</h4>
                <p>Brown with Gold Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('San Francisco Giants', 'San Francisco Giants.png', 'San Francisco Giants.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('San Francisco Giants.png')} alt="San Francisco Giants Jersey" />
              </div>
                <h4>San Francisco Giants</h4>
                <p>Cream with Orange Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Seattle Mariners', 'Seattle Mariners.png', 'Seattle Mariners.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Seattle Mariners.png')} alt="Seattle Mariners Jersey" />
              </div>
                <h4>Seattle Mariners</h4>
                <p>Blue with Yellow Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('St. Louis Cardinals', 'St. Louis Cardinals.jpg', 'St. Louis Cardinals.jpg')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('St. Louis Cardinals.jpg')} alt="St. Louis Cardinals Jersey" />
              </div>
                <h4>St. Louis Cardinals</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Tampa Bay Rays', 'Tampa Bay Rays.png', 'Tampa Bay Rays.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Tampa Bay Rays.png')} alt="Tampa Bay Rays Jersey" />
                </div>
                <h4>Tampa Bay Rays</h4>
                <p>Grey with Neon Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Texas Rangers', 'Texas Rangers.png', 'Texas Rangers.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Texas Rangers.png')} alt="Texas Rangers Jersey" />
                </div>
                <h4>Texas Rangers</h4>
                <p>White with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Toronto Blue Jays', 'Toronto Blue Jays.png', 'Toronto Blue Jays.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Toronto Blue Jays.png')} alt="Toronto Blue Jays Jersey" />
                </div>
                <h4>Toronto Blue Jays</h4>
                <p>Blue with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Washington Nationals', 'Washington Nationals.png', 'Washington Nationals.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Washington Nationals.png')} alt="Washington Nationals Jersey" />
                </div>
                <h4>Washington Nationals</h4>
                <p>White with Red Details</p>
              </div>
            </div>
          </div>
          
          {/* Germany Clubs Section */}
          <div id="germany" className="tournament-section">
            <h3 className="tournament-title">🇩🇪 Germany Clubs</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('Bayer Leverkusen', 'Bayer Leverkusen.jpg', 'Bayer Leverkusen.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Bayer Leverkusen.jpg')} alt="Bayer Leverkusen Jersey" />
                </div>
                <h4>Bayer Leverkusen</h4>
                <p>Red with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Bayern Munich', 'Bayern Munich.jpg', 'Bayern Munich.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Bayern Munich.jpg')} alt="Bayern Munich Jersey" />
                </div>
                <h4>Bayern Munich</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Borussia Dortmund', 'Borussia Dortmund.jpg', 'Borussia Dortmund.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Borussia Dortmund.jpg')} alt="Borussia Dortmund Jersey" />
                </div>
                <h4>Borussia Dortmund</h4>
                <p>Yellow with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Borussia Mönchengladbach', 'Borussia Mönchengladbach.jpg', 'Borussia Mönchengladbach.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Borussia Mönchengladbach.jpg')} alt="Borussia Mönchengladbach Jersey" />
                </div>
                <h4>Borussia Mönchengladbach</h4>
                <p>White with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Eintracht Frankfurt', 'Eintracht Frankfurt.jpg', 'Eintracht Frankfurt.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Eintracht Frankfurt.jpg')} alt="Eintracht Frankfurt Jersey" />
                </div>
                <h4>Eintracht Frankfurt</h4>
                <p>Black & Red Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Augsburg', 'FC Augsburg.jpg', 'FC Augsburg.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('FC Augsburg.jpg')} alt="FC Augsburg Jersey" />
                </div>
                <h4>FC Augsburg</h4>
                <p>White with Red & Green</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Köln', '/jerseys/FC Köln.jpg', '/jerseys/FC Köln.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('FC Köln.jpg')} alt="FC Köln Jersey" />
                </div>
                <h4>FC Köln</h4>
                <p>White & Red Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Fortuna Düsseldorf', '/jerseys/Fortuna Düsseldorf.jpg', '/jerseys/Fortuna Düsseldorf.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Fortuna Düsseldorf.jpg')} alt="Fortuna Düsseldorf Jersey" />
                </div>
                <h4>Fortuna Düsseldorf</h4>
                <p>Red with White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FSV Mainz 05', 'FSV Mainz 05.jpg', 'FSV Mainz 05.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('FSV Mainz 05.jpg')} alt="FSV Mainz 05 Jersey" />
                </div>
                <h4>FSV Mainz 05</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Hamburger SV', '/jerseys/Hamburger SV.jpg', '/jerseys/Hamburger SV.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Hamburger SV.jpg')} alt="Hamburger SV Jersey" />
                </div>
                <h4>Hamburger SV</h4>
                <p>White with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Hannover 96', '/jerseys/Hannover 96.jpg', '/jerseys/Hannover 96.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Hannover 96.jpg')} alt="Hannover 96 Jersey" />
                </div>
                <h4>Hannover 96</h4>
                <p>Red & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Hertha BSC', 'Hertha BSC.jpg', 'Hertha BSC.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Hertha BSC.jpg')} alt="Hertha BSC Jersey" />
                </div>
                <h4>Hertha BSC</h4>
              <p>Blue & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('RB Leipzig', 'RB Leipzig.jpg', 'RB Leipzig.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('RB Leipzig.jpg')} alt="RB Leipzig Jersey" />
              </div>
                <h4>RB Leipzig</h4>
                <p>White with Red Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('SC Freiburg', 'SC Freiburg.jpg', 'SC Freiburg.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('SC Freiburg.jpg')} alt="SC Freiburg Jersey" />
              </div>
                <h4>SC Freiburg</h4>
                <p>White & Red Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Union Berlin', 'Union Berlin.jpg', 'Union Berlin.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Union Berlin.jpg')} alt="Union Berlin Jersey" />
              </div>
                <h4>Union Berlin</h4>
              <p>Red & White Stripes</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('VfB Stuttgart', 'VfB Stuttgart.jpg', 'VfB Stuttgart.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('VfB Stuttgart.jpg')} alt="VfB Stuttgart Jersey" />
              </div>
                <h4>VfB Stuttgart</h4>
                <p>White with Red Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('VfL Bochum', 'VfL Bochum.jpg', 'VfL Bochum.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('VfL Bochum.jpg')} alt="VfL Bochum Jersey" />
              </div>
                <h4>VfL Bochum</h4>
                <p>Blue with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('VfL Wolfsburg', 'VfL Wolfsburg.jpg', 'VfL Wolfsburg.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('VfL Wolfsburg.jpg')} alt="VfL Wolfsburg Jersey" />
              </div>
                <h4>VfL Wolfsburg</h4>
                <p>Green with White Details</p>
            </div>
            
              <div className="jersey-card" onClick={() => selectJersey('Werder Bremen', 'Werder Bremen.jpg', 'Werder Bremen.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('Werder Bremen.jpg')} alt="Werder Bremen Jersey" />
              </div>
                <h4>Werder Bremen</h4>
                <p>Green with White Stripes</p>
              </div>
            </div>
            </div>
            
          {/* France Clubs Section */}
          <div id="france" className="tournament-section">
            <h3 className="tournament-title">🇫🇷 France Clubs</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('AJ Auxerre', 'AJ Auxerre.jpg', 'AJ Auxerre.png')}>
              <div className="jersey-image">
                  <img src={getJerseyImageUrl('AJ Auxerre.jpg')} alt="AJ Auxerre Jersey" />
              </div>
                <h4>AJ Auxerre</h4>
                <p>White with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Angers SCO', 'Angers SCO.jpg', 'Angers SCO.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Angers SCO.jpg')} alt="Angers SCO Jersey" />
                </div>
                <h4>Angers SCO</h4>
                <p>Black & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('AS Monaco', 'AS Monaco.jpg', 'AS Monaco.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('AS Monaco.jpg')} alt="AS Monaco Jersey" />
                </div>
                <h4>AS Monaco</h4>
                <p>Red & White Diagonal</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('ESTAC Troyes', 'ESTAC Troyes.jpg', 'ESTAC Troyes.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('ESTAC Troyes.jpg')} alt="ESTAC Troyes Jersey" />
                </div>
                <h4>ESTAC Troyes</h4>
                <p>Blue with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Metz', 'FC Metz.jpg', 'FC Metz.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('FC Metz.jpg')} alt="FC Metz Jersey" />
                </div>
                <h4>FC Metz</h4>
                <p>Maroon with Orange Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Nantes', 'FC Nantes.jpg', 'FC Nantes.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('FC Nantes.jpg')} alt="FC Nantes Jersey" />
                </div>
                <h4>FC Nantes</h4>
                <p>Yellow with Green Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Montpellier HSC', 'Montpellier HSC.jpg', 'Montpellier HSC.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Montpellier HSC.jpg')} alt="Montpellier HSC Jersey" />
                </div>
                <h4>Montpellier HSC</h4>
                <p>Navy Blue with Orange</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('OGC Nice', 'OGC Nice.jpg', 'OGC Nice.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('OGC Nice.jpg')} alt="OGC Nice Jersey" />
                </div>
                <h4>OGC Nice</h4>
                <p>Red & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Olympique Lyonnais', 'Olympique Lyonnais (Lyon).jpg', 'Olympique Lyonnais.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Olympique Lyonnais (Lyon).jpg')} alt="Olympique Lyonnais Jersey" />
                </div>
                <h4>Olympique Lyonnais</h4>
                <p>White with Red & Blue</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Paris Saint-Germain', 'Paris Saint-Germain (PSG).jpg', 'Paris Saint-Germain (PSG).png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Paris Saint-Germain (PSG).jpg')} alt="Paris Saint-Germain Jersey" />
                </div>
                <h4>Paris Saint-Germain</h4>
                <p>Navy Blue with Red</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('RC Lens', 'RC Lens.jpg', 'RC Lens.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('RC Lens.jpg')} alt="RC Lens Jersey" />
                </div>
                <h4>RC Lens</h4>
                <p>Yellow with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('RC Strasbourg Alsace', 'RC Strasbourg Alsace.jpg', 'RC Strasbourg Alsace.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('RC Strasbourg Alsace.jpg')} alt="RC Strasbourg Alsace Jersey" />
                </div>
                <h4>RC Strasbourg Alsace</h4>
                <p>Blue with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Stade Brestois', 'Stade Brestois (Brest).jpg', 'Stade Brestois.jpeg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Stade Brestois (Brest).jpg')} alt="Stade Brestois Jersey" />
                </div>
                <h4>Stade Brestois</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Stade de Reims', 'Stade de Reims.jpg', 'Stade de Reims.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Stade de Reims.jpg')} alt="Stade de Reims Jersey" />
                </div>
                <h4>Stade de Reims</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Stade Rennais', 'Stade Rennais (Rennes).jpg', 'Stade Rennais.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Stade Rennais (Rennes).jpg')} alt="Stade Rennais Jersey" />
                </div>
                <h4>Stade Rennais</h4>
                <p>Red with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Toulouse FC', 'Toulouse FC.jpg', 'Toulouse FC.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Toulouse FC.jpg')} alt="Toulouse FC Jersey" />
                </div>
                <h4>Toulouse FC</h4>
                <p>White & Purple Split</p>
              </div>
            </div>
          </div>
          
          {/* Italy Clubs Section */}
          <div id="italy" className="tournament-section">
            <h3 className="tournament-title">🇮🇹 Italy Clubs</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('AC Milan', 'AC Milan.jpg', 'AC Milan.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('AC Milan.jpg')} alt="AC Milan Jersey" />
                </div>
                <h4>AC Milan</h4>
                <p>Red & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('AS Roma', 'AS Roma.jpg', 'AS Roma.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('AS Roma.jpg')} alt="AS Roma Jersey" />
                </div>
                <h4>AS Roma</h4>
                <p>Maroon with Gold Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Atalanta', 'Atalanta.jpg', 'Atalanta.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Atalanta.jpg')} alt="Atalanta Jersey" />
                </div>
                <h4>Atalanta</h4>
                <p>Blue & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Bologna', 'Bologna.jpg', 'Bologna.jpeg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Bologna.jpg')} alt="Bologna Jersey" />
                </div>
                <h4>Bologna</h4>
                <p>Red & Blue Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cremonese', '/jerseys/Cremonese.jpg', '/jerseys/Cremonese.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Cremonese.jpg')} alt="Cremonese Jersey" />
                </div>
                <h4>Cremonese</h4>
                <p>Grey & Red Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Empoli', 'Empoli.jpg', 'Empoli.jpeg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Empoli.jpg')} alt="Empoli Jersey" />
                </div>
                <h4>Empoli</h4>
                <p>Blue with Wavy Pattern</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Fiorentina', 'Fiorentina.jpg', 'Fiorentina.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Fiorentina.jpg')} alt="Fiorentina Jersey" />
                </div>
                <h4>Fiorentina</h4>
                <p>Purple with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Hellas Verona', 'Hellas Verona.jpg', 'Hellas Verona.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Hellas Verona.jpg')} alt="Hellas Verona Jersey" />
                </div>
                <h4>Hellas Verona</h4>
                <p>Blue with Yellow Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Inter Milan', 'Inter Milan (Internazionale).jpg', 'Inter Milan.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Inter Milan (Internazionale).jpg')} alt="Inter Milan Jersey" />
                </div>
                <h4>Inter Milan</h4>
                <p>Black & Blue Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Juventus', 'Juventus.jpg', 'Juventus.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Juventus.jpg')} alt="Juventus Jersey" />
                </div>
                <h4>Juventus</h4>
                <p>Black & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Lazio', 'Lazio.jpg', 'Lazio.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Lazio.jpg')} alt="Lazio Jersey" />
                </div>
                <h4>Lazio</h4>
                <p>Light Blue with White</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Lecce', 'Lecce.jpg', 'Lecce.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Lecce.jpg')} alt="Lecce Jersey" />
                </div>
                <h4>Lecce</h4>
                <p>Yellow with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Monza', 'Monza.jpg', 'Monza.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Monza.jpg')} alt="Monza Jersey" />
                </div>
                <h4>Monza</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('SSC Napoli', 'SSC Napoli.jpg', 'SSC Napoli.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('SSC Napoli.jpg')} alt="SSC Napoli Jersey" />
                </div>
                <h4>SSC Napoli</h4>
                <p>Light Blue with White</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Salernitana', 'Salernitana.jpg', 'Salernitana.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Salernitana.jpg')} alt="Salernitana Jersey" />
                </div>
                <h4>Salernitana</h4>
                <p>Maroon with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Sampdoria', 'Sampdoria.jpg', 'Sampdoria.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Sampdoria.jpg')} alt="Sampdoria Jersey" />
                </div>
                <h4>Sampdoria</h4>
                <p>Blue with White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Sassuolo', 'Sassuolo.jpg', 'Sassuolo.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Sassuolo.jpg')} alt="Sassuolo Jersey" />
                </div>
                <h4>Sassuolo</h4>
                <p>Green & Black Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Spezia', 'Spezia.jpg', 'Spezia.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Spezia.jpg')} alt="Spezia Jersey" />
                </div>
                <h4>Spezia</h4>
                <p>White with Black Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Torino', 'Torino.jpg', 'Torino.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Torino.jpg')} alt="Torino Jersey" />
                </div>
                <h4>Torino</h4>
                <p>Maroon with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Udinese', 'Udinese.jpg', 'Udinese.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Udinese.jpg')} alt="Udinese Jersey" />
                </div>
                <h4>Udinese</h4>
                <p>Black & White Stripes</p>
              </div>
            </div>
          </div>
          
          {/* Holland Clubs Section */}
          <div id="holland" className="tournament-section">
            <h3 className="tournament-title">🇳🇱 Holland Clubs</h3>
            <div className="jersey-grid">
              <div className="jersey-card" onClick={() => selectJersey('ADO Den Haag', 'ADO Den Haag.jpg', 'ADO Den Haag.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('ADO Den Haag.jpg')} alt="ADO Den Haag Jersey" />
                </div>
                <h4>ADO Den Haag</h4>
                <p>Yellow & Green Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('AZ Alkmaar', 'AZ Alkmaar.jpg', 'AZ Alkmaar.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('AZ Alkmaar.jpg')} alt="AZ Alkmaar Jersey" />
                </div>
                <h4>AZ Alkmaar</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Cambuur', 'Cambuur.jpg', 'Cambuur.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Cambuur.jpg')} alt="Cambuur Jersey" />
                </div>
                <h4>Cambuur</h4>
                <p>Yellow with Blue Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Excelsior', 'Excelsior.jpg', 'Excelsior.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Excelsior.jpg')} alt="Excelsior Jersey" />
                </div>
                <h4>Excelsior</h4>
                <p>Black with Red Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Groningen', 'FC Groningen.jpg', 'FC Groningen.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('FC Groningen.jpg')} alt="FC Groningen Jersey" />
                </div>
                <h4>FC Groningen</h4>
                <p>White & Green Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Twente', 'FC Twente.jpg', 'FC Twente.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('FC Twente.jpg')} alt="FC Twente Jersey" />
                </div>
                <h4>FC Twente</h4>
                <p>Red with White Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('FC Utrecht', 'FC Utrecht.jpg', 'FC Utrecht.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('FC Utrecht.jpg')} alt="FC Utrecht Jersey" />
                </div>
                <h4>FC Utrecht</h4>
                <p>White & Red Split</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Feyenoord', 'Feyenoord.jpg', 'Feyenoord.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Feyenoord.jpg')} alt="Feyenoord Jersey" />
                </div>
                <h4>Feyenoord</h4>
                <p>Red & White Split</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Fortuna Sittard', 'Fortuna Sittard.jpg', 'Fortuna Sittard.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Fortuna Sittard.jpg')} alt="Fortuna Sittard Jersey" />
                </div>
                <h4>Fortuna Sittard</h4>
                <p>Yellow with Green Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Heracles Almelo', 'Heracles Almelo.jpg', 'Heracles Almelo.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Heracles Almelo.jpg')} alt="Heracles Almelo Jersey" />
                </div>
                <h4>Heracles Almelo</h4>
                <p>Black & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('NEC Nijmegen', 'NEC Nijmegen.jpg', 'NEC Nijmegen.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('NEC Nijmegen.jpg')} alt="NEC Nijmegen Jersey" />
                </div>
                <h4>NEC Nijmegen</h4>
                <p>Grey & Red Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('PEC Zwolle', 'PEC Zwolle.jpg', 'PEC Zwolle.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('PEC Zwolle.jpg')} alt="PEC Zwolle Jersey" />
                </div>
                <h4>PEC Zwolle</h4>
                <p>Blue & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('RKC Waalwijk', 'RKC Waalwijk.jpg', 'RKC Waalwijk.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('RKC Waalwijk.jpg')} alt="RKC Waalwijk Jersey" />
                </div>
                <h4>RKC Waalwijk</h4>
                <p>Blue with Yellow Details</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('SC Heerenveen', 'SC Heerenveen.jpg', 'SC Heerenveen.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('SC Heerenveen.jpg')} alt="SC Heerenveen Jersey" />
                </div>
                <h4>SC Heerenveen</h4>
                <p>White & Blue Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Sparta Rotterdam', '/jerseys/Sparta Rotterdam.jpg', '/jerseys/Sparta Rotterdam.jpg')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Sparta Rotterdam.jpg')} alt="Sparta Rotterdam Jersey" />
                </div>
                <h4>Sparta Rotterdam</h4>
                <p>Red & White Stripes</p>
              </div>
              
              <div className="jersey-card" onClick={() => selectJersey('Vitesse', 'Vitesse.jpg', 'Vitesse.png')}>
                <div className="jersey-image">
                  <img src={getJerseyImageUrl('Vitesse.jpg')} alt="Vitesse Jersey" />
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