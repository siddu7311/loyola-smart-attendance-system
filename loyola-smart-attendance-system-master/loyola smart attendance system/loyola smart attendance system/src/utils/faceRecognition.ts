// Face Recognition Utilities for Loyola Smart Attendance System

export interface FaceDetection {
  id: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: Array<{
    x: number;
    y: number;
    type: string;
  }>;
}

export interface StudentFaceData {
  id: string;
  name: string;
  pinNumber: string;
  faceDescriptor: Float32Array;
  photos: string[];
}

export class FaceRecognitionService {
  private isInitialized = false;
  private studentDatabase: StudentFaceData[] = [];
  
  async initialize(): Promise<boolean> {
    try {
      // In a real implementation, this would load face-api.js models
      // For demo purposes, we'll simulate initialization
      console.log('Initializing face recognition models...');
      
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.isInitialized = true;
      console.log('Face recognition initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize face recognition:', error);
      return false;
    }
  }

  async detectFaces(videoElement: HTMLVideoElement): Promise<FaceDetection[]> {
    if (!this.isInitialized) {
      throw new Error('Face recognition not initialized');
    }

    // In a real implementation, this would use face-api.js
    // For demo purposes, we'll simulate face detection
    const detections: FaceDetection[] = [];
    
    // Simulate random face detection
    const numFaces = Math.floor(Math.random() * 3) + 1; // 1-3 faces
    
    for (let i = 0; i < numFaces; i++) {
      detections.push({
        id: `face_${Date.now()}_${i}`,
        confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
        boundingBox: {
          x: Math.random() * (videoElement.videoWidth * 0.5),
          y: Math.random() * (videoElement.videoHeight * 0.5),
          width: 100 + Math.random() * 50,
          height: 120 + Math.random() * 60
        },
        landmarks: this.generateFakeLandmarks()
      });
    }

    return detections;
  }

  async recognizeFaces(detections: FaceDetection[]): Promise<Array<{
    detection: FaceDetection;
    student: StudentFaceData | null;
    confidence: number;
  }>> {
    if (!this.isInitialized) {
      throw new Error('Face recognition not initialized');
    }

    const results = [];

    for (const detection of detections) {
      // Simulate face recognition matching
      const matchedStudent = this.findBestMatch(detection);
      
      results.push({
        detection,
        student: matchedStudent?.student || null,
        confidence: matchedStudent?.confidence || 0
      });
    }

    return results;
  }

  addStudentToDatabase(studentData: StudentFaceData): void {
    const existingIndex = this.studentDatabase.findIndex(s => s.id === studentData.id);
    
    if (existingIndex >= 0) {
      this.studentDatabase[existingIndex] = studentData;
    } else {
      this.studentDatabase.push(studentData);
    }
  }

  removeStudentFromDatabase(studentId: string): boolean {
    const index = this.studentDatabase.findIndex(s => s.id === studentId);
    
    if (index >= 0) {
      this.studentDatabase.splice(index, 1);
      return true;
    }
    
    return false;
  }

  getStudentDatabase(): StudentFaceData[] {
    return [...this.studentDatabase];
  }

  private findBestMatch(detection: FaceDetection): {
    student: StudentFaceData;
    confidence: number;
  } | null {
    // In a real implementation, this would compare face descriptors
    // For demo purposes, we'll simulate matching
    
    if (this.studentDatabase.length === 0) {
      return null;
    }

    // Simulate random matching with varying confidence
    if (Math.random() > 0.7) { // 30% chance of no match
      return null;
    }

    const randomStudent = this.studentDatabase[
      Math.floor(Math.random() * this.studentDatabase.length)
    ];

    return {
      student: randomStudent,
      confidence: 0.75 + Math.random() * 0.25 // 75-100% confidence
    };
  }

  private generateFakeLandmarks() {
    // Generate fake facial landmarks for demo
    const landmarks = [
      'left_eye', 'right_eye', 'nose', 'mouth_left', 'mouth_right'
    ];

    return landmarks.map(type => ({
      x: Math.random() * 200,
      y: Math.random() * 200,
      type
    }));
  }

  async capturePhotoFromVideo(videoElement: HTMLVideoElement): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  async processImageForFaceData(imageData: string): Promise<Float32Array> {
    // In a real implementation, this would extract face descriptors
    // For demo purposes, we'll return a fake descriptor
    const descriptor = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      descriptor[i] = Math.random() * 2 - 1; // Random values between -1 and 1
    }
    return descriptor;
  }
}

// Global instance
export const faceRecognitionService = new FaceRecognitionService();

// Utility functions
export const getCameraStream = async (constraints?: MediaStreamConstraints): Promise<MediaStream> => {
  const defaultConstraints: MediaStreamConstraints = {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: 'user'
    },
    audio: false
  };

  try {
    return await navigator.mediaDevices.getUserMedia(constraints || defaultConstraints);
  } catch (error) {
    console.error('Error accessing camera:', error);
    throw new Error('Camera access denied or not available');
  }
};

export const stopCameraStream = (stream: MediaStream): void => {
  stream.getTracks().forEach(track => {
    track.stop();
  });
};

export const drawFaceDetections = (
  canvas: HTMLCanvasElement,
  detections: FaceDetection[],
  recognitionResults?: Array<{
    detection: FaceDetection;
    student: StudentFaceData | null;
    confidence: number;
  }>
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  detections.forEach((detection, index) => {
    const { x, y, width, height } = detection.boundingBox;
    const recognitionResult = recognitionResults?.[index];

    // Draw bounding box
    ctx.strokeStyle = recognitionResult?.student ? '#10B981' : '#EF4444'; // Green if recognized, red if not
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Draw confidence and name
    ctx.fillStyle = recognitionResult?.student ? '#10B981' : '#EF4444';
    ctx.font = '14px Inter, sans-serif';
    
    const label = recognitionResult?.student 
      ? `${recognitionResult.student.name} (${(recognitionResult.confidence * 100).toFixed(1)}%)`
      : `Unknown (${(detection.confidence * 100).toFixed(1)}%)`;
    
    const textWidth = ctx.measureText(label).width;
    
    // Draw background for text
    ctx.fillRect(x, y - 25, textWidth + 10, 20);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.fillText(label, x + 5, y - 10);

    // Draw landmarks if available
    if (detection.landmarks) {
      ctx.fillStyle = '#FBBF24'; // Yellow for landmarks
      detection.landmarks.forEach(landmark => {
        ctx.beginPath();
        ctx.arc(landmark.x, landmark.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  });
};