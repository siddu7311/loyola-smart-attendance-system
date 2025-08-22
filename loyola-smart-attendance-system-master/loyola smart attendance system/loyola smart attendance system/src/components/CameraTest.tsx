import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export const CameraTest = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionStatus(result.state);
      }
    } catch (error) {
      console.log('Permission API not supported');
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsActive(true);
          setPermissionStatus('granted');
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Camera Test
        </CardTitle>
        <CardDescription>
          Test your camera access and permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Permission Status:</span>
          {permissionStatus === 'granted' && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Granted</span>
            </div>
          )}
          {permissionStatus === 'denied' && (
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">Denied</span>
            </div>
          )}
          {permissionStatus === 'prompt' && (
            <div className="flex items-center gap-1 text-yellow-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Prompt</span>
            </div>
          )}
          {permissionStatus === 'unknown' && (
            <div className="flex items-center gap-1 text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Unknown</span>
            </div>
          )}
        </div>

        {/* Camera View */}
        {isActive && (
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isActive ? (
            <Button onClick={startCamera} className="flex-1">
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="outline" className="flex-1">
              Stop Camera
            </Button>
          )}
          <Button onClick={checkPermission} variant="outline">
            Check Permission
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Make sure your browser supports camera access</p>
          <p>• Allow camera permissions when prompted</p>
          <p>• Check that no other apps are using the camera</p>
          <p>• Use HTTPS or localhost for camera access</p>
        </div>
      </CardContent>
    </Card>
  );
};





