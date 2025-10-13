import * as faceapi from 'face-api.js';
import faceDetectionService from './faceDetectionService';

class AdvancedFaceAlignmentService {
  constructor() {
    this.isInitialized = false;
    this.modelsLoaded = false;
  }

  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      console.log('Initializing Advanced Face Alignment Service...');
      
      // Load face-api.js models if not already loaded
      if (!this.modelsLoaded) {
        await this.loadModels();
      }
      
      this.isInitialized = true;
      console.log('Advanced Face Alignment Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Advanced Face Alignment Service:', error);
      return false;
    }
  }

  async loadModels() {
    if (this.modelsLoaded) return true;
    
    try {
      console.log('Loading face-api.js models for advanced alignment...');
      
      // Load all required models for face detection and landmark extraction
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
        faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
        faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
        faceapi.nets.faceExpressionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights')
      ]);
      
      this.modelsLoaded = true;
      console.log('Face-api.js models loaded successfully for advanced alignment');
      return true;
    } catch (error) {
      console.error('Error loading face-api.js models:', error);
      return false;
    }
  }

  async detectFacesWithLandmarks(imageElement) {
    if (!this.modelsLoaded) {
      const loaded = await this.loadModels();
      if (!loaded) {
        throw new Error('Failed to load face detection models');
      }
    }

    try {
      console.log('Detecting faces with landmarks...');
      
      // Detect faces with full landmark information
      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.3  // Lower threshold for better detection
        }))
        .withFaceLandmarks()
        .withFaceExpressions();

      console.log(`Found ${detections.length} face(s) with landmarks`);
      return detections;
    } catch (error) {
      console.error('Error detecting faces with landmarks:', error);
      throw error;
    }
  }

  extractFaceLandmarks(detection) {
    if (!detection.landmarks) {
      throw new Error('No landmarks found in detection');
    }

    const landmarks = detection.landmarks;
    
    // Extract key facial landmarks
    const keyLandmarks = {
      // Eye landmarks
      leftEye: {
        outer: landmarks.getLeftEye()[0],
        inner: landmarks.getLeftEye()[3],
        center: this.getCenterPoint(landmarks.getLeftEye())
      },
      rightEye: {
        outer: landmarks.getRightEye()[0],
        inner: landmarks.getRightEye()[3],
        center: this.getCenterPoint(landmarks.getRightEye())
      },
      
      // Nose landmarks
      nose: {
        tip: landmarks.getNose()[3],
        bridge: landmarks.getNose()[0],
        leftNostril: landmarks.getNose()[1],
        rightNostril: landmarks.getNose()[2]
      },
      
      // Mouth landmarks
      mouth: {
        leftCorner: landmarks.getMouth()[0],
        rightCorner: landmarks.getMouth()[6],
        topLip: landmarks.getMouth()[3],
        bottomLip: landmarks.getMouth()[9],
        center: this.getCenterPoint(landmarks.getMouth())
      },
      
      // Face outline
      jawline: landmarks.getJawOutline(),
      
      // Eyebrows
      leftEyebrow: landmarks.getLeftEyeBrow(),
      rightEyebrow: landmarks.getRightEyeBrow()
    };

    return keyLandmarks;
  }

  getCenterPoint(points) {
    const sumX = points.reduce((sum, point) => sum + point.x, 0);
    const sumY = points.reduce((sum, point) => sum + point.y, 0);
    return {
      x: sumX / points.length,
      y: sumY / points.length
    };
  }

  calculateFaceOrientation(landmarks) {
    // Calculate face orientation based on eye positions
    const leftEyeCenter = landmarks.leftEye.center;
    const rightEyeCenter = landmarks.rightEye.center;
    
    // Calculate angle between eyes
    const eyeAngle = Math.atan2(
      rightEyeCenter.y - leftEyeCenter.y,
      rightEyeCenter.x - leftEyeCenter.x
    );
    
    // Calculate face size based on eye distance
    const eyeDistance = Math.sqrt(
      Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) +
      Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2)
    );
    
    // Calculate face center
    const faceCenter = {
      x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
      y: (leftEyeCenter.y + rightEyeCenter.y) / 2
    };
    
    return {
      angle: eyeAngle,
      eyeDistance: eyeDistance,
      faceCenter: faceCenter,
      rotation: eyeAngle * (180 / Math.PI) // Convert to degrees
    };
  }

  async alignFaceToTarget(sourceImageElement, targetImageElement, sourceDetection, targetDetection) {
    try {
      console.log('Aligning face to target...');
      
      // Extract landmarks from both faces
      const sourceLandmarks = this.extractFaceLandmarks(sourceDetection);
      const targetLandmarks = this.extractFaceLandmarks(targetDetection);
      
      // Calculate face orientations
      const sourceOrientation = this.calculateFaceOrientation(sourceLandmarks);
      const targetOrientation = this.calculateFaceOrientation(targetLandmarks);
      
      // Calculate transformation parameters
      const scale = targetOrientation.eyeDistance / sourceOrientation.eyeDistance;
      const rotation = targetOrientation.angle - sourceOrientation.angle;
      
      // Create aligned face
      const alignedFace = await this.transformFace(
        sourceImageElement,
        sourceDetection,
        targetDetection,
        scale,
        rotation,
        targetOrientation.faceCenter,
        sourceOrientation.faceCenter
      );
      
      return alignedFace;
    } catch (error) {
      console.error('Error aligning face to target:', error);
      throw error;
    }
  }

  async transformFace(sourceImage, sourceDetection, targetDetection, scale, rotation, targetCenter, sourceCenter) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match target face size
        const targetBox = targetDetection.detection ? targetDetection.detection.box : targetDetection.box;
        canvas.width = targetBox.width * 1.5; // Add padding
        canvas.height = targetBox.height * 1.5;
        
        // Calculate source face region
        const sourceBox = sourceDetection.detection ? sourceDetection.detection.box : sourceDetection.box;
        const sourceX = Math.max(0, sourceBox.x - sourceBox.width * 0.2);
        const sourceY = Math.max(0, sourceBox.y - sourceBox.height * 0.2);
        const sourceWidth = sourceBox.width * 1.4;
        const sourceHeight = sourceBox.height * 1.4;
        
        // Save context state
        ctx.save();
        
        // Move to center of canvas
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Apply rotation
        ctx.rotate(rotation);
        
        // Apply scaling
        ctx.scale(scale, scale);
        
        // Move back to account for source center offset
        ctx.translate(-sourceCenter.x + sourceX, -sourceCenter.y + sourceY);
        
        // Enable high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw the transformed face
        ctx.drawImage(
          sourceImage,
          sourceX, sourceY, sourceWidth, sourceHeight,
          -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height
        );
        
        // Restore context state
        ctx.restore();
        
        // Apply background removal and edge smoothing
        this.removeBackgroundAndSmoothEdges(ctx, canvas.width, canvas.height);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error('Failed to create aligned face blob'));
          }
        }, 'image/png');
        
      } catch (error) {
        console.error('Error transforming face:', error);
        reject(error);
      }
    });
  }

  removeBackgroundAndSmoothEdges(ctx, width, height) {
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Sample background color from edges
    const edgeSamples = [];
    for (let i = 0; i < width; i += 5) {
      edgeSamples.push([i, 0], [i, height-1]);
    }
    for (let i = 0; i < height; i += 5) {
      edgeSamples.push([0, i], [width-1, i]);
    }
    
    let avgR = 0, avgG = 0, avgB = 0;
    for (const [x, y] of edgeSamples) {
      const index = (y * width + x) * 4;
      avgR += data[index];
      avgG += data[index + 1];
      avgB += data[index + 2];
    }
    avgR /= edgeSamples.length;
    avgG /= edgeSamples.length;
    avgB /= edgeSamples.length;
    
    // Remove background and smooth edges
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;
    
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate distance from background color
      const colorDistance = Math.sqrt(
        Math.pow(r - avgR, 2) + 
        Math.pow(g - avgG, 2) + 
        Math.pow(b - avgB, 2)
      );
      
      // Calculate distance from center
      const centerDistance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      // Remove background pixels
      if (colorDistance < 80) {
        data[i + 3] = 0;
      } else if (colorDistance < 120) {
        data[i + 3] = Math.floor(data[i + 3] * 0.3);
      }
      
      // Smooth edges with circular mask
      if (centerDistance > radius * 0.8) {
        const edgeAlpha = Math.max(0, 1 - (centerDistance - radius * 0.8) / (radius * 0.2));
        data[i + 3] = Math.floor(data[i + 3] * edgeAlpha);
      }
    }
    
    // Put processed image data back
    ctx.putImageData(imageData, 0, 0);
  }

  async processTeamJerseyImage(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          console.log('Processing team jersey image for face detection...');
          
          // Detect faces with landmarks
          const detections = await this.detectFacesWithLandmarks(img);
          
          if (detections.length === 0) {
            console.log('No faces detected in team jersey image');
            resolve({
              originalImage: URL.createObjectURL(imageFile),
              processedImage: URL.createObjectURL(imageFile),
              facesDetected: 0,
              faceRegions: [],
              landmarks: []
            });
            return;
          }
          
          console.log(`Detected ${detections.length} face(s) in team jersey image`);
          
          // Extract face regions and landmarks
          const faceRegions = detections.map((detection, index) => {
            const box = detection.detection ? detection.detection.box : detection.box;
            const landmarks = this.extractFaceLandmarks(detection);
            const orientation = this.calculateFaceOrientation(landmarks);
            
            return {
              index: index,
              box: {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height
              },
              landmarks: landmarks,
              orientation: orientation,
              confidence: detection.detection ? detection.detection.score : detection.score
            };
          });
          
          resolve({
            originalImage: URL.createObjectURL(imageFile),
            processedImage: URL.createObjectURL(imageFile),
            facesDetected: detections.length,
            faceRegions: faceRegions,
            landmarks: faceRegions.map(region => region.landmarks)
          });
          
        } catch (error) {
          console.error('Error processing team jersey image:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load team jersey image'));
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }

  async processUserFaceImage(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          console.log('Processing user face image for detection and alignment...');
          
          // Detect faces with landmarks
          const detections = await this.detectFacesWithLandmarks(img);
          
          console.log(`User face image dimensions: ${img.width}x${img.height}`);
          console.log(`User face detections found: ${detections.length}`);
          
          if (detections.length === 0) {
            console.log('No faces detected in user face image - trying alternative detection methods');
            
            // Try with different detection options
            try {
              const altDetections = await faceapi
                .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({
                  inputSize: 320,
                  scoreThreshold: 0.1  // Very low threshold
                }))
                .withFaceLandmarks();
              
              console.log(`Alternative detection found: ${altDetections.length} faces`);
              
              if (altDetections.length > 0) {
                // Use alternative detections
                const faceRegions = altDetections.map((detection, index) => ({
                  x: detection.detection.box.x,
                  y: detection.detection.box.y,
                  width: detection.detection.box.width,
                  height: detection.detection.box.height,
                  confidence: detection.detection.score,
                  landmarks: detection.landmarks
                }));
                
                resolve({
                  originalImage: URL.createObjectURL(imageFile),
                  facesDetected: altDetections.length,
                  faceRegions: faceRegions,
                  landmarks: altDetections.map(d => d.landmarks),
                  bestFace: altDetections[0]
                });
                return;
              }
            } catch (altError) {
              console.log('Alternative detection also failed:', altError);
            }
            
            resolve({
              originalImage: URL.createObjectURL(imageFile),
              facesDetected: 0,
              faceRegions: [],
              landmarks: [],
              bestFace: null
            });
            return;
          }
          
          console.log(`Detected ${detections.length} face(s) in user face image`);
          
          // Extract face regions and landmarks
          const faceRegions = detections.map((detection, index) => {
            const box = detection.detection ? detection.detection.box : detection.box;
            const landmarks = this.extractFaceLandmarks(detection);
            const orientation = this.calculateFaceOrientation(landmarks);
            
            return {
              index: index,
              box: {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height
              },
              landmarks: landmarks,
              orientation: orientation,
              confidence: detection.detection ? detection.detection.score : detection.score,
              detection: detection
            };
          });
          
          // Find the best face (highest confidence and good size)
          const bestFace = faceRegions.reduce((best, current) => {
            const currentArea = current.box.width * current.box.height;
            const bestArea = best.box.width * best.box.height;
            
            // Prioritize confidence, then size
            if (current.confidence > best.confidence) return current;
            if (current.confidence === best.confidence && currentArea > bestArea) return current;
            return best;
          });
          
          console.log('Best face selected:', bestFace);
          
          resolve({
            originalImage: URL.createObjectURL(imageFile),
            facesDetected: detections.length,
            faceRegions: faceRegions,
            landmarks: faceRegions.map(region => region.landmarks),
            bestFace: bestFace
          });
          
        } catch (error) {
          console.error('Error processing user face image:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load user face image'));
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }

  async performFaceSwap(jerseyImageFile, userFaceImageFile, backendService) {
    try {
      console.log('Starting advanced face swap process with backend integration...');
      
      // Process both images for face detection and alignment
      const [jerseyResults, userFaceResults] = await Promise.all([
        this.processTeamJerseyImage(jerseyImageFile),
        this.processUserFaceImage(userFaceImageFile)
      ]);
      
      if (jerseyResults.facesDetected === 0) {
        throw new Error('No faces detected in team jersey image');
      }
      
      if (userFaceResults.facesDetected === 0) {
        throw new Error('No faces detected in user face image');
      }
      
      // Get the best face from user image
      const bestUserFace = userFaceResults.bestFace;
      
      // Create aligned face images for backend processing
      const alignedImages = await this.createAlignedImagesForBackend(
        jerseyImageFile,
        userFaceImageFile,
        jerseyResults.faceRegions,
        bestUserFace
      );
      
      // Send aligned images to backend for face swapping
      const backendResult = await this.sendToBackendForFaceSwap(
        alignedImages.alignedJerseyImage,
        alignedImages.alignedUserFace,
        backendService
      );
      
      return {
        success: true,
        swappedImage: backendResult.swappedImage,
        jerseyResults: jerseyResults,
        userFaceResults: userFaceResults,
        processingInfo: {
          jerseyFacesDetected: jerseyResults.facesDetected,
          userFacesDetected: userFaceResults.facesDetected,
          facesAligned: jerseyResults.faceRegions.length,
          backendProcessing: true
        }
      };
      
    } catch (error) {
      console.error('Error in advanced face swap process:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createSwappedImage(jerseyImageFile, userFaceImageFile, jerseyFaceRegions, bestUserFace) {
    return new Promise((resolve, reject) => {
      const jerseyImg = new Image();
      const userFaceImg = new Image();
      let loadedCount = 0;
      
      const onImageLoad = async () => {
        loadedCount++;
        if (loadedCount === 2) {
          try {
            console.log('Both images loaded, creating swapped image...');
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to match jersey image
            canvas.width = jerseyImg.width;
            canvas.height = jerseyImg.height;
            
            // Draw the jersey image first
            ctx.drawImage(jerseyImg, 0, 0);
            
            // Swap each face in the jersey with the user's face
            for (const jerseyRegion of jerseyFaceRegions) {
              // Align user face to jersey face
              const alignedFace = await this.alignFaceToTarget(
                userFaceImg,
                jerseyImg,
                bestUserFace.detection,
                jerseyRegion.detection || jerseyRegion
              );
              
              // Create aligned face image element
              const alignedFaceImg = new Image();
              await new Promise((resolveImg) => {
                alignedFaceImg.onload = resolveImg;
                alignedFaceImg.src = alignedFace;
              });
              
              // Overlay the aligned face
              await this.overlayAlignedFace(
                ctx,
                alignedFaceImg,
                jerseyRegion.box
              );
            }
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                resolve(url);
              } else {
                reject(new Error('Failed to create swapped image blob'));
              }
            }, 'image/png');
            
          } catch (error) {
            console.error('Error creating swapped image:', error);
            reject(error);
          }
        }
      };
      
      jerseyImg.onload = onImageLoad;
      userFaceImg.onload = onImageLoad;
      
      jerseyImg.onerror = () => reject(new Error('Failed to load jersey image'));
      userFaceImg.onerror = () => reject(new Error('Failed to load user face image'));
      
      jerseyImg.src = URL.createObjectURL(jerseyImageFile);
      userFaceImg.src = URL.createObjectURL(userFaceImageFile);
    });
  }

  async overlayAlignedFace(ctx, alignedFaceImg, targetBox) {
    // Calculate face region with padding
    const padding = 0.1;
    const x = Math.max(0, targetBox.x - targetBox.width * padding);
    const y = Math.max(0, targetBox.y - targetBox.height * padding);
    const width = targetBox.width * (1 + 2 * padding);
    const height = targetBox.height * (1 + 2 * padding);
    
    console.log(`Overlaying aligned face at: x=${x}, y=${y}, width=${width}, height=${height}`);
    
    // Save context state
    ctx.save();
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Create clipping path for natural face shape
    ctx.beginPath();
    ctx.ellipse(
      x + width / 2, y + height / 2,
      width / 2, height / 2,
      0, 0, 2 * Math.PI
    );
    ctx.clip();
    
    // Draw the aligned face
    ctx.drawImage(alignedFaceImg, x, y, width, height);
    
    // Restore context state
    ctx.restore();
  }

  async createAlignedImagesForBackend(jerseyImageFile, userFaceImageFile, jerseyFaceRegions, bestUserFace) {
    return new Promise((resolve, reject) => {
      const jerseyImg = new Image();
      const userFaceImg = new Image();
      let loadedCount = 0;
      
      const onImageLoad = async () => {
        loadedCount++;
        if (loadedCount === 2) {
          try {
            console.log('Creating aligned images for backend processing...');
            
            // Create aligned user face image
            const alignedUserFace = await this.createAlignedUserFace(
              userFaceImg,
              bestUserFace.detection,
              jerseyFaceRegions[0] // Use first jersey face as reference
            );
            
            // Normalize lighting and color between user face and jersey
            const normalizedUserFace = await this.normalizeLightingAndColor(
              alignedUserFace,
              jerseyImg,
              jerseyFaceRegions[0]
            );
            
            // Create processed jersey image (with face regions marked)
            const processedJerseyImage = await this.createProcessedJerseyImage(
              jerseyImg,
              jerseyFaceRegions
            );
            
            resolve({
              alignedJerseyImage: processedJerseyImage,
              alignedUserFace: normalizedUserFace
            });
            
          } catch (error) {
            console.error('Error creating aligned images:', error);
            reject(error);
          }
        }
      };
      
      jerseyImg.onload = onImageLoad;
      userFaceImg.onload = onImageLoad;
      
      jerseyImg.onerror = () => reject(new Error('Failed to load jersey image'));
      userFaceImg.onerror = () => reject(new Error('Failed to load user face image'));
      
      jerseyImg.src = URL.createObjectURL(jerseyImageFile);
      userFaceImg.src = URL.createObjectURL(userFaceImageFile);
    });
  }

  async createAlignedUserFace(userFaceImg, userFaceDetection, jerseyFaceReference) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match jersey face size
        const jerseyBox = jerseyFaceReference.detection ? jerseyFaceReference.detection.box : jerseyFaceReference.box;
        canvas.width = jerseyBox.width * 1.5; // Add padding
        canvas.height = jerseyBox.height * 1.5;
        
        // Get user face box
        const userBox = userFaceDetection.detection ? userFaceDetection.detection.box : userFaceDetection.box;
        
        // Calculate alignment parameters
        const scale = jerseyBox.width / userBox.width;
        const userFaceCenter = {
          x: userBox.x + userBox.width / 2,
          y: userBox.y + userBox.height / 2
        };
        
        // Save context state
        ctx.save();
        
        // Move to center of canvas
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Apply scaling
        ctx.scale(scale, scale);
        
        // Move back to account for user face center
        ctx.translate(-userFaceCenter.x, -userFaceCenter.y);
        
        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw the user face
        ctx.drawImage(userFaceImg, 0, 0);
        
        // Restore context state
        ctx.restore();
        
        // Apply background removal
        this.removeBackgroundAndSmoothEdges(ctx, canvas.width, canvas.height);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'aligned-user-face.png', { type: 'image/png' });
            resolve(file);
          } else {
            reject(new Error('Failed to create aligned user face blob'));
          }
        }, 'image/png');
        
      } catch (error) {
        console.error('Error creating aligned user face:', error);
        reject(error);
      }
    });
  }

  async createProcessedJerseyImage(jerseyImg, jerseyFaceRegions) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match jersey image
        canvas.width = jerseyImg.width;
        canvas.height = jerseyImg.height;
        
        // Draw the jersey image
        ctx.drawImage(jerseyImg, 0, 0);
        
        // Note: Face regions are detected but not visually marked to avoid UI clutter
        // The backend will receive the clean jersey image for processing
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'processed-jersey.png', { type: 'image/png' });
            resolve(file);
          } else {
            reject(new Error('Failed to create processed jersey blob'));
          }
        }, 'image/png');
        
      } catch (error) {
        console.error('Error creating processed jersey image:', error);
        reject(error);
      }
    });
  }

  async normalizeLightingAndColor(alignedUserFaceFile, jerseyImg, jerseyFaceRegion) {
    return new Promise((resolve, reject) => {
      const userFaceImg = new Image();
      
      userFaceImg.onload = async () => {
        try {
          console.log('🎨 Normalizing lighting and color between user face and jersey...');
          
          // Create canvas for processing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = userFaceImg.width;
          canvas.height = userFaceImg.height;
          
          // Draw user face
          ctx.drawImage(userFaceImg, 0, 0);
          
          // Extract color statistics from both images
          console.log('📊 Extracting color statistics...');
          const userFaceStats = this.extractColorStatistics(ctx, canvas.width, canvas.height);
          const jerseyFaceStats = this.extractJerseyFaceStatistics(jerseyImg, jerseyFaceRegion);
          
          // Log statistics for debugging
          console.log('👤 User Face Stats:', {
            mean: userFaceStats.mean,
            stdDev: userFaceStats.stdDev
          });
          console.log('👕 Jersey Face Stats:', {
            mean: jerseyFaceStats.mean,
            stdDev: jerseyFaceStats.stdDev
          });
          
          // Apply color normalization
          console.log('🎨 Applying color normalization...');
          this.applyColorNormalization(ctx, canvas.width, canvas.height, userFaceStats, jerseyFaceStats);
          
          // Apply lighting normalization
          console.log('💡 Applying lighting normalization...');
          this.applyLightingNormalization(ctx, canvas.width, canvas.height, userFaceStats, jerseyFaceStats);
          
          // Apply skin tone preservation
          console.log('🌍 Preserving skin tones...');
          this.preserveSkinTones(ctx, canvas.width, canvas.height);
          
          console.log('✅ Color and lighting normalization completed!');
          
          // Convert to file
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'normalized-user-face.png', { type: 'image/png' });
              resolve(file);
            } else {
              reject(new Error('Failed to create normalized user face blob'));
            }
          }, 'image/png');
          
        } catch (error) {
          console.error('❌ Error normalizing lighting and color:', error);
          reject(error);
        }
      };
      
      userFaceImg.onerror = () => reject(new Error('Failed to load aligned user face'));
      userFaceImg.src = URL.createObjectURL(alignedUserFaceFile);
    });
  }

  extractColorStatistics(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    let rSum = 0, gSum = 0, bSum = 0;
    let rSqSum = 0, gSqSum = 0, bSqSum = 0;
    let pixelCount = 0;
    
    // Sample pixels (every 4th pixel for performance)
    for (let i = 0; i < data.length; i += 16) { // 4 pixels * 4 channels
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Only process non-transparent pixels
      if (a > 128) {
        rSum += r;
        gSum += g;
        bSum += b;
        rSqSum += r * r;
        gSqSum += g * g;
        bSqSum += b * b;
        pixelCount++;
      }
    }
    
    const count = pixelCount || 1;
    
    return {
      mean: {
        r: rSum / count,
        g: gSum / count,
        b: bSum / count
      },
      variance: {
        r: (rSqSum / count) - Math.pow(rSum / count, 2),
        g: (gSqSum / count) - Math.pow(gSum / count, 2),
        b: (bSqSum / count) - Math.pow(bSum / count, 2)
      },
      stdDev: {
        r: Math.sqrt((rSqSum / count) - Math.pow(rSum / count, 2)),
        g: Math.sqrt((gSqSum / count) - Math.pow(gSum / count, 2)),
        b: Math.sqrt((bSqSum / count) - Math.pow(bSum / count, 2))
      }
    };
  }

  extractJerseyFaceStatistics(jerseyImg, jerseyFaceRegion) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Extract face region from jersey
    const box = jerseyFaceRegion.detection ? jerseyFaceRegion.detection.box : jerseyFaceRegion.box;
    canvas.width = box.width;
    canvas.height = box.height;
    
    // Draw the face region from jersey
    ctx.drawImage(
      jerseyImg,
      box.x, box.y, box.width, box.height,
      0, 0, box.width, box.height
    );
    
    return this.extractColorStatistics(ctx, box.width, box.height);
  }

  applyColorNormalization(ctx, width, height, userStats, jerseyStats) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Calculate normalization factors
    const rScale = jerseyStats.stdDev.r / (userStats.stdDev.r || 1);
    const gScale = jerseyStats.stdDev.g / (userStats.stdDev.g || 1);
    const bScale = jerseyStats.stdDev.b / (userStats.stdDev.b || 1);
    
    const rOffset = jerseyStats.mean.r - (userStats.mean.r * rScale);
    const gOffset = jerseyStats.mean.g - (userStats.mean.g * gScale);
    const bOffset = jerseyStats.mean.b - (userStats.mean.b * bScale);
    
    // Log normalization factors for debugging
    console.log('🎨 Color Normalization Factors:', {
      rScale: rScale.toFixed(3),
      gScale: gScale.toFixed(3),
      bScale: bScale.toFixed(3),
      rOffset: rOffset.toFixed(1),
      gOffset: gOffset.toFixed(1),
      bOffset: bOffset.toFixed(1)
    });
    
    let processedPixels = 0;
    
    // Apply color normalization
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      
      // Only process non-transparent pixels
      if (a > 128) {
        // Apply scaling and offset
        let r = data[i] * rScale + rOffset;
        let g = data[i + 1] * gScale + gOffset;
        let b = data[i + 2] * bScale + bOffset;
        
        // Clamp values to valid range
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
        
        processedPixels++;
      }
    }
    
    console.log(`🎨 Color normalization applied to ${processedPixels} pixels`);
    ctx.putImageData(imageData, 0, 0);
  }

  applyLightingNormalization(ctx, width, height, userStats, jerseyStats) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Calculate brightness difference
    const userBrightness = (userStats.mean.r + userStats.mean.g + userStats.mean.b) / 3;
    const jerseyBrightness = (jerseyStats.mean.r + jerseyStats.mean.g + jerseyStats.mean.b) / 3;
    const brightnessDiff = jerseyBrightness - userBrightness;
    
    // Calculate contrast ratio
    const userContrast = (userStats.stdDev.r + userStats.stdDev.g + userStats.stdDev.b) / 3;
    const jerseyContrast = (jerseyStats.stdDev.r + jerseyStats.stdDev.g + jerseyStats.stdDev.b) / 3;
    const contrastRatio = jerseyContrast / (userContrast || 1);
    
    // Log lighting factors for debugging
    console.log('💡 Lighting Normalization Factors:', {
      userBrightness: userBrightness.toFixed(1),
      jerseyBrightness: jerseyBrightness.toFixed(1),
      brightnessDiff: brightnessDiff.toFixed(1),
      userContrast: userContrast.toFixed(1),
      jerseyContrast: jerseyContrast.toFixed(1),
      contrastRatio: contrastRatio.toFixed(3)
    });
    
    let processedPixels = 0;
    
    // Apply lighting adjustments
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      
      // Only process non-transparent pixels
      if (a > 128) {
        // Apply brightness adjustment
        let r = data[i] + brightnessDiff * 0.3; // Gentle adjustment
        let g = data[i + 1] + brightnessDiff * 0.3;
        let b = data[i + 2] + brightnessDiff * 0.3;
        
        // Apply contrast adjustment
        const avg = (r + g + b) / 3;
        r = avg + (r - avg) * contrastRatio;
        g = avg + (g - avg) * contrastRatio;
        b = avg + (b - avg) * contrastRatio;
        
        // Clamp values
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
        
        processedPixels++;
      }
    }
    
    console.log(`💡 Lighting normalization applied to ${processedPixels} pixels`);
    ctx.putImageData(imageData, 0, 0);
  }

  preserveSkinTones(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Skin tone preservation - maintain natural skin colors
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      
      // Only process non-transparent pixels
      if (a > 128) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Check if pixel is likely skin tone
        const isSkinTone = this.isSkinTone(r, g, b);
        
        if (isSkinTone) {
          // Preserve natural skin tone characteristics
          const skinPreservation = 0.7; // How much to preserve original skin tone
          
          // Blend with original values to maintain natural appearance
          data[i] = data[i] * (1 - skinPreservation) + r * skinPreservation;
          data[i + 1] = data[i + 1] * (1 - skinPreservation) + g * skinPreservation;
          data[i + 2] = data[i + 2] * (1 - skinPreservation) + b * skinPreservation;
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  isSkinTone(r, g, b) {
    // Enhanced skin tone detection for different ethnicities
    const conditions = [
      // Light skin tones
      r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15,
      
      // Medium skin tones
      r > 80 && g > 50 && b > 30 && r > g && r > b && Math.abs(r - g) > 10,
      
      // Darker skin tones
      r > 60 && g > 40 && b > 25 && r > g && r > b && Math.abs(r - g) > 8,
      
      // Additional skin tone ranges
      r > 70 && g > 45 && b > 25 && r > g && r > b,
      
      // Very light skin tones
      r > 120 && g > 80 && b > 60 && r > g && r > b && Math.abs(r - g) > 20
    ];
    
    return conditions.some(condition => condition);
  }

  async sendToBackendForFaceSwap(alignedJerseyImage, alignedUserFace, backendService) {
    try {
      console.log('Sending aligned and normalized images to backend for face swapping...');
      
      // Use the existing backend service to perform face swap
      const result = await backendService.swapFaces(
        alignedJerseyImage,
        alignedUserFace,
        {
          enhance: true,
          quality: 'high',
          preprocessed: true, // Flag to indicate images are preprocessed
          normalized: true // Flag to indicate lighting/color normalization applied
        }
      );

      if (result.success) {
        // Handle different response formats
        let swappedImageUrl;
        if (result.imageData) {
          swappedImageUrl = result.imageData;
        } else if (result.imageUrl) {
          swappedImageUrl = result.imageUrl;
        } else {
          throw new Error('No image data received from backend API');
        }

        return {
          success: true,
          swappedImage: swappedImageUrl
        };
      } else {
        throw new Error('Backend face swap failed');
      }
      
    } catch (error) {
      console.error('Error sending to backend:', error);
      throw error;
    }
  }
}

// Create singleton instance
const advancedFaceAlignmentService = new AdvancedFaceAlignmentService();

export default advancedFaceAlignmentService;
