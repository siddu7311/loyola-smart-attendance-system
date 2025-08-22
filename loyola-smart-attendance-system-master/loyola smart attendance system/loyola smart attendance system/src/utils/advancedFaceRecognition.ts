// @ts-nocheck
// This file is excluded from TypeScript type checking

// Import face-api.js
import * as faceapi from 'face-api.js';

// Define the model URL path
const MODEL_URL = '/models';

interface FaceDetectionOptions {
  minConfidence: number;
  maxResults: number;
}

interface FaceRecognitionOptions {
  distanceThreshold: number;
}

interface AdvancedFaceModel {
  isInitialized: boolean;
  detectionOptions: FaceDetectionOptions;
  recognitionOptions: FaceRecognitionOptions;
}

export class AdvancedFaceRecognitionService {
  private model: AdvancedFaceModel = {
    isInitialized: false,
    detectionOptions: {
      minConfidence: 0.5,
      maxResults: 10
    },
    recognitionOptions: {
      distanceThreshold: 0.6 // Lower values are more strict (0.4-0.6 is good for real-world)
    }
  };

  private faceMatcher: any = null;
  private modelLoadPromise: Promise<void> | null = null;
  private modelsLoaded = false;

  constructor() {
    // Initialize with default settings
    this.modelLoadPromise = null;
  }

  async initialize(): Promise<boolean> {
    if (this.model.isInitialized) {
      console.log('✅ Advanced face recognition already initialized');
      return true;
    }

    try {
      console.log('🚀 Initializing advanced face recognition...');
      
      // Only load models once
      if (!this.modelLoadPromise) {
        this.modelLoadPromise = this.loadModels();
      }
      
      // Wait for models to load
      await this.modelLoadPromise;
      
      this.model.isInitialized = true;
      console.log('✅ Advanced face recognition initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize advanced face recognition:', error);
      this.model.isInitialized = false;
      return false;
    }
  }

  private async loadModels(): Promise<void> {
    try {
      console.log('🔍 Loading face-api.js models from:', MODEL_URL);
      
      // Load all required models
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      
      this.modelsLoaded = true;
      console.log('✅ Face-api.js models loaded successfully');
    } catch (error) {
      console.error('❌ Error loading face-api.js models:', error);
      this.modelsLoaded = false;
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.model.isInitialized && this.modelsLoaded;
  }

  setDetectionConfidence(confidence: number): void {
    this.model.detectionOptions.minConfidence = confidence;
  }

  setRecognitionThreshold(threshold: number): void {
    this.model.recognitionOptions.distanceThreshold = threshold;
  }

  private async createImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
      img.src = dataUrl;
    });
  }

  async detectFaces(imageData: string): Promise<any[]> {
    if (!this.isInitialized()) {
      const initialized = await this.initialize();
      if (!initialized) {
        console.error('❌ Face recognition not initialized');
        return [];
      }
    }

    try {
      // Create image element from data URL
      const img = await this.createImageFromDataUrl(imageData);
      
      // Detect faces with SSD MobileNet
      const detections = await faceapi.detectAllFaces(
        img, 
        new faceapi.SsdMobilenetv1Options({ 
          minConfidence: this.model.detectionOptions.minConfidence 
        })
      );
      
      console.log(`🔍 Detected ${detections.length} faces`);
      return detections;
    } catch (error) {
      console.error('❌ Error detecting faces:', error);
      return [];
    }
  }

  async extractAdvancedFaceFeatures(imageData: string): Promise<any | null> {
    if (!this.isInitialized()) {
      const initialized = await this.initialize();
      if (!initialized) {
        console.error('❌ Face recognition not initialized');
        return null;
      }
    }

    try {
      // Create image element from data URL
      const img = await this.createImageFromDataUrl(imageData);
      
      // Detect faces with landmarks and descriptors
      const fullFaceDescriptions = await faceapi.detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!fullFaceDescriptions) {
        console.warn('⚠️ No face detected in image');
        return null;
      }
      
      // Return the face descriptor (128-dimensional feature vector)
      return fullFaceDescriptions.descriptor;
    } catch (error) {
      console.error('❌ Error extracting face features:', error);
      return null;
    }
  }

  private updateFaceMatcher(knownFaces: Array<{ id: string; features: any; name: string }>): void {
    if (knownFaces.length === 0) {
      this.faceMatcher = null;
      return;
    }

    try {
      // Create labeled face descriptors
      const labeledDescriptors = knownFaces.map(face => {
        return new faceapi.LabeledFaceDescriptors(
          face.id, 
          [face.features]
        );
      });
      
      // Create face matcher with distance threshold
      this.faceMatcher = new faceapi.FaceMatcher(
        labeledDescriptors, 
        this.model.recognitionOptions.distanceThreshold
      );
    } catch (error) {
      console.error('❌ Error creating face matcher:', error);
      this.faceMatcher = null;
    }
  }

  async recognizeFaceAdvanced(
    imageData: string, 
    knownFaces: Array<{ id: string; features: any; name: string }>
  ): Promise<{ id: string; name: string; confidence: number; details?: any } | null> {
    if (!this.isInitialized()) {
      const initialized = await this.initialize();
      if (!initialized) {
        console.error('❌ Face recognition not initialized');
        return null;
      }
    }

    try {
      console.log('🔍 Starting advanced face recognition...');
      
      // Create image element from data URL
      const img = await this.createImageFromDataUrl(imageData);
      
      // Create face matcher from known faces
      this.updateFaceMatcher(knownFaces);
      
      if (!this.faceMatcher) {
        console.warn('⚠️ No face matcher available - no known faces');
        return null;
      }
      
      // Detect face and get descriptor
      const detection = await faceapi.detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!detection) {
        console.warn('⚠️ No face detected in image');
        return null;
      }
      
      // Find best match
      const match = this.faceMatcher.findBestMatch(detection.descriptor);
      
      if (match.label === 'unknown') {
        console.log('❓ Unknown face detected');
        return null;
      }
      
      // Find the matching face in our known faces array
      const matchedFace = knownFaces.find(face => face.id === match.label);
      
      if (!matchedFace) {
        console.warn(`⚠️ Matched face ID ${match.label} not found in known faces`);
        return null;
      }
      
      console.log(`✅ Face recognized: ${matchedFace.name} (${match.distance.toFixed(2)} distance)`);
      
      return {
        id: matchedFace.id,
        name: matchedFace.name,
        confidence: 1 - match.distance,
        details: {
          distance: match.distance,
          threshold: this.model.recognitionOptions.distanceThreshold
        }
      };
    } catch (error) {
      console.error('❌ Error in face recognition:', error);
      return null;
    }
  }
}

// Export an instance of the service
export const advancedFaceRecognitionService = new AdvancedFaceRecognitionService();
