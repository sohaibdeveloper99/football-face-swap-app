import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { FACEMESH_TESSELATION, FACEMESH_RIGHT_EYE, FACEMESH_LEFT_EYE, FACEMESH_FACE_OVAL } from '@mediapipe/face_mesh';

class MediaPipeFaceSwapService {
  constructor() {
    this.faceMesh = null;
    this.modelsLoaded = false;
    this.faceMeshConfig = {
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    };
  }

  async loadModels() {
    if (this.modelsLoaded) return true;

    try {
      console.log('Loading MediaPipe Face Mesh models...');
      
      this.faceMesh = new FaceMesh(this.faceMeshConfig);
      
      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.modelsLoaded = true;
      console.log('MediaPipe Face Mesh models loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load MediaPipe Face Mesh models:', error);
      return false;
    }
  }

  async detectFaces(imageElement) {
    if (!this.modelsLoaded) {
      const loaded = await this.loadModels();
      if (!loaded) {
        throw new Error('Failed to load MediaPipe Face Mesh models');
      }
    }

    return new Promise((resolve, reject) => {
      try {
        // Set up results callback
        this.faceMesh.onResults((results) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            console.log(`Detected ${results.multiFaceLandmarks.length} face(s) with MediaPipe`);
            resolve(results.multiFaceLandmarks);
          } else {
            console.log('No faces detected with MediaPipe');
            resolve([]);
          }
        });

        // Process the image
        this.faceMesh.send({ image: imageElement });
        
        // Set a timeout to handle cases where no results are returned
        setTimeout(() => {
          console.log('MediaPipe detection timeout - no faces found');
          resolve([]);
        }, 5000);
        
      } catch (error) {
        console.error('Error detecting faces with MediaPipe:', error);
        reject(error);
      }
    });
  }

  async processJerseyImage(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          console.log('Processing jersey image with MediaPipe...');
          
          const landmarks = await this.detectFaces(img);
          
          if (landmarks.length === 0) {
            resolve({
              originalImage: URL.createObjectURL(imageFile),
              processedImage: URL.createObjectURL(imageFile),
              facesDetected: 0,
              faceRegions: []
            });
            return;
          }

          // Remove faces from jersey
          const processedImageUrl = await this.removeFacesFromJersey(img, landmarks);
          
          // Extract face regions from landmarks
          const faceRegions = landmarks.map(landmarkSet => {
            const bounds = this.getFaceBounds(landmarkSet, img.width, img.height);
            return {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
              landmarks: landmarkSet,
              confidence: 0.9 // MediaPipe provides high confidence
            };
          });

          resolve({
            originalImage: URL.createObjectURL(imageFile),
            processedImage: processedImageUrl,
            facesDetected: landmarks.length,
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
          console.log('Processing face image with MediaPipe...');
          
          const landmarks = await this.detectFaces(img);
          
          if (landmarks.length === 0) {
            resolve({
              originalImage: URL.createObjectURL(imageFile),
              facesDetected: 0,
              faceRegions: [],
              bestFaceRegion: null
            });
            return;
          }

          // Find the best face (largest)
          const bestFace = landmarks.reduce((best, current) => {
            const currentBounds = this.getFaceBounds(current, img.width, img.height);
            const bestBounds = this.getFaceBounds(best, img.width, img.height);
            
            const currentArea = currentBounds.width * currentBounds.height;
            const bestArea = bestBounds.width * bestBounds.height;
            
            return currentArea > bestArea ? current : best;
          });

          const faceRegions = landmarks.map(landmarkSet => {
            const bounds = this.getFaceBounds(landmarkSet, img.width, img.height);
            return {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
              landmarks: landmarkSet,
              confidence: 0.9
            };
          });

          const bestFaceBounds = this.getFaceBounds(bestFace, img.width, img.height);

          resolve({
            originalImage: URL.createObjectURL(imageFile),
            facesDetected: landmarks.length,
            faceRegions: faceRegions,
            bestFaceRegion: {
              x: bestFaceBounds.x,
              y: bestFaceBounds.y,
              width: bestFaceBounds.width,
              height: bestFaceBounds.height,
              landmarks: bestFace,
              confidence: 0.9
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

  getFaceBounds(landmarks, imageWidth, imageHeight) {
    let minX = imageWidth;
    let minY = imageHeight;
    let maxX = 0;
    let maxY = 0;

    landmarks.forEach(landmark => {
      const x = landmark.x * imageWidth;
      const y = landmark.y * imageHeight;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });

    // Add padding
    const padding = 0.1;
    const width = maxX - minX;
    const height = maxY - minY;
    
    return {
      x: Math.max(0, minX - width * padding),
      y: Math.max(0, minY - height * padding),
      width: width * (1 + 2 * padding),
      height: height * (1 + 2 * padding)
    };
  }

  async removeFacesFromJersey(imageElement, landmarks) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      
      // Draw the original image
      ctx.drawImage(imageElement, 0, 0);
      
      // Sample background color from edges
      const backgroundColor = this.sampleBackgroundColor(ctx, canvas.width, canvas.height);
      
      // Remove each detected face using precise landmarks
      landmarks.forEach(landmarkSet => {
        this.removeFaceWithLandmarks(ctx, landmarkSet, backgroundColor, canvas.width, canvas.height);
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

  removeFaceWithLandmarks(ctx, landmarks, backgroundColor, imageWidth, imageHeight) {
    // Create a mask based on face landmarks
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');
    maskCanvas.width = imageWidth;
    maskCanvas.height = imageHeight;
    
    // Draw face outline using landmarks
    maskCtx.beginPath();
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * imageWidth;
      const y = landmark.y * imageHeight;
      
      if (index === 0) {
        maskCtx.moveTo(x, y);
      } else {
        maskCtx.lineTo(x, y);
      }
    });
    maskCtx.closePath();
    maskCtx.fillStyle = 'white';
    maskCtx.fill();
    
    // Apply Gaussian blur to the mask for smooth edges
    maskCtx.filter = 'blur(10px)';
    maskCtx.drawImage(maskCanvas, 0, 0);
    
    // Use the mask to remove the face
    const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
    const maskData = maskCtx.getImageData(0, 0, imageWidth, imageHeight);
    const data = imageData.data;
    const mask = maskData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const maskValue = mask[i] / 255; // Normalize to 0-1
      
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
            
            // Overlay each face using precise landmark-based positioning
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
      // Create a temporary canvas for face processing
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = faceImg.width;
      tempCanvas.height = faceImg.height;
      
      // Draw the face image to temp canvas
      tempCtx.drawImage(faceImg, 0, 0);
      
      // Apply background removal using landmarks
      this.removeBackgroundWithLandmarks(tempCtx, faceRegion.landmarks, faceImg.width, faceImg.height);
      
      // Apply precise face mask using landmarks
      this.applyLandmarkBasedMask(tempCtx, faceRegion.landmarks, faceImg.width, faceImg.height);
      
      // Draw the processed face to main canvas with high quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(
        tempCanvas,
        0, 0, faceImg.width, faceImg.height,
        jerseyRegion.x, jerseyRegion.y, jerseyRegion.width, jerseyRegion.height
      );
      
      resolve();
    });
  }

  removeBackgroundWithLandmarks(ctx, landmarks, imageWidth, imageHeight) {
    // Create a mask based on face landmarks
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');
    maskCanvas.width = imageWidth;
    maskCanvas.height = imageHeight;
    
    // Draw face outline using landmarks
    maskCtx.beginPath();
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * imageWidth;
      const y = landmark.y * imageHeight;
      
      if (index === 0) {
        maskCtx.moveTo(x, y);
      } else {
        maskCtx.lineTo(x, y);
      }
    });
    maskCtx.closePath();
    maskCtx.fillStyle = 'white';
    maskCtx.fill();
    
    // Apply the mask to remove background
    const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
    const maskData = maskCtx.getImageData(0, 0, imageWidth, imageHeight);
    const data = imageData.data;
    const mask = maskData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const maskValue = mask[i] / 255;
      
      if (maskValue < 0.1) {
        // Make background transparent
        data[i + 3] = 0;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  applyLandmarkBasedMask(ctx, landmarks, imageWidth, imageHeight) {
    // Create a smooth mask based on face landmarks
    const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
    const data = imageData.data;
    
    // Create a distance field from face landmarks
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % imageWidth;
      const y = Math.floor(pixelIndex / imageWidth);
      
      // Find minimum distance to any landmark
      let minDistance = Infinity;
      landmarks.forEach(landmark => {
        const lx = landmark.x * imageWidth;
        const ly = landmark.y * imageHeight;
        const distance = Math.sqrt(Math.pow(x - lx, 2) + Math.pow(y - ly, 2));
        minDistance = Math.min(minDistance, distance);
      });
      
      // Apply smooth falloff
      const maxDistance = Math.min(imageWidth, imageHeight) * 0.3;
      let alpha = 1;
      if (minDistance > maxDistance * 0.7) {
        alpha = Math.max(0, 1 - (minDistance - maxDistance * 0.7) / (maxDistance * 0.3));
      }
      
      data[i + 3] = Math.floor(data[i + 3] * alpha);
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
}

export default new MediaPipeFaceSwapService();
