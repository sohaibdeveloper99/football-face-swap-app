import * as faceapi from 'face-api.js';

class FaceDetectionService {
  constructor() {
    this.isLoaded = false;
    this.modelsLoaded = false;
  }

  async loadModels() {
    if (this.modelsLoaded) return true;
    
    try {
      console.log('Loading face-api.js models...');
      
      // Load the models from CDN
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
        faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
        faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'),
        faceapi.nets.faceExpressionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights')
      ]);
      
      this.modelsLoaded = true;
      console.log('Face-api.js models loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading face-api.js models:', error);
      // Fallback: try loading minimal models only
      try {
        console.log('Trying to load minimal models...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
        this.modelsLoaded = true;
        console.log('Minimal face detection model loaded');
        return true;
      } catch (fallbackError) {
        console.error('Failed to load even minimal models:', fallbackError);
        return false;
      }
    }
  }

  async detectFaces(imageElement) {
    if (!this.modelsLoaded) {
      const loaded = await this.loadModels();
      if (!loaded) {
        throw new Error('Failed to load face detection models');
      }
    }

    try {
      console.log('Detecting faces in image...');
      
      // Detect faces with landmarks for better accuracy
      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks();

      console.log(`Found ${detections.length} face(s) with landmarks`);
      console.log('Detection structure:', detections[0]); // Debug: show first detection structure
      return detections;
    } catch (error) {
      console.error('Error detecting faces:', error);
      // Fallback to basic detection if landmarks fail
      try {
        console.log('Falling back to basic face detection...');
        const basicDetections = await faceapi.detectAllFaces(
          imageElement, 
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5
          })
        );
        console.log(`Found ${basicDetections.length} face(s) with basic detection`);
        return basicDetections;
      } catch (fallbackError) {
        console.error('Fallback detection also failed:', fallbackError);
        throw error;
      }
    }
  }

  async removeFaceFromImage(imageElement, detections) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match image
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        
    // Draw the original image
    ctx.drawImage(imageElement, 0, 0);
    
    // Sample background color from around the image edges
    const backgroundColor = this.sampleBackgroundColor(ctx, imageElement.width, imageElement.height);
        
        console.log('Processing detections for face removal:', detections.length);
        
        // Remove each detected face
        detections.forEach((detection, index) => {
          console.log(`Processing detection ${index}:`, detection);
          
          // Handle different detection object structures
          let box;
          if (detection.detection && detection.detection.box) {
            box = detection.detection.box;
          } else if (detection.box) {
            box = detection.box;
          } else {
            console.warn('Face detection box not found in detection:', detection);
            return;
          }
          
          console.log(`Face ${index} box:`, box);
          
          // Get face region coordinates with more aggressive removal
          const x = Math.max(0, box.x - box.width * 0.2);
          const y = Math.max(0, box.y - box.height * 0.2);
          const width = box.width * 1.4;
          const height = box.height * 1.4;
          
          console.log(`Removing face ${index} at:`, { x, y, width, height });
          
          // Create a smooth mask for face removal with background color
          this.createSmoothMask(ctx, x, y, width, height, backgroundColor);
        });
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            console.log('Created blob URL:', url);
            console.log('Blob size:', blob.size);
            console.log('Blob type:', blob.type);
            resolve(url);
          } else {
            console.error('Failed to create blob from canvas');
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png');
      } catch (error) {
        console.error('Error in removeFaceFromImage:', error);
        reject(error);
      }
    });
  }

  sampleBackgroundColor(ctx, width, height) {
    // Sample colors from image edges to determine background
    const samples = [];
    const sampleSize = 10;
    
    // Sample from top edge
    for (let i = 0; i < width; i += sampleSize) {
      const imageData = ctx.getImageData(i, 0, 1, 1);
      samples.push([imageData.data[0], imageData.data[1], imageData.data[2]]);
    }
    
    // Sample from bottom edge
    for (let i = 0; i < width; i += sampleSize) {
      const imageData = ctx.getImageData(i, height - 1, 1, 1);
      samples.push([imageData.data[0], imageData.data[1], imageData.data[2]]);
    }
    
    // Sample from left edge
    for (let i = 0; i < height; i += sampleSize) {
      const imageData = ctx.getImageData(0, i, 1, 1);
      samples.push([imageData.data[0], imageData.data[1], imageData.data[2]]);
    }
    
    // Sample from right edge
    for (let i = 0; i < height; i += sampleSize) {
      const imageData = ctx.getImageData(width - 1, i, 1, 1);
      samples.push([imageData.data[0], imageData.data[1], imageData.data[2]]);
    }
    
    // Calculate average background color
    const avgR = Math.round(samples.reduce((sum, [r]) => sum + r, 0) / samples.length);
    const avgG = Math.round(samples.reduce((sum, [r, g]) => sum + g, 0) / samples.length);
    const avgB = Math.round(samples.reduce((sum, [r, g, b]) => sum + b, 0) / samples.length);
    
    return `rgb(${avgR}, ${avgG}, ${avgB})`;
  }

  createSmoothMask(ctx, x, y, width, height, backgroundColor = '#ffffff') {
    // Create a more aggressive face removal mask
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.min(width, height) / 2;
    
    // Method 1: Complete background color fill for face area
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x, y, width, height);
    
    // Method 2: Radial gradient for smooth blending at edges
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    
    // Create a smooth transition from transparent center to background edges
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
    
    // Apply the gradient mask
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // Method 3: Additional smoothing with multiple passes
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, y, width, height);
    
    // Method 4: Edge smoothing with smaller radius
    const innerRadius = radius * 0.7;
    const innerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, innerRadius
    );
    
    innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    innerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
    
    ctx.fillStyle = innerGradient;
    ctx.fillRect(x, y, width, height);
    
    // Method 5: Final pass with background color
    ctx.fillStyle = backgroundColor;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1.0;
  }

  async processJerseyImage(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          console.log('Processing jersey image for face detection...');
          
          // Detect faces in the jersey image
          const detections = await this.detectFaces(img);
          
          if (detections.length === 0) {
            console.log('No faces detected in jersey image');
            // Return original image if no faces found
            resolve({
              originalImage: URL.createObjectURL(imageFile),
              processedImage: URL.createObjectURL(imageFile),
              facesDetected: 0,
              faceRegions: []
            });
            return;
          }
          
          console.log(`Detected ${detections.length} face(s) in jersey image`);
          
          // Remove faces from the image
          const processedImageUrl = await this.removeFaceFromImage(img, detections);
          
          // Extract face region information with hair detection but exclude neck
          const faceRegions = detections.map(detection => {
            const box = detection.detection ? detection.detection.box : detection.box;
            const score = detection.detection ? detection.detection.score : detection.score;
            
            // Expand the face region to include hair but exclude neck
            const hairPadding = 0.2; // 20% expansion for hair (reduced)
            const neckPadding = 0.1; // 10% padding for neck (reduced)
            const expandedX = Math.max(0, box.x - box.width * hairPadding);
            const expandedY = Math.max(0, box.y - box.height * hairPadding);
            const expandedWidth = box.width * (1 + 2 * hairPadding);
            const expandedHeight = box.height * (1 + 2 * hairPadding - neckPadding); // Reduce height to exclude neck
            
            return {
              x: expandedX,
              y: expandedY,
              width: expandedWidth,
              height: expandedHeight,
              confidence: score,
              originalBox: {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height
              }
            };
          });
          
          resolve({
            originalImage: URL.createObjectURL(imageFile),
            processedImage: processedImageUrl,
            facesDetected: detections.length,
            faceRegions: faceRegions
          });
          
        } catch (error) {
          console.error('Error processing jersey image:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }

  async processFaceImage(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          console.log('Processing face image - removing background first...');
          
          // Detect faces in the original image (no background removal to avoid artifacts)
          console.log('Detecting faces in original image...');
          const detections = await this.detectFaces(img);
          
          if (detections.length === 0) {
            console.log('No faces detected in face image');
            resolve({
              originalImage: URL.createObjectURL(imageFile),
              facesDetected: 0,
              faceRegions: [],
              bestFaceRegion: null
            });
            return;
          }
          
          console.log(`Detected ${detections.length} face(s) in face image`);
          
          // Extract face region information with hair detection but exclude neck
          const faceRegions = detections.map(detection => {
            const box = detection.detection ? detection.detection.box : detection.box;
            const score = detection.detection ? detection.detection.score : detection.score;
            
            // Expand the face region to include hair but exclude neck
            const hairPadding = 0.2; // 20% expansion for hair (reduced)
            const neckPadding = 0.1; // 10% padding for neck (reduced)
            const expandedX = Math.max(0, box.x - box.width * hairPadding);
            const expandedY = Math.max(0, box.y - box.height * hairPadding);
            const expandedWidth = box.width * (1 + 2 * hairPadding);
            const expandedHeight = box.height * (1 + 2 * hairPadding - neckPadding); // Reduce height to exclude neck
            
            return {
              x: expandedX,
              y: expandedY,
              width: expandedWidth,
              height: expandedHeight,
              confidence: score,
              originalBox: {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height
              }
            };
          });
          
          // Find the best face (highest confidence and largest size)
          const bestFace = faceRegions.reduce((best, current) => {
            const currentArea = current.width * current.height;
            const bestArea = best.width * best.height;
            
            // Prioritize confidence, then size
            if (current.confidence > best.confidence) return current;
            if (current.confidence === best.confidence && currentArea > bestArea) return current;
            return best;
          });
          
          console.log('Best face selected (face only, no neck):', bestFace);
          
          resolve({
            originalImage: URL.createObjectURL(imageFile),
            facesDetected: detections.length,
            faceRegions: faceRegions,
            bestFaceRegion: bestFace
          });
          
        } catch (error) {
          console.error('Error processing face image:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }

  async overlayFaceOnJersey(jerseyImageFile, faceImageFile, jerseyFaceRegions, faceImageDetectionResults) {
    return new Promise((resolve, reject) => {
      const jerseyImg = new Image();
      const faceImg = new Image();
      let loadedCount = 0;
      
      const onImageLoad = async () => {
        loadedCount++;
        if (loadedCount === 2) { // Need both images to load
          try {
            console.log('Both images loaded, starting face overlay...');
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to match jersey image
            canvas.width = jerseyImg.width;
            canvas.height = jerseyImg.height;
            
            // Draw the jersey image first
            ctx.drawImage(jerseyImg, 0, 0);
            
            // Use the original face image directly
            const bestFaceRegion = faceImageDetectionResults?.bestFaceRegion;
            
            if (!bestFaceRegion) {
              reject(new Error('No face detected in uploaded face image'));
              return;
            }
            
            // Overlay each jersey face region with the detected face
            for (let i = 0; i < jerseyFaceRegions.length; i++) {
              const jerseyRegion = jerseyFaceRegions[i];
              await this.overlaySingleFaceWithDetection(
                ctx, 
                faceImg, 
                jerseyRegion, 
                bestFaceRegion,
                jerseyImg.width, 
                jerseyImg.height
              );
            }
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                console.log('Face overlay completed successfully');
                resolve(url);
              } else {
                reject(new Error('Failed to create blob from canvas'));
              }
            }, 'image/png');
            
          } catch (error) {
            console.error('Error in face overlay:', error);
            reject(error);
          }
        }
      };
      
      jerseyImg.onload = onImageLoad;
      faceImg.onload = onImageLoad;
      
      jerseyImg.onerror = () => reject(new Error('Failed to load jersey image'));
      faceImg.onerror = () => reject(new Error('Failed to load face image'));
      
      jerseyImg.src = URL.createObjectURL(jerseyImageFile);
      faceImg.src = URL.createObjectURL(faceImageFile);
    });
  }

  async overlaySingleFace(ctx, faceImg, region, jerseyWidth, jerseyHeight) {
    return new Promise((resolve) => {
      // Calculate face region with padding
      const padding = 0.1;
      const x = Math.max(0, region.x - region.width * padding);
      const y = Math.max(0, region.y - region.height * padding);
      const width = region.width * (1 + 2 * padding);
      const height = region.height * (1 + 2 * padding);
      
      console.log(`Overlaying face at: x=${x}, y=${y}, width=${width}, height=${height}`);
      
      // Save current context state
      ctx.save();
      
      // Create clipping path for face region
      ctx.beginPath();
      ctx.ellipse(
        x + width / 2, y + height / 2,
        width / 2, height / 2,
        0, 0, 2 * Math.PI
      );
      ctx.clip();
      
      // Apply lighting and shadow adjustments
      this.applyLightingAdjustments(ctx, x, y, width, height);
      
      // Draw the face image scaled to fit the region
      ctx.drawImage(faceImg, x, y, width, height);
      
      // Apply perspective and shadow effects
      this.applyPerspectiveEffects(ctx, x, y, width, height);
      
      // Restore context state
      ctx.restore();
      
      resolve();
    });
  }

  async overlaySingleFaceWithDetection(ctx, faceImg, jerseyRegion, detectedFaceRegion, jerseyWidth, jerseyHeight) {
    return new Promise((resolve) => {
      // Use the full detected face region (including hair) from the uploaded face image
      const sourceX = detectedFaceRegion.x;
      const sourceY = detectedFaceRegion.y;
      const sourceWidth = detectedFaceRegion.width;
      const sourceHeight = detectedFaceRegion.height;
      
      // Calculate destination region to match jersey face position
      const x = jerseyRegion.x;
      const y = jerseyRegion.y;
      const width = jerseyRegion.width;
      const height = jerseyRegion.height;
      
      console.log(`Replacing full face at: x=${x}, y=${y}, width=${width}, height=${height}`);
      console.log('Source face region:', detectedFaceRegion);
      
      // Create a temporary canvas for advanced face processing
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = sourceWidth;
      tempCanvas.height = sourceHeight;
      
      // Draw the face region to temp canvas
      tempCtx.drawImage(
        faceImg,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, sourceWidth, sourceHeight
      );
      
      // Apply simple but effective background removal
      this.removeBackgroundSimple(tempCtx, sourceWidth, sourceHeight);
      
      // Create a natural face mask with soft edges
      this.createSoftFaceMask(tempCtx, sourceWidth, sourceHeight);
      
      // Draw the processed face to main canvas with high quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(
        tempCanvas,
        0, 0, sourceWidth, sourceHeight,
        x, y, width, height
      );
      
      resolve();
    });
  }

  removeFaceBackgroundAdvanced(ctx, width, height) {
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Sample background color from multiple edge points
    const backgroundSamples = [
      [0, 0], [width-1, 0], [0, height-1], [width-1, height-1],
      [width/4, 0], [3*width/4, 0], [0, height/4], [width-1, height/4],
      [width/8, 0], [7*width/8, 0], [0, height/8], [width-1, height/8],
      [width/6, 0], [5*width/6, 0], [0, height/6], [width-1, height/6],
      [width/12, 0], [11*width/12, 0], [0, height/12], [width-1, height/12]
    ];
    
    let avgR = 0, avgG = 0, avgB = 0;
    for (const [x, y] of backgroundSamples) {
      const index = (Math.floor(y) * width + Math.floor(x)) * 4;
      avgR += data[index];
      avgG += data[index + 1];
      avgB += data[index + 2];
    }
    avgR /= backgroundSamples.length; 
    avgG /= backgroundSamples.length; 
    avgB /= backgroundSamples.length;
    
    console.log('Detected background color:', { r: avgR, g: avgG, b: avgB });
    
    // Ultra-aggressive background removal with multiple passes
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate distance from background color
        const distance = Math.sqrt(
          Math.pow(r - avgR, 2) + 
          Math.pow(g - avgG, 2) + 
          Math.pow(b - avgB, 2)
        );
        
        // Get pixel position for edge detection
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        
        // Check if pixel is near edges (likely background)
        const isEdge = x < width * 0.25 || x > width * 0.75 || y < height * 0.25 || y > height * 0.75;
        
        // Calculate brightness
        const brightness = (r + g + b) / 3;
        
        // Ultra-aggressive background removal
        if (distance < 80) {
          // Strong background - make completely transparent
          data[i + 3] = 0;
        } else if (distance < 120 && isEdge) {
          // Edge pixels with moderate distance - make mostly transparent
          data[i + 3] = Math.floor(data[i + 3] * 0.02);
        } else if (distance < 160) {
          // Gradual transparency for smooth edges
          const alpha = Math.max(0, (distance - 80) / 80);
          data[i + 3] = Math.floor(data[i + 3] * alpha * 0.1);
        }
        
        // Remove dark pixels (likely background)
        if (brightness < 80 && isEdge) {
          data[i + 3] = 0;
        }
        
        // Remove very dark pixels (definitely background)
        if (brightness < 40) {
          data[i + 3] = 0;
        }
      }
    }
    
    // Put the processed image data back
    ctx.putImageData(imageData, 0, 0);
  }

  cleanupEdges(ctx, width, height) {
    // Get image data for edge cleanup
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Create a circular mask for natural face shape
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;
    
    // Clean up edges with circular mask
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      
      // Calculate distance from center
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      // If pixel is outside the circular mask, make it transparent
      if (distance > radius * 0.9) {
        // Gradual transparency near edges
        const edgeDistance = distance - (radius * 0.9);
        const maxEdgeDistance = radius * 0.1;
        const alpha = Math.max(0, 1 - (edgeDistance / maxEdgeDistance));
        data[i + 3] = Math.floor(data[i + 3] * alpha);
      }
    }
    
    // Put the processed image data back
    ctx.putImageData(imageData, 0, 0);
  }

  removeBackgroundAdvanced(ctx, width, height) {
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
    
    // Remove background pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate distance from background color
      const distance = Math.sqrt(
        Math.pow(r - avgR, 2) + 
        Math.pow(g - avgG, 2) + 
        Math.pow(b - avgB, 2)
      );
      
      // Get pixel position
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      
      // Check if pixel is near edges
      const isEdge = x < width * 0.2 || x > width * 0.8 || y < height * 0.2 || y > height * 0.8;
      
      // Remove background pixels
      if (distance < 100) {
        data[i + 3] = 0;
      } else if (distance < 150 && isEdge) {
        data[i + 3] = Math.floor(data[i + 3] * 0.1);
      }
    }
    
    // Put the processed image data back
    ctx.putImageData(imageData, 0, 0);
  }

  createSoftFaceMask(ctx, width, height) {
    // Create a soft, natural face mask
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;
    
    // Create soft face mask
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      
      // Calculate distance from center
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      // Create soft fade at edges
      let alpha = 1;
      if (distance > radius * 0.8) {
        alpha = Math.max(0, 1 - (distance - radius * 0.8) / (radius * 0.2));
      }
      
      // Apply the alpha
      data[i + 3] = Math.floor(data[i + 3] * alpha);
    }
    
    // Put the processed image data back
    ctx.putImageData(imageData, 0, 0);
  }

  removeBackgroundSimple(ctx, width, height) {
    // Simple but effective background removal
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Sample background from corners
    const corners = [
      [0, 0], [width-1, 0], [0, height-1], [width-1, height-1]
    ];
    
    let avgR = 0, avgG = 0, avgB = 0;
    for (const [x, y] of corners) {
      const index = (y * width + x) * 4;
      avgR += data[index];
      avgG += data[index + 1];
      avgB += data[index + 2];
    }
    avgR /= 4; avgG /= 4; avgB /= 4;
    
    // Simple background removal
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate distance from background
      const distance = Math.sqrt(
        Math.pow(r - avgR, 2) + 
        Math.pow(g - avgG, 2) + 
        Math.pow(b - avgB, 2)
      );
      
      // Simple threshold - if too similar to background, make transparent
      if (distance < 80) {
        data[i + 3] = 0;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  createNaturalFaceMask(ctx, width, height) {
    // Legacy method - kept for compatibility
    this.createSoftFaceMask(ctx, width, height);
  }

  applyColorMatching(ctx, x, y, width, height) {
    // Apply subtle color matching to blend face with jersey lighting
    const gradient = ctx.createRadialGradient(
      x + width / 2, y + height / 2, 0,
      x + width / 2, y + height / 2, width / 2
    );
    
    // Very subtle color adjustment to match jersey lighting
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.02)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
  }

  applyFinalBlending(ctx, x, y, width, height) {
    // Legacy method - kept for compatibility
    this.applyColorMatching(ctx, x, y, width, height);
  }

  async removeBackgroundFromImage(imageElement) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match image
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      
      // Draw the original image
      ctx.drawImage(imageElement, 0, 0);
      
      // Apply background removal to the entire image
      this.removeFaceBackgroundAdvanced(ctx, canvas.width, canvas.height);
      
      // Create a new image element with the processed canvas
      const processedImg = new Image();
      processedImg.onload = () => resolve(processedImg);
      processedImg.src = canvas.toDataURL('image/png');
    });
  }

  removeFaceBackground(ctx, width, height) {
    // Legacy method - kept for compatibility
    this.removeFaceBackgroundAdvanced(ctx, width, height);
  }

  applyMinimalLighting(ctx, x, y, width, height) {
    // Create very subtle lighting that doesn't create dark overlays
    const gradient = ctx.createRadialGradient(
      x + width * 0.5, y + height * 0.4, 0,
      x + width * 0.5, y + height * 0.4, width * 0.8
    );
    
    // Very minimal lighting - mostly transparent
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.01)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.02)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
  }

  applyNaturalLighting(ctx, x, y, width, height) {
    // Legacy method - kept for compatibility
    this.applyMinimalLighting(ctx, x, y, width, height);
  }

  applyLightingAdjustments(ctx, x, y, width, height) {
    // Legacy method - kept for compatibility
    this.applyNaturalLighting(ctx, x, y, width, height);
  }

  applyPerspectiveEffects(ctx, x, y, width, height) {
    // Add subtle shadow around the face
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw a subtle border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
}

export default new FaceDetectionService();
