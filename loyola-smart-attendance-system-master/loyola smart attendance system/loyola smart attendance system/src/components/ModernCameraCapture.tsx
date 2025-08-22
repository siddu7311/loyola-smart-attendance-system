import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, RotateCcw, Check, X, Image as ImageIcon, SwitchCamera, Zap, AlertCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { faceRecognitionService } from '@/utils/faceRecognitionService';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Update the ModernCameraCapture props interface
interface ModernCameraCaptureProps {
  onImagesCapture?: (images: string[], features?: Float32Array) => void;
  onImageCapture?: (imageDataUrl: string, features: Float32Array | null) => Promise<void>;
  maxImages?: number;
  onClose?: () => void;
  captureMode?: string;
  showHelp?: boolean;
}

export const ModernCameraCapture = ({ onImagesCapture, onImageCapture, maxImages = 3, onClose, captureMode = 'single', showHelp = false }: ModernCameraCaptureProps) => {
  const [isActive, setIsActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState<any[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureAudioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Initialize video element when component mounts
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded');
      });
      video.addEventListener('canplay', () => {
        console.log('Video can play');
      });
      video.addEventListener('error', (e) => {
        console.error('Video error:', e);
      });
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraReady(false);
      setIsActive(false);
      setCameraError(null);
      setIsCameraLoading(true);
      
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Set active first to ensure video element is rendered
      setIsActive(true);
      
      // Wait for video element to be available
      let video = videoRef.current;
      let attempts = 0;
      
      while (!video && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 50));
        video = videoRef.current;
        attempts++;
      }

      if (!video) {
        setIsActive(false);
        throw new Error('Video element not available after multiple attempts');
      }

      console.log('Video element confirmed ready');
      setDebugInfo(prev => [...prev, 'Video element ready']);

      // Try different camera constraints
      const constraints = [
        {
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            facingMode: facingMode
          },
          audio: false
        },
        {
          video: {
            width: { min: 320, ideal: 640 },
            height: { min: 240, ideal: 480 },
            facingMode: facingMode
          },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];

      let mediaStream: MediaStream | null = null;
      let lastError: Error | null = null;

      for (const constraint of constraints) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
          console.log('Media stream obtained with constraints:', constraint);
          break;
        } catch (error) {
          lastError = error as Error;
          console.log('Failed with constraints:', constraint, error);
          continue;
        }
      }

      if (!mediaStream) {
        throw lastError || new Error('Failed to access camera with any constraints');
      }

      console.log('Media stream obtained');
      setDebugInfo(prev => [...prev, 'Media stream obtained']);

      // Set up video element
      video.srcObject = mediaStream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      
      // Wait for video to be ready with multiple fallbacks
      let videoReady = false;
      let loadAttempts = 0;
      
      while (!videoReady && loadAttempts < 15) {
        try {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Load timeout')), 3000);
            
            const onReady = () => {
              video.removeEventListener('loadedmetadata', onReady);
              video.removeEventListener('canplay', onReady);
              video.removeEventListener('loadeddata', onReady);
              clearTimeout(timeout);
              resolve();
            };
            
            video.addEventListener('loadedmetadata', onReady);
            video.addEventListener('canplay', onReady);
            video.addEventListener('loadeddata', onReady);
            
            // Try to play immediately
            video.play().then(() => {
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                onReady();
              }
            }).catch(() => {
              // Will be handled by timeout or event listeners
            });
          });
          
          videoReady = true;
        } catch (error) {
          loadAttempts++;
          console.log(`Video load attempt ${loadAttempts} failed:`, error);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (!videoReady) {
        throw new Error('Video failed to initialize after multiple attempts');
      }

      setStream(mediaStream);
      setIsActive(true);
      setCameraReady(true);
      setCameraError(null);
      setIsCameraLoading(false);
      
      toast({
        title: "Camera Ready! 📸",
        description: "Camera is now active and ready to capture photos.",
      });

    } catch (error) {
      console.error('Camera error:', error);
      
      // Cleanup on error
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setIsActive(false);
      setCameraReady(false);
      setIsCameraLoading(false);
      
      let errorMessage = "Failed to access camera. ";
      setCameraError(errorMessage);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += "Please allow camera permissions and refresh the page.";
        } else if (error.name === 'NotFoundError') {
          errorMessage += "No camera device found. Please check if your camera is connected.";
        } else if (error.name === 'NotReadableError') {
          errorMessage += "Camera is being used by another application. Please close other apps using the camera.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage += "Camera not supported in this browser. Please use a modern browser.";
        } else if (error.message.includes('Camera API not supported')) {
          errorMessage = "Camera API not supported in this browser. Please use Chrome, Firefox, Safari, or Edge.";
        } else {
          errorMessage += error.message;
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [facingMode, stream, toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setCameraReady(false);
  }, [stream]);

  const checkCameraPermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state;
    } catch (error) {
      console.log('Permission API not supported');
      return 'unknown';
    }
  }, []);

  const switchCamera = useCallback(() => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (isActive) {
      stopCamera();
      setTimeout(() => startCamera(), 500);
    }
  }, [facingMode, isActive, stopCamera, startCamera]);

  // In the useEffect for initialization
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize the new face recognition service
        await faceRecognitionService.initialize();
        console.log('Face recognition service initialized');
      } catch (error) {
        console.error('Failed to initialize face recognition service:', error);
      }
    };
  
    initializeServices();
  }, []);

  // Helper function to calculate average features from multiple face features
  const calculateAverageFeatures = (features: Float32Array[]): Float32Array => {
    if (features.length === 0) return new Float32Array();
    
    const length = features[0].length;
    const avgFeatures = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (const feature of features) {
        sum += feature[i];
      }
      avgFeatures[i] = sum / features.length;
    }
    
    return avgFeatures;
  };

  // Define captureImage inside the component
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCameraLoading || !stream) {
      console.error('Cannot capture: camera not ready');
      toast({
        title: "Camera Not Ready",
        description: "Please wait for the camera to initialize or try restarting the camera.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCapturing(true);
      setIsProcessing(true);
      
      // Draw the current video frame to the canvas
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get the image data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Use the unified face recognition service to extract features
      let faceFeatures: Float32Array | null = null;
      
      try {
        console.log('Attempting to extract face features...');
        faceFeatures = await faceRecognitionService.extractFeatures(imageDataUrl);
        console.log('Face features extracted successfully using unified service');
        
        // Add the captured image to the list
        const newImage = {
          id: Date.now().toString(),
          dataUrl: imageDataUrl,
          faceFeatures: faceFeatures
        };
        
        setCapturedImages(prev => [...prev, newImage]);
        
        // If we're capturing multiple images for averaging
        if (captureMode === 'multiple') {
          // If we have enough images, calculate the average features
          if (capturedImages.length + 1 >= 3) { // +1 for the new image
            const allFeatures = [...capturedImages, newImage]
              .map(img => img.faceFeatures)
              .filter((features): features is Float32Array => features !== null);
            
            if (allFeatures.length > 0) {
              // Calculate average features
              const averageFeatures = calculateAverageFeatures(allFeatures);
              if (onImageCapture) {
                await onImageCapture(imageDataUrl, averageFeatures);
              }
            }
          }
        } else {
          // Single capture mode - use the features directly
          if (onImageCapture) {
            await onImageCapture(imageDataUrl, faceFeatures);
          }
        }
        
        // Play capture sound
        if (captureAudioRef.current) {
          captureAudioRef.current.play().catch(e => console.log('Audio play error:', e));
        }
        
        toast({
          title: "Image Captured!",
          description: "Face detected and features extracted successfully.",
        });
        
      } catch (error) {
        console.error('Failed to extract face features:', error);
        toast({
          title: "Feature Extraction Failed",
          description: "Could not detect a face or extract features. Please try again with better lighting and positioning.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
      setIsProcessing(false);
    }
  }, [videoRef, canvasRef, isCameraLoading, stream, captureMode, capturedImages, onImageCapture, toast]);

  const processImagesForFaceRecognition = async (images: string[]) => {
    try {
      toast({
        title: "Processing Images",
        description: "Training AI face recognition model...",
      });

      const faceFeatures = [];
      
      for (const image of images) {
        try {
          const features = await faceRecognitionService.extractFeatures(image);
          if (features) {
            faceFeatures.push(features);
          }
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }
      
      if (faceFeatures.length > 0) {
        const avgFeatures = new Float32Array(faceFeatures[0].length);
        for (let i = 0; i < avgFeatures.length; i++) {
          let sum = 0;
          for (const features of faceFeatures) {
            sum += features[i];
          }
          avgFeatures[i] = sum / faceFeatures.length;
        }
        
        toast({
          title: "Success! 🎉",
          description: "Face recognition training completed successfully.",
        });
        
        onImagesCapture(images, avgFeatures);
      } else {
        onImagesCapture(images);
      }
    } catch (error) {
      console.error('Processing error:', error);
      onImagesCapture(images);
    }
  };

  const removeImage = (index: number) => {
    const newImages = capturedImages.filter((_, i) => i !== index);
    setCapturedImages(newImages);
    onImagesCapture(newImages);
  };

  const retakePhotos = () => {
    setCapturedImages([]);
    onImagesCapture([]);
    if (!isActive) {
      startCamera();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="loyola-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Modern Camera System
            <Badge variant="secondary" className="ml-2">AI-Powered</Badge>
          </CardTitle>
          <CardDescription>
            Advanced facial capture with real-time processing and modern camera controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Camera Controls */}
          <div className="flex flex-wrap justify-center gap-4">
            {!isActive ? (
              <>
                <Button onClick={startCamera} className="loyola-btn-primary">
                  <Camera className="w-4 h-4 mr-2" />
                  Start {facingMode === 'user' ? 'Front' : 'Back'} Camera
                </Button>
                <Button onClick={switchCamera} variant="outline">
                  <SwitchCamera className="w-4 h-4 mr-2" />
                  Switch Camera
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={captureImage} 
                  disabled={!cameraReady || isProcessing}
                  className="loyola-btn-primary"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Capture Photo'}
                </Button>
                <Button onClick={switchCamera} variant="outline">
                  <SwitchCamera className="w-4 h-4 mr-2" />
                  Switch Camera
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Stop Camera
                </Button>
                <Button onClick={retakePhotos} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake All
                </Button>
              </>
            )}
          </div>

          {/* Camera View */}
          <div className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
            isActive 
              ? 'bg-slate-900 border-primary/30' 
              : 'bg-slate-100 border-slate-200'
          }`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-auto max-h-[500px] object-cover transition-opacity duration-300 ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            />
            
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Placeholder when camera is not active */}
            {!isActive && (
              <div className="flex items-center justify-center h-64 bg-slate-100">
                <div className="text-center text-slate-500">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Camera not active</p>
                </div>
              </div>
            )}
            
            {/* Status Indicator */}
            {isActive && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/80 text-white px-3 py-1 rounded-full text-sm">
                <div className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                {cameraReady ? 'READY' : 'LOADING'}
              </div>
            )}
            
            {/* Face Frame */}
            {isActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-80 border-2 border-blue-400 rounded-2xl">
                  <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-green-400"></div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-green-400"></div>
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-green-400"></div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-green-400"></div>
                  
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                    ALIGN FACE
                  </div>
                </div>
              </div>
            )}
            
            {/* Instructions */}
            {isActive && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-4 py-2 rounded-full text-sm">
                Position face in frame and click Capture
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: maxImages }).map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index < capturedImages.length ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Captured Images */}
          {capturedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-secondary" />
                <h3 className="font-semibold">Captured Photos ({capturedImages.length}/{maxImages})</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {capturedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.dataUrl}
                      alt={`Captured ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-primary/20"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 w-6 p-0 rounded-full"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <Badge className="absolute bottom-2 left-2 bg-primary/80 text-primary-foreground text-xs">
                      Photo {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Camera Help Section */}
          {!isActive && cameraError && (
            <Alert className="border-orange-200 bg-orange-50">
              <HelpCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="space-y-2">
                  <p className="font-semibold">Camera Access Help:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Make sure your browser has permission to access the camera</li>
                    <li>Check that no other applications are using your camera</li>
                    <li>Try refreshing the page if camera access was denied</li>
                    <li>Use a modern browser (Chrome, Firefox, Safari, Edge)</li>
                    <li>Ensure you're on HTTPS or localhost (camera access requirement)</li>
                    <li>Click the camera icon in your browser's address bar to check permissions</li>
                  </ul>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                      onClick={() => startCamera()}
                    >
                      Try Again
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </Button>
                  </div>
                  
                  {/* Debug Info */}
                  {debugInfo.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium">Debug Info</summary>
                      <div className="mt-2 p-2 bg-white rounded text-xs font-mono">
                        {debugInfo.map((info, index) => (
                          <div key={index}>{info}</div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Tips */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              Modern Photography Tips
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Ensure bright, even lighting on face</li>
              <li>• Keep device steady for sharp captures</li>
              <li>• Position face within the alignment frame</li>
              <li>• Take photos from slightly different angles</li>
              <li>• Remove glasses/masks for better recognition</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
