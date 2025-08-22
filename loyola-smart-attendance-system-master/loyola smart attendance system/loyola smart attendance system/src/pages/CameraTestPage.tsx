import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const CameraTestPage = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const addDebugLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addDebugLog('Page loaded');
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      addDebugLog('Checking camera permission...');
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionStatus(result.state);
        addDebugLog(`Permission status: ${result.state}`);
      } else {
        addDebugLog('Permission API not supported');
      }
    } catch (error) {
      addDebugLog(`Permission check error: ${error}`);
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      addDebugLog('Starting camera...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      addDebugLog('Camera API supported');

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });

      addDebugLog('Media stream obtained');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          addDebugLog('Video metadata loaded');
          setIsActive(true);
          setPermissionStatus('granted');
        };
        videoRef.current.oncanplay = () => {
          addDebugLog('Video can play');
        };
        videoRef.current.onerror = (e) => {
          addDebugLog(`Video error: ${e}`);
        };
      } else {
        addDebugLog('Video element not found');
      }
    } catch (error) {
      console.error('Camera error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      addDebugLog(`Camera error: ${errorMessage}`);
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    addDebugLog('Stopping camera...');
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    addDebugLog('Camera stopped');
  };

  const testSimpleCamera = async () => {
    try {
      addDebugLog('Testing simple camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      addDebugLog('Simple camera test successful');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      addDebugLog(`Simple camera test failed: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link to="/faculty" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4" />
            Back to Faculty Dashboard
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Camera Diagnostic Tool
            </CardTitle>
            <CardDescription>
              Test your camera access and permissions to diagnose issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Permission Status */}
            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
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
            <div className="relative rounded-lg overflow-hidden bg-black border-2 border-gray-300">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Camera not active</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Controls */}
            <div className="flex flex-wrap gap-2">
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
              <Button onClick={testSimpleCamera} variant="outline">
                Test Simple Access
              </Button>
            </div>

            {/* Debug Log */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium">Debug Log</summary>
              <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono max-h-40 overflow-y-auto">
                {debugLog.length === 0 ? (
                  <div className="text-gray-500">No debug information yet...</div>
                ) : (
                  debugLog.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))
                )}
              </div>
            </details>

            {/* Help Text */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-800">Troubleshooting Steps:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Make sure your browser supports camera access</li>
                <li>• Allow camera permissions when prompted</li>
                <li>• Check that no other apps are using the camera</li>
                <li>• Use HTTPS or localhost for camera access</li>
                <li>• Try refreshing the page if permissions were denied</li>
                <li>• Check Windows camera privacy settings</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CameraTestPage;





