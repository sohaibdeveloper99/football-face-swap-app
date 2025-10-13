class HybridFaceSwapService {
  constructor() {
    this.modelsLoaded = false;
    this.faceapi = null;
  }

  async loadModels() {
    if (this.modelsLoaded) return true;

    try {
      // Load face-api.js from CDN
      if (!window.faceapi) {
        await this.loadFaceAPI();
      }
      this.faceapi = window.faceapi;

      // Load only the essential models
      await this.faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
      await this.faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');

      this.modelsLoaded = true;
      console.log('Hybrid face-api.js models loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load face-api.js models:', error);
      return false;
    }
  }

  async loadFaceAPI() {
    return new Promise((resolve, reject) => {
      if (window.faceapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
      script.onload = () => {
        console.log('face-api.js loaded from CDN');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load face-api.js from CDN');
        reject(new Error('Failed to load face-api.js'));
      };
      document.head.appendChild(script);
    });
  }

  async detectFaces(imageElement) {
    if (!this.modelsLoaded) {
      const loaded = await this.loadModels();
      if (!loaded) {
        throw new Error('Failed to load face detection models');
      }
    }

    try {
      const detections = await this.faceapi
        .detectAllFaces(imageElement, new this.faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks();

      console.log(`Detected ${detections.length} face(s) with landmarks`);
      return detections;
    } catch (error) {
      console.error('Error detecting faces:', error);
      throw error;
    }
  }

  async processJerseyImage(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          console.log('Processing jersey image...');
          
          const detections = await this.detectFaces(img);
          
          if (detections.length === 0) {
            resolve({
              originalImage: URL.createObjectURL(imageFile),
              processedImage: URL.createObjectURL(imageFile),
              facesDetected: 0,
              faceRegions: []
            });
            return;
          }

          // Remove faces from jersey
          const processedImageUrl = await this.removeFacesFromJersey(img, detections);
          
          // Extract face regions with landmarks - expand for full face coverage
          const faceRegions = detections.map(detection => {
            const box = detection.detection.box;
            // Expand the face region to include more area for full face replacement
            const expandedX = Math.max(0, box.x - box.width * 0.2);
            const expandedY = Math.max(0, box.y - box.height * 0.2);
            const expandedWidth = box.width * 1.4;
            const expandedHeight = box.height * 1.4;
            
            return {
              x: expandedX,
              y: expandedY,
              width: expandedWidth,
              height: expandedHeight,
              confidence: detection.detection.score,
              landmarks: detection.landmarks
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

      img.onerror = () => reject(new Error('Failed to load jersey image'));
      img.src = URL.createObjectURL(imageFile);
    });
  }

  async processFaceImage(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          console.log('Processing face image...');
          
          const detections = await this.detectFaces(img);
          
          if (detections.length === 0) {
            resolve({
              originalImage: URL.createObjectURL(imageFile),
              facesDetected: 0,
              faceRegions: [],
              bestFaceRegion: null
            });
            return;
          }

          // Find the best face (largest and highest confidence)
          const bestFace = detections.reduce((best, current) => {
            const currentArea = current.detection.box.width * current.detection.box.height;
            const bestArea = best.detection.box.width * best.detection.box.height;
            
            if (current.detection.score > best.detection.score) return current;
            if (current.detection.score === best.detection.score && currentArea > bestArea) return current;
            return best;
          });

          const faceRegions = detections.map(detection => {
            const box = detection.detection.box;
            // Expand the face region to include more area for full face replacement
            const expandedX = Math.max(0, box.x - box.width * 0.2);
            const expandedY = Math.max(0, box.y - box.height * 0.2);
            const expandedWidth = box.width * 1.4;
            const expandedHeight = box.height * 1.4;
            
            return {
              x: expandedX,
              y: expandedY,
              width: expandedWidth,
              height: expandedHeight,
              confidence: detection.detection.score,
              landmarks: detection.landmarks
            };
          });

          // Expand the best face region for full face replacement
          const bestBox = bestFace.detection.box;
          const expandedBestX = Math.max(0, bestBox.x - bestBox.width * 0.2);
          const expandedBestY = Math.max(0, bestBox.y - bestBox.height * 0.2);
          const expandedBestWidth = bestBox.width * 1.4;
          const expandedBestHeight = bestBox.height * 1.4;

          resolve({
            originalImage: URL.createObjectURL(imageFile),
            facesDetected: detections.length,
            faceRegions: faceRegions,
            bestFaceRegion: {
              x: expandedBestX,
              y: expandedBestY,
              width: expandedBestWidth,
              height: expandedBestHeight,
              confidence: bestFace.detection.score,
              landmarks: bestFace.landmarks
            }
          });

        } catch (error) {
          console.error('Error processing face image:', error);
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load face image'));
      img.src = URL.createObjectURL(imageFile);
    });
  }

  async removeFacesFromJersey(imageElement, detections) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      
      // Draw the original image
      ctx.drawImage(imageElement, 0, 0);
      
      // Sample background color from edges
      const backgroundColor = this.sampleBackgroundColor(ctx, canvas.width, canvas.height);
      
      // Remove each detected face using landmarks
      detections.forEach(detection => {
        this.removeFaceWithLandmarks(ctx, detection, backgroundColor, canvas.width, canvas.height);
      });
      
      // Convert to blob URL
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, 'image/png');
    });
  }

  sampleBackgroundColor(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Sample from corners and edges
    const samples = [
      [0, 0], [width-1, 0], [0, height-1], [width-1, height-1],
      [width/4, 0], [3*width/4, 0], [0, height/4], [width-1, height/4]
    ];
    
    let r = 0, g = 0, b = 0;
    for (const [x, y] of samples) {
      const index = (y * width + x) * 4;
      r += data[index];
      g += data[index + 1];
      b += data[index + 2];
    }
    
    return {
      r: Math.floor(r / samples.length),
      g: Math.floor(g / samples.length),
      b: Math.floor(b / samples.length)
    };
  }

  removeFaceWithLandmarks(ctx, detection, backgroundColor, imageWidth, imageHeight) {
    const box = detection.detection.box;
    const landmarks = detection.landmarks;
    
    // Create a mask based on face landmarks
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');
    maskCanvas.width = imageWidth;
    maskCanvas.height = imageHeight;
    
    // Draw face outline using landmarks
    maskCtx.beginPath();
    landmarks.positions.forEach((landmark, index) => {
      const x = landmark.x;
      const y = landmark.y;
      
      if (index === 0) {
        maskCtx.moveTo(x, y);
      } else {
        maskCtx.lineTo(x, y);
      }
    });
    maskCtx.closePath();
    maskCtx.fillStyle = 'white';
    maskCtx.fill();
    
    // Apply the mask to remove the face
    const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
    const maskData = maskCtx.getImageData(0, 0, imageWidth, imageHeight);
    const data = imageData.data;
    const mask = maskData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const maskValue = mask[i] / 255;
      
      if (maskValue > 0.1) {
        // Blend with background color
        const blendFactor = maskValue;
        data[i] = Math.floor(data[i] * (1 - blendFactor) + backgroundColor.r * blendFactor);
        data[i + 1] = Math.floor(data[i + 1] * (1 - blendFactor) + backgroundColor.g * blendFactor);
        data[i + 2] = Math.floor(data[i + 2] * (1 - blendFactor) + backgroundColor.b * blendFactor);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  async overlayFaceOnJersey(jerseyImageFile, faceImageFile, jerseyFaceRegions, faceImageDetectionResults) {
    return new Promise((resolve, reject) => {
      const jerseyImg = new Image();
      const faceImg = new Image();
      let loadedCount = 0;

      const onImageLoad = async () => {
        loadedCount++;
        if (loadedCount === 2) {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = jerseyImg.width;
            canvas.height = jerseyImg.height;
            
            // Draw jersey first
            ctx.drawImage(jerseyImg, 0, 0);
            
            // Overlay each face using landmark-based positioning
            for (const jerseyRegion of jerseyFaceRegions) {
              await this.overlayFaceWithLandmarks(
                ctx, 
                faceImg, 
                jerseyRegion, 
                faceImageDetectionResults.bestFaceRegion
              );
            }
            
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                resolve(url);
              } else {
                reject(new Error('Failed to create result image'));
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

  async overlayFaceWithLandmarks(ctx, faceImg, jerseyRegion, faceRegion) {
    return new Promise((resolve) => {
      // Extract ONLY the face area from the uploaded image
      const faceX = faceRegion.x;
      const faceY = faceRegion.y;
      const faceWidth = faceRegion.width;
      const faceHeight = faceRegion.height;
      
      // Create a temporary canvas for the face area only
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = faceWidth;
      tempCanvas.height = faceHeight;
      
      // Draw ONLY the face area from the uploaded image
      tempCtx.drawImage(
        faceImg,
        faceX, faceY, faceWidth, faceHeight,
        0, 0, faceWidth, faceHeight
      );
      
      // Remove background from the face area only
      this.removeBackgroundFromFaceArea(tempCtx, faceWidth, faceHeight);
      
      // Apply natural face mask to the face area
      this.applyNaturalFaceMask(tempCtx, faceWidth, faceHeight);
      
      // Draw ONLY the processed face area to the jersey
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(
        tempCanvas,
        0, 0, faceWidth, faceHeight,
        jerseyRegion.x, jerseyRegion.y, jerseyRegion.width, jerseyRegion.height
      );
      
      resolve();
    });
  }

  removeBackgroundFromFaceArea(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Sample background from edges of the face area
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
    
    // Remove background pixels from face area only
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const distance = Math.sqrt(
        Math.pow(r - avgR, 2) + 
        Math.pow(g - avgG, 2) + 
        Math.pow(b - avgB, 2)
      );
      
      // Remove background - make transparent
      if (distance < 100) {
        data[i + 3] = 0;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  removeBackgroundCompletely(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Sample background from edges
    const edgeSamples = [];
    for (let i = 0; i < width; i += 10) {
      edgeSamples.push([i, 0], [i, height-1]);
    }
    for (let i = 0; i < height; i += 10) {
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
    
    // Remove background pixels completely
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const distance = Math.sqrt(
        Math.pow(r - avgR, 2) + 
        Math.pow(g - avgG, 2) + 
        Math.pow(b - avgB, 2)
      );
      
      // More aggressive background removal
      if (distance < 150) {
        data[i + 3] = 0; // Make completely transparent
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  applyNaturalFaceMask(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;
    
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      let alpha = 1;
      if (distance > radius * 0.85) {
        alpha = Math.max(0, 1 - (distance - radius * 0.85) / (radius * 0.15));
      }
      
      data[i + 3] = Math.floor(data[i + 3] * alpha);
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  removeBackgroundWithLandmarks(ctx, landmarks, imageWidth, imageHeight) {
    // Get face bounds for better background removal
    let minX = imageWidth, minY = imageHeight, maxX = 0, maxY = 0;
    landmarks.positions.forEach(landmark => {
      minX = Math.min(minX, landmark.x);
      minY = Math.min(minY, landmark.y);
      maxX = Math.max(maxX, landmark.x);
      maxY = Math.max(maxY, landmark.y);
    });
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const radiusX = (maxX - minX) / 2;
    const radiusY = (maxY - minY) / 2;
    
    // Create elliptical mask for cleaner background removal
    const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % imageWidth;
      const y = Math.floor(pixelIndex / imageWidth);
      
      // Calculate distance from center using elliptical formula
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Make background transparent outside the face area
      if (distance > 0.9) {
        data[i + 3] = 0; // Make transparent
      } else if (distance > 0.8) {
        // Gradual transparency at edges
        const alpha = Math.max(0, 1 - (distance - 0.8) / 0.1);
        data[i + 3] = Math.floor(data[i + 3] * alpha);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  applyLandmarkBasedMask(ctx, landmarks, imageWidth, imageHeight) {
    // Create a smooth mask based on face landmarks with better edge handling
    const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
    const data = imageData.data;
    
    // Get face bounds for better masking
    let minX = imageWidth, minY = imageHeight, maxX = 0, maxY = 0;
    landmarks.positions.forEach(landmark => {
      minX = Math.min(minX, landmark.x);
      minY = Math.min(minY, landmark.y);
      maxX = Math.max(maxX, landmark.x);
      maxY = Math.max(maxY, landmark.y);
    });
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const radiusX = (maxX - minX) / 2;
    const radiusY = (maxY - minY) / 2;
    
    // Create elliptical mask instead of landmark-based to avoid artifacts
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % imageWidth;
      const y = Math.floor(pixelIndex / imageWidth);
      
      // Calculate distance from center using elliptical formula
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Apply smooth falloff
      let alpha = 1;
      if (distance > 0.85) {
        alpha = Math.max(0, 1 - (distance - 0.85) / 0.15);
      }
      
      data[i + 3] = Math.floor(data[i + 3] * alpha);
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
}

export default new HybridFaceSwapService();
