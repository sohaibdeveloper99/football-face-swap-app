class CleanFaceSwapService {
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

      // Load only the essential model
      await this.faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');

      this.modelsLoaded = true;
      console.log('Clean face-api.js model loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load face-api.js model:', error);
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
      const detections = await this.faceapi.detectAllFaces(
        imageElement, 
        new this.faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        })
      );

      console.log(`Detected ${detections.length} face(s)`);
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
          
          // Extract face regions
          const faceRegions = detections.map(detection => {
            const box = detection.box;
            return {
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              confidence: detection.score
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

          // Find the best face (largest)
          const bestFace = detections.reduce((best, current) => {
            const currentArea = current.box.width * current.box.height;
            const bestArea = best.box.width * best.box.height;
            return currentArea > bestArea ? current : best;
          });

          const faceRegions = detections.map(detection => ({
            x: detection.box.x,
            y: detection.box.y,
            width: detection.box.width,
            height: detection.box.height,
            confidence: detection.score
          }));

          resolve({
            originalImage: URL.createObjectURL(imageFile),
            facesDetected: detections.length,
            faceRegions: faceRegions,
            bestFaceRegion: {
              x: bestFace.box.x,
              y: bestFace.box.y,
              width: bestFace.box.width,
              height: bestFace.box.height,
              confidence: bestFace.score
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
      
      // Remove each detected face
      detections.forEach(detection => {
        const box = detection.box;
        this.removeFaceRegion(ctx, box, backgroundColor);
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
    
    // Sample from corners
    const samples = [
      [0, 0], [width-1, 0], [0, height-1], [width-1, height-1]
    ];
    
    let r = 0, g = 0, b = 0;
    for (const [x, y] of samples) {
      const index = (y * width + x) * 4;
      r += data[index];
      g += data[index + 1];
      b += data[index + 2];
    }
    
    return {
      r: Math.floor(r / 4),
      g: Math.floor(g / 4),
      b: Math.floor(b / 4)
    };
  }

  removeFaceRegion(ctx, box, backgroundColor) {
    const x = Math.max(0, box.x - box.width * 0.1);
    const y = Math.max(0, box.y - box.height * 0.1);
    const width = box.width * 1.2;
    const height = box.height * 1.2;
    
    // Fill with background color
    ctx.fillStyle = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b})`;
    ctx.fillRect(x, y, width, height);
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
            
            // Overlay each face
            for (const jerseyRegion of jerseyFaceRegions) {
              await this.overlaySingleFace(
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

  async overlaySingleFace(ctx, faceImg, jerseyRegion, faceRegion) {
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
      
      // Remove background from the face area
      this.removeBackgroundFromFace(tempCtx, faceWidth, faceHeight);
      
      // Apply clean face mask
      this.applyCleanFaceMask(tempCtx, faceWidth, faceHeight);
      
      // Draw the processed face to main canvas with high quality
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

  removeBackgroundFromFace(ctx, width, height) {
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
    
    // Remove background pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const distance = Math.sqrt(
        Math.pow(r - avgR, 2) + 
        Math.pow(g - avgG, 2) + 
        Math.pow(b - avgB, 2)
      );
      
      if (distance < 80) {
        data[i + 3] = 0; // Make transparent
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  applyCleanFaceMask(ctx, width, height) {
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
      if (distance > radius * 0.9) {
        alpha = Math.max(0, 1 - (distance - radius * 0.9) / (radius * 0.1));
      }
      
      data[i + 3] = Math.floor(data[i + 3] * alpha);
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
}

export default new CleanFaceSwapService();









