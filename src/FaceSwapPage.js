import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import * as faceapi from 'face-api.js';
import './FaceSwapPage.css';

const FaceSwapPage = () => {
  // State management
  const [faceImage, setFaceImage] = useState(null);
  const [jerseyImage, setJerseyImage] = useState(null);
  const [croppedFace, setCroppedFace] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  // Canvas and image refs
  const stageRef = useRef();
  const transformerRef = useRef();
  const faceImageRef = useRef();
  const jerseyImageRef = useRef();
  const croppedFaceRef = useRef();
  
  // Face positioning state
  const [facePosition, setFacePosition] = useState({ x: 100, y: 100 });
  const [faceScale, setFaceScale] = useState({ x: 1, y: 1 });
  const [faceRotation, setFaceRotation] = useState(0);
  const [selectedFaceId, setSelectedFaceId] = useState(null);
  
  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsProcessing(true);
        setError(null);
        console.log('Starting to load face-api.js models...');
        
        // Load the models from GitHub CDN (more reliable)
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
          faceapi.nets.faceExpressionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights')
        ]);
        
        setModelsLoaded(true);
        console.log('Face-api.js models loaded successfully');
        setError(null);
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
        setError(`Failed to load face detection models: ${error.message}. Please refresh the page.`);
        setModelsLoaded(false);
      } finally {
        setIsProcessing(false);
      }
    };

    loadModels();
  }, []);

  // Handle face image upload
  const handleFaceImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        setFaceImage(img);
        setError(null);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle jersey image upload
  const handleJerseyImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        setJerseyImage(img);
        setError(null);
        // Adjust canvas size to match jersey image
        setCanvasSize({
          width: Math.min(img.width, 800),
          height: Math.min(img.height, 600)
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  // Detect and crop face from uploaded image
  const detectAndCropFace = useCallback(async () => {
    if (!faceImage || !modelsLoaded) {
      setError('Please upload a face image and wait for models to load');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Create a canvas to work with the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = faceImage.width;
      canvas.height = faceImage.height;
      ctx.drawImage(faceImage, 0, 0);

      // Detect faces
      const detections = await faceapi
        .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detections.length === 0) {
        setError('No face detected in the image. Please try a different photo.');
        return;
      }

      // Get the largest face (most likely the main subject)
      const largestFace = detections.reduce((prev, current) => {
        return (prev.detection.box.width * prev.detection.box.height > 
                current.detection.box.width * current.detection.box.height) ? prev : current;
      });

      const box = largestFace.detection.box;
      
      // Add some padding around the face
      const padding = 50;
      const x = Math.max(0, box.x - padding);
      const y = Math.max(0, box.y - padding);
      const width = Math.min(canvas.width - x, box.width + (padding * 2));
      const height = Math.min(canvas.height - y, box.height + (padding * 2));

      // Create cropped face image
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');
      croppedCanvas.width = width;
      croppedCanvas.height = height;
      
      croppedCtx.drawImage(
        canvas,
        x, y, width, height,
        0, 0, width, height
      );

      // Convert to image
      const croppedImg = new window.Image();
      croppedImg.onload = () => {
        setCroppedFace(croppedImg);
        // Reset face position to center of jersey
        setFacePosition({ 
          x: canvasSize.width / 2 - width / 2, 
          y: canvasSize.height / 2 - height / 2 
        });
        setFaceScale({ x: 1, y: 1 });
        setFaceRotation(0);
      };
      croppedImg.src = croppedCanvas.toDataURL();

    } catch (error) {
      console.error('Error detecting face:', error);
      setError('Failed to detect face. Please try a different image.');
    } finally {
      setIsProcessing(false);
    }
  }, [faceImage, modelsLoaded, canvasSize]);

  // Handle face selection for transformation
  const handleFaceSelect = useCallback((e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedFaceId(null);
      return;
    }

    const clickedOnFace = e.target.getParent().className === 'face-layer';
    if (clickedOnFace) {
      setSelectedFaceId('face');
    }
  }, []);

  // Update transformer when face is selected
  useEffect(() => {
    if (selectedFaceId && transformerRef.current && croppedFaceRef.current) {
      transformerRef.current.nodes([croppedFaceRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedFaceId]);

  // Handle face transformation
  const handleFaceTransform = useCallback(() => {
    if (croppedFaceRef.current) {
      const node = croppedFaceRef.current;
      setFacePosition({ x: node.x(), y: node.y() });
      setFaceScale({ x: node.scaleX(), y: node.scaleY() });
      setFaceRotation(node.rotation());
    }
  }, []);

  // Export final image
  const exportImage = useCallback(() => {
    if (!stageRef.current || !jerseyImage || !croppedFace) {
      setError('Please upload both images and position the face');
      return;
    }

    try {
      const dataURL = stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 2
      });

      // Create download link
      const link = document.createElement('a');
      link.download = 'face-swap-result.png';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting image:', error);
      setError('Failed to export image. Please try again.');
    }
  }, [jerseyImage, croppedFace]);

  // Reset all images
  const resetImages = useCallback(() => {
    setFaceImage(null);
    setJerseyImage(null);
    setCroppedFace(null);
    setFacePosition({ x: 100, y: 100 });
    setFaceScale({ x: 1, y: 1 });
    setFaceRotation(0);
    setSelectedFaceId(null);
    setError(null);
  }, []);

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem 0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const contentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '3rem',
    color: 'white'
  };

  const titleStyle = {
    fontSize: '3rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    textShadow: '0 4px 8px rgba(0,0,0,0.3)',
    background: 'linear-gradient(45deg, #fff, #f0f0f0)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const subtitleStyle = {
    fontSize: '1.2rem',
    opacity: 0.9,
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: '1.6'
  };

  const uploadGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem'
  };

  const uploadCardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  };

  const uploadCardHoverStyle = {
    transform: 'translateY(-5px)',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
  };

  const uploadTitleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#2d3748',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const uploadAreaStyle = {
    border: '3px dashed #cbd5e0',
    borderRadius: '15px',
    padding: '2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: '#f8fafc',
    marginBottom: '1rem'
  };

  const uploadAreaHoverStyle = {
    borderColor: '#4299e1',
    background: '#ebf8ff',
    transform: 'scale(1.02)'
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
    width: '100%',
    marginTop: '1rem'
  };

  const buttonHoverStyle = {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
  };

  const buttonDisabledStyle = {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)'
  };

  const canvasCardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    marginBottom: '3rem'
  };

  const canvasTitleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#2d3748',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const canvasContainerStyle = {
    display: 'flex',
    flexDirection: 'row',
    gap: '2rem',
    alignItems: 'flex-start'
  };

  const canvasWrapperStyle = {
    flex: 1,
    border: '2px solid #e2e8f0',
    borderRadius: '15px',
    overflow: 'hidden',
    background: '#f8fafc'
  };

  const controlsStyle = {
    width: '300px',
    background: '#f7fafc',
    borderRadius: '15px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0'
  };

  const controlGroupStyle = {
    marginBottom: '1.5rem'
  };

  const controlLabelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem'
  };

  const controlInputStyle = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem'
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '2rem'
  };

  const exportButtonStyle = {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const resetButtonStyle = {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const statusMessageStyle = {
    padding: '1rem',
    borderRadius: '12px',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const errorStyle = {
    ...statusMessageStyle,
    background: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#991b1b'
  };

  const successStyle = {
    ...statusMessageStyle,
    background: '#d1fae5',
    border: '1px solid #a7f3d0',
    color: '#065f46'
  };

  const loadingStyle = {
    ...statusMessageStyle,
    background: '#dbeafe',
    border: '1px solid #93c5fd',
    color: '#1e40af'
  };

  const instructionsStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)'
  };

  const instructionsTitleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#2d3748',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const instructionsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem'
  };

  const instructionCardStyle = {
    background: '#f8fafc',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  };

  const instructionCardTitleStyle = {
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.75rem',
    fontSize: '1rem'
  };

  const instructionListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0
  };

  const instructionItemStyle = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
    paddingLeft: '1rem',
    position: 'relative'
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            🎯 Advanced Face Swap Studio
          </h1>
           <p style={subtitleStyle}>
             Upload your face photo and jersey image, then position and customize your face with drag-and-drop controls
           </p>
           
           {/* Status Indicator */}
           <div style={{
             marginTop: '1rem',
             padding: '0.75rem 1.5rem',
             borderRadius: '25px',
             background: modelsLoaded ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)',
             border: `1px solid ${modelsLoaded ? '#10b981' : '#f59e0b'}`,
             color: modelsLoaded ? '#065f46' : '#92400e',
             fontSize: '0.875rem',
             fontWeight: '500',
             display: 'inline-block'
           }}>
             {modelsLoaded ? (
               <>
                 <span style={{marginRight: '0.5rem'}}>✅</span>
                 Face Detection Models Ready
               </>
             ) : (
               <>
                 <span style={{marginRight: '0.5rem'}}>⏳</span>
                 Loading Face Detection Models...
               </>
             )}
           </div>
         </div>

        {/* Upload Section */}
        <div style={uploadGridStyle}>
          {/* Face Image Upload */}
          <div style={uploadCardStyle}>
            <h3 style={uploadTitleStyle}>
              <span style={{fontSize: '2rem'}}>👤</span>
              Upload Face Photo
            </h3>
            <div style={uploadAreaStyle}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFaceImageUpload}
                style={{display: 'none'}}
                id="face-upload"
              />
              <label htmlFor="face-upload" style={{cursor: 'pointer', display: 'block'}}>
                {faceImage ? (
                  <div style={{position: 'relative'}}>
                    <img
                      src={faceImage.src}
                      alt="Face"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        margin: '0 auto',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '600'
                    }}>
                      Change Photo
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📷</div>
                    <p style={{color: '#6b7280', margin: '0.5rem 0'}}>Click to upload face photo</p>
                    <p style={{fontSize: '0.875rem', color: '#9ca3af'}}>JPG, PNG, WebP supported</p>
                  </div>
                )}
              </label>
            </div>
            {faceImage && (
              <button
                onClick={detectAndCropFace}
                disabled={isProcessing || !modelsLoaded}
                style={{
                  ...buttonStyle,
                  ...((isProcessing || !modelsLoaded) ? buttonDisabledStyle : {})
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing && modelsLoaded) {
                    Object.assign(e.target.style, buttonHoverStyle);
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isProcessing && modelsLoaded) {
                    e.target.style.transform = 'none';
                    e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                  }
                }}
              >
                {isProcessing ? 'Detecting Face...' : 'Detect & Crop Face'}
              </button>
            )}
          </div>

          {/* Jersey Image Upload */}
          <div style={uploadCardStyle}>
            <h3 style={uploadTitleStyle}>
              <span style={{fontSize: '2rem'}}>👕</span>
              Upload Jersey Image
            </h3>
            <div style={uploadAreaStyle}>
              <input
                type="file"
                accept="image/*"
                onChange={handleJerseyImageUpload}
                style={{display: 'none'}}
                id="jersey-upload"
              />
              <label htmlFor="jersey-upload" style={{cursor: 'pointer', display: 'block'}}>
                {jerseyImage ? (
                  <div style={{position: 'relative'}}>
                    <img
                      src={jerseyImage.src}
                      alt="Jersey"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        margin: '0 auto',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '600'
                    }}>
                      Change Jersey
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{fontSize: '3rem', marginBottom: '1rem'}}>👕</div>
                    <p style={{color: '#6b7280', margin: '0.5rem 0'}}>Click to upload jersey image</p>
                    <p style={{fontSize: '0.875rem', color: '#9ca3af'}}>JPG, PNG, WebP supported</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Canvas Section */}
        {jerseyImage && (
          <div style={canvasCardStyle}>
            <h3 style={canvasTitleStyle}>
              <span style={{fontSize: '2rem'}}>🎨</span>
              Position Your Face
            </h3>
            <div style={canvasContainerStyle}>
              {/* Canvas */}
              <div style={{flex: 1}}>
                <div style={canvasWrapperStyle}>
                  <Stage
                    ref={stageRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onMouseDown={handleFaceSelect}
                    onTouchStart={handleFaceSelect}
                  >
                    <Layer>
                      {/* Jersey Background */}
                      <KonvaImage
                        ref={jerseyImageRef}
                        image={jerseyImage}
                        width={canvasSize.width}
                        height={canvasSize.height}
                      />
                      
                      {/* Cropped Face */}
                      {croppedFace && (
                        <KonvaImage
                          ref={croppedFaceRef}
                          image={croppedFace}
                          x={facePosition.x}
                          y={facePosition.y}
                          scaleX={faceScale.x}
                          scaleY={faceScale.y}
                          rotation={faceRotation}
                          draggable
                          onDragEnd={handleFaceTransform}
                          onTransformEnd={handleFaceTransform}
                          className="face-layer"
                        />
                      )}
                      
                      {/* Transformer */}
                      <Transformer
                        ref={transformerRef}
                        boundBoxFunc={(oldBox, newBox) => {
                          // Limit scaling
                          if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                            return oldBox;
                          }
                          return newBox;
                        }}
                      />
                    </Layer>
                  </Stage>
                </div>
              </div>

              {/* Controls */}
              <div style={controlsStyle}>
                <h4 style={{fontWeight: 'bold', marginBottom: '1rem', color: '#2d3748'}}>Position Controls</h4>
                
                {/* Scale Control */}
                <div style={controlGroupStyle}>
                  <label style={controlLabelStyle}>
                    Scale: {Math.round(faceScale.x * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={faceScale.x}
                    onChange={(e) => {
                      const scale = parseFloat(e.target.value);
                      setFaceScale({ x: scale, y: scale });
                      if (croppedFaceRef.current) {
                        croppedFaceRef.current.scaleX(scale);
                        croppedFaceRef.current.scaleY(scale);
                        croppedFaceRef.current.getLayer().batchDraw();
                      }
                    }}
                    style={{width: '100%'}}
                  />
                </div>

                {/* Rotation Control */}
                <div style={controlGroupStyle}>
                  <label style={controlLabelStyle}>
                    Rotation: {Math.round(faceRotation)}°
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={faceRotation}
                    onChange={(e) => {
                      const rotation = parseFloat(e.target.value);
                      setFaceRotation(rotation);
                      if (croppedFaceRef.current) {
                        croppedFaceRef.current.rotation(rotation);
                        croppedFaceRef.current.getLayer().batchDraw();
                      }
                    }}
                    style={{width: '100%'}}
                  />
                </div>

                {/* Position Controls */}
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem'}}>
                  <div>
                    <label style={controlLabelStyle}>X Position</label>
                    <input
                      type="number"
                      value={Math.round(facePosition.x)}
                      onChange={(e) => {
                        const x = parseInt(e.target.value);
                        setFacePosition(prev => ({ ...prev, x }));
                        if (croppedFaceRef.current) {
                          croppedFaceRef.current.x(x);
                          croppedFaceRef.current.getLayer().batchDraw();
                        }
                      }}
                      style={controlInputStyle}
                    />
                  </div>
                  <div>
                    <label style={controlLabelStyle}>Y Position</label>
                    <input
                      type="number"
                      value={Math.round(facePosition.y)}
                      onChange={(e) => {
                        const y = parseInt(e.target.value);
                        setFacePosition(prev => ({ ...prev, y }));
                        if (croppedFaceRef.current) {
                          croppedFaceRef.current.y(y);
                          croppedFaceRef.current.getLayer().batchDraw();
                        }
                      }}
                      style={controlInputStyle}
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  <button
                    onClick={() => {
                      setFacePosition({ x: canvasSize.width / 2 - 100, y: canvasSize.height / 2 - 100 });
                      setFaceScale({ x: 1, y: 1 });
                      setFaceRotation(0);
                      if (croppedFaceRef.current) {
                        croppedFaceRef.current.x(canvasSize.width / 2 - 100);
                        croppedFaceRef.current.y(canvasSize.height / 2 - 100);
                        croppedFaceRef.current.scaleX(1);
                        croppedFaceRef.current.scaleY(1);
                        croppedFaceRef.current.rotation(0);
                        croppedFaceRef.current.getLayer().batchDraw();
                      }
                    }}
                    style={{
                      ...buttonStyle,
                      fontSize: '0.875rem',
                      padding: '0.75rem 1rem'
                    }}
                  >
                    Reset Position
                  </button>
                  
                  <button
                    onClick={() => {
                      const newScale = faceScale.x * 1.2;
                      setFaceScale({ x: newScale, y: newScale });
                      if (croppedFaceRef.current) {
                        croppedFaceRef.current.scaleX(newScale);
                        croppedFaceRef.current.scaleY(newScale);
                        croppedFaceRef.current.getLayer().batchDraw();
                      }
                    }}
                    style={{
                      ...buttonStyle,
                      fontSize: '0.875rem',
                      padding: '0.75rem 1rem'
                    }}
                  >
                    Zoom In
                  </button>
                  
                  <button
                    onClick={() => {
                      const newScale = Math.max(0.1, faceScale.x * 0.8);
                      setFaceScale({ x: newScale, y: newScale });
                      if (croppedFaceRef.current) {
                        croppedFaceRef.current.scaleX(newScale);
                        croppedFaceRef.current.scaleY(newScale);
                        croppedFaceRef.current.getLayer().batchDraw();
                      }
                    }}
                    style={{
                      ...buttonStyle,
                      fontSize: '0.875rem',
                      padding: '0.75rem 1rem'
                    }}
                  >
                    Zoom Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={actionButtonsStyle}>
          <button
            onClick={exportImage}
            disabled={!jerseyImage || !croppedFace}
            style={{
              ...exportButtonStyle,
              ...((!jerseyImage || !croppedFace) ? buttonDisabledStyle : {})
            }}
            onMouseEnter={(e) => {
              if (jerseyImage && croppedFace) {
                Object.assign(e.target.style, buttonHoverStyle);
              }
            }}
            onMouseLeave={(e) => {
              if (jerseyImage && croppedFace) {
                e.target.style.transform = 'none';
                e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
              }
            }}
          >
            <span style={{fontSize: '1.2rem'}}>💾</span>
            Export Final Image
          </button>
          
          <button
            onClick={resetImages}
            style={resetButtonStyle}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, buttonHoverStyle);
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'none';
              e.target.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
            }}
          >
            <span style={{fontSize: '1.2rem'}}>🔄</span>
            Start Over
          </button>
        </div>

        {/* Status Messages */}
        {!modelsLoaded && (
          <div style={loadingStyle}>
            <div style={{
              width: '1rem',
              height: '1rem',
              border: '2px solid #e5e7eb',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>Loading face detection models...</span>
          </div>
        )}

        {error && (
          <div style={errorStyle}>
            <span style={{fontSize: '1.2rem'}}>❌</span>
            <span>{error}</span>
          </div>
        )}

        {isProcessing && (
          <div style={loadingStyle}>
            <div style={{
              width: '1rem',
              height: '1rem',
              border: '2px solid #e5e7eb',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>Processing...</span>
          </div>
        )}

        {/* Instructions */}
        <div style={instructionsStyle}>
          <h3 style={instructionsTitleStyle}>📋 How to Use</h3>
          <div style={instructionsGridStyle}>
            <div style={instructionCardStyle}>
              <h4 style={instructionCardTitleStyle}>Step 1: Upload Images</h4>
              <ul style={instructionListStyle}>
                <li style={instructionItemStyle}>Upload a clear face photo with good lighting</li>
                <li style={instructionItemStyle}>Upload a jersey or shirt image</li>
                <li style={instructionItemStyle}>Wait for face detection models to load</li>
              </ul>
            </div>
            <div style={instructionCardStyle}>
              <h4 style={instructionCardTitleStyle}>Step 2: Position Face</h4>
              <ul style={instructionListStyle}>
                <li style={instructionItemStyle}>Click "Detect & Crop Face" to automatically crop your face</li>
                <li style={instructionItemStyle}>Drag the face to position it on the jersey</li>
                <li style={instructionItemStyle}>Use the controls to scale and rotate the face</li>
                <li style={instructionItemStyle}>Click the face to show transformation handles</li>
              </ul>
            </div>
            <div style={instructionCardStyle}>
              <h4 style={instructionCardTitleStyle}>Step 3: Fine-tune</h4>
              <ul style={instructionListStyle}>
                <li style={instructionItemStyle}>Use the scale slider to resize the face</li>
                <li style={instructionItemStyle}>Use the rotation slider to adjust angle</li>
                <li style={instructionItemStyle}>Use position inputs for precise placement</li>
                <li style={instructionItemStyle}>Use quick action buttons for common adjustments</li>
              </ul>
            </div>
            <div style={instructionCardStyle}>
              <h4 style={instructionCardTitleStyle}>Step 4: Export</h4>
              <ul style={instructionListStyle}>
                <li style={instructionItemStyle}>Click "Export Final Image" to download</li>
                <li style={instructionItemStyle}>The image will be saved as PNG format</li>
                <li style={instructionItemStyle}>High quality export with 2x pixel ratio</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FaceSwapPage;