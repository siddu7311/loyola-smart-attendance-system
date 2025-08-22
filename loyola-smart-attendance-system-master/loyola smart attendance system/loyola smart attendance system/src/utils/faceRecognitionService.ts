import * as faceapi from 'face-api.js';

// Path to the models
const MODEL_URL = '/models';

class FaceRecognitionService {
  private initialized = false;
  private detectionConfidence = 0.4; // Default value
  private recognitionThreshold = 0.5; // Default value

  /**
   * Initializes the face recognition service by loading the required models.
   * Ensures that models are only loaded once.
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      console.log('Initializing face recognition models...');
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      this.initialized = true;
      console.log('✅ Face recognition service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize face recognition models:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Checks if the face recognition service is initialized.
   * @returns True if the service is initialized, false otherwise.
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Sets the detection confidence for face detection.
   * @param confidence The confidence value between 0 and 1.
   */
  setDetectionConfidence(confidence: number): void {
    this.detectionConfidence = confidence;
    console.log(`Detection confidence set to ${confidence}`);
  }

  /**
   * Sets the recognition threshold for face recognition.
   * @param threshold The threshold value between 0 and 1.
   */
  setRecognitionThreshold(threshold: number): void {
    this.recognitionThreshold = threshold;
    console.log(`Recognition threshold set to ${threshold}`);
  }

  /**
   * Helper to convert a data URL to an HTMLImageElement.
   * @param imageDataUrl The data URL of the image.
   * @returns A promise that resolves to the HTMLImageElement.
   */
  private async getImage(imageDataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = imageDataUrl;
    });
  }

  /**
   * Detects faces in an image.
   * @param imageDataUrl The data URL of the image.
   * @returns The number of faces detected.
   */
  async detectFaces(imageDataUrl: string): Promise<number> {
    if (!this.initialized) await this.initialize();
    
    try {
      const image = await this.getImage(imageDataUrl);
      const detections = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: this.detectionConfidence }));
      console.log(`Detected ${detections.length} faces.`);
      return detections.length;
    } catch (error) {
      console.error('Error detecting faces:', error);
      return 0;
    }
  }

  /**
   * Extracts the face descriptor (features) from an image.
   * @param imageDataUrl The data URL of the image.
   * @returns The face descriptor or null if no face is detected.
   */
  async extractFeatures(imageDataUrl: string): Promise<Float32Array | null> {
    if (!this.initialized) await this.initialize();
    
    try {
      const image = await this.getImage(imageDataUrl);
      const detection = await faceapi.detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: this.detectionConfidence }))
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      if (!detection) {
        console.warn('No face detected for feature extraction.');
        return null;
      }
      return detection.descriptor;
    } catch (error) {
      console.error('Error extracting face features:', error);
      return null;
    }
  }

  /**
   * Recognizes a face by comparing it against a list of known faces.
   * @param imageDataUrl The data URL of the image.
   * @param knownFaces An array of known faces with their descriptors.
   * @returns The best match or null if no match is found.
   */
  async recognizeFace(imageDataUrl: string, knownFaces: { id: string; name: string; features: Float32Array }[]): Promise<{ id: string; name: string; confidence: number } | null> {
    if (knownFaces.length === 0) {
        return null;
    }
    
    const features = await this.extractFeatures(imageDataUrl);
    if (!features) {
      return null;
    }

    const labeledDescriptors = knownFaces.map(
      (face) => new faceapi.LabeledFaceDescriptors(face.id, [face.features])
    );

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, this.recognitionThreshold);
    
    const image = await this.getImage(imageDataUrl);
    const detection = await faceapi.detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: this.detectionConfidence }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
      if (bestMatch.label === 'unknown') {
        return null;
      }

      const matchedFace = knownFaces.find((face) => face.id === bestMatch.label);
      if (!matchedFace) {
          return null;
      }

      return {
        id: matchedFace.id,
        name: matchedFace.name,
        confidence: 1 - bestMatch.distance,
      };
    } else {
      return null;
    }
  }
}

// Export a singleton instance of the service
export const faceRecognitionService = new FaceRecognitionService();
