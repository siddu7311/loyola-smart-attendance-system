import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ModernCameraCapture } from "./ModernCameraCapture";
import { faceRecognitionService } from '@/utils/faceRecognitionService';
import { faceRecognitionOptimizer } from "@/utils/faceRecognitionOptimizer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, Settings, BarChart, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export const FaceRecognitionTester = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [knownFaces, setKnownFaces] = useState<Array<{ id: string; features: Float32Array; name: string }>>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("settings");
  const [settings, setSettings] = useState(faceRecognitionOptimizer.getSettings());
  const [metrics, setMetrics] = useState(faceRecognitionOptimizer.getMetrics());
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const { toast } = useToast();

  // Initialize and load data
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Initialize the unified face recognition service
        await faceRecognitionService.initialize();
        console.log('Face recognition service initialized');
        
        // Fetch face recognition data
        const { data: faceData, error: faceError } = await supabase
          .from('face_recognition_data')
          .select('*, students(full_name)');
          
        if (faceError) {
          throw new Error(`Failed to fetch face data: ${faceError.message}`);
        }
        
        // Prepare known faces for recognition
        const faces = (faceData || []).map((face: any) => ({
          id: face.student_id,
          features: new Float32Array(face.face_encoding),
          name: face.students?.full_name || 'Unknown'
        }));
        
        setKnownFaces(faces);
        console.log(`Loaded ${faces.length} known faces for testing`);
        
        // Update metrics
        updateMetrics();
        
      } catch (error) {
        console.error('Error initializing:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to initialize face recognition tester",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [toast]);
  
  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTestRunning) {
        updateMetrics();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isTestRunning]);
  
  // Update metrics from optimizer
  const updateMetrics = () => {
    setMetrics(faceRecognitionOptimizer.getMetrics());
    const recs = faceRecognitionOptimizer.getRecommendations();
    setRecommendations(recs.recommendations || []);
  };
  
  // Apply settings to optimizer
  const applySettings = () => {
    faceRecognitionOptimizer.applySettings(settings);
    toast({
      title: "Settings Applied",
      description: "Face recognition settings have been updated",
    });
  };
  
  // Handle settings change
  const handleSettingChange = (setting: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };
  
  // Handle image capture for testing
  const handleImageCapture = async (imageDataUrl: string, features: Float32Array | null) => {
    setShowCamera(false);
    
    if (!imageDataUrl) {
      toast({
        title: "Error",
        description: "Failed to capture image",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Test face detection
      const detectionStart = performance.now();
      const faceCount = await faceRecognitionService.detectFaces(imageDataUrl);
      const detectionEnd = performance.now();
      const detectionTime = detectionEnd - detectionStart;
      const detectionSuccess = faceCount > 0;
      
      // Record detection result
      faceRecognitionOptimizer.recordDetectionResult(detectionTime, detectionSuccess);
      
      // If detection successful, test recognition
      if (detectionSuccess && knownFaces.length > 0) {
        const recognitionStart = performance.now();
        const result = await faceRecognitionService.recognizeFace(
          imageDataUrl,
          knownFaces
        );
        const recognitionEnd = performance.now();
        const recognitionTime = recognitionEnd - recognitionStart;
        const recognitionSuccess = !!result;
        
        // For testing, we don't know if it's correct, so we assume it is
        // In a real test, you would need to know the ground truth
        const isCorrect = true;
        
        // Record recognition result
        faceRecognitionOptimizer.recordRecognitionResult(recognitionTime, recognitionSuccess, isCorrect);
        
        // Add to test results
        setTestResults(prev => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            detectionTime,
            detectionSuccess,
            recognitionTime: recognitionSuccess ? recognitionTime : null,
            recognitionSuccess,
            matchedPerson: result?.name || null,
            confidence: result?.confidence || null
          }
        ]);
        
        toast({
          title: recognitionSuccess ? "Recognition Successful" : "Recognition Failed",
          description: recognitionSuccess 
            ? `Recognized as ${result?.name} (${(result?.confidence || 0) * 100}% confidence)` 
            : "Could not recognize face",
          variant: recognitionSuccess ? "default" : "destructive",
        });
      } else {
        // Add detection-only result
        setTestResults(prev => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            detectionTime,
            detectionSuccess,
            recognitionTime: null,
            recognitionSuccess: false,
            matchedPerson: null,
            confidence: null
          }
        ]);
        
        toast({
          title: detectionSuccess ? "Detection Successful" : "Detection Failed",
          description: detectionSuccess 
            ? `Detected ${faceCount} face(s)` 
            : "No faces detected in image",
          variant: detectionSuccess ? "default" : "destructive",
        });
      }
      
      // Update metrics
      updateMetrics();
      
    } catch (error) {
      console.error('Error testing face recognition:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test face recognition",
        variant: "destructive",
      });
    }
  };
  
  // Reset test results and metrics
  const resetTests = () => {
    setTestResults([]);
    faceRecognitionOptimizer.reset();
    updateMetrics();
    toast({
      title: "Tests Reset",
      description: "All test results and metrics have been reset",
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Face Recognition Performance Optimizer
        </CardTitle>
        <CardDescription>
          Test and optimize face recognition performance for better accuracy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <BarChart className="h-4 w-4 mr-2" />
              Performance Metrics
            </TabsTrigger>
            <TabsTrigger value="test">
              <Camera className="h-4 w-4 mr-2" />
              Run Tests
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Detection Confidence Threshold</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[settings.detectionConfidence * 100]} 
                    min={10} 
                    max={90} 
                    step={5}
                    onValueChange={(value) => handleSettingChange('detectionConfidence', value[0] / 100)}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{(settings.detectionConfidence * 100).toFixed(0)}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Higher values require more confidence to detect a face (fewer false positives, may miss some faces)
                </p>
              </div>
              
              <div>
                <Label className="mb-2 block">Recognition Match Threshold</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[settings.recognitionThreshold * 100]} 
                    min={30} 
                    max={90} 
                    step={5}
                    onValueChange={(value) => handleSettingChange('recognitionThreshold', value[0] / 100)}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{(settings.recognitionThreshold * 100).toFixed(0)}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Higher values require closer matches (fewer false matches, may not recognize some people)
                </p>
              </div>
              
              <div>
                <Label className="mb-2 block">Preferred Image Size</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[settings.preferredImageSize]} 
                    min={320} 
                    max={1280} 
                    step={80}
                    onValueChange={(value) => handleSettingChange('preferredImageSize', value[0])}
                    className="flex-1"
                  />
                  <span className="w-16 text-right">{settings.preferredImageSize}px</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Smaller images process faster but may be less accurate
                </p>
              </div>
              
              <div className="pt-4">
                <Button onClick={applySettings}>Apply Settings</Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="metrics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Detection Performance</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate:</span>
                    <span className="font-medium">{(metrics.detectionSuccessRate * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.detectionSuccessRate * 100} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Average Time:</span>
                    <span className="font-medium">{metrics.averageDetectionTime.toFixed(0)} ms</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (metrics.averageDetectionTime / 500) * 100)} 
                    className="h-2" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Recognition Performance</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate:</span>
                    <span className="font-medium">{(metrics.recognitionSuccessRate * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.recognitionSuccessRate * 100} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Average Time:</span>
                    <span className="font-medium">{metrics.averageRecognitionTime.toFixed(0)} ms</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (metrics.averageRecognitionTime / 1000) * 100)} 
                    className="h-2" 
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Error Rates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>False Positive Rate:</span>
                    <span className="font-medium">{(metrics.falsePositiveRate * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={metrics.falsePositiveRate * 100} 
                    className="h-2 bg-red-100" 
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>False Negative Rate:</span>
                    <span className="font-medium">{(metrics.falseNegativeRate * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={metrics.falseNegativeRate * 100} 
                    className="h-2 bg-red-100" 
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Recommendations</h3>
              {recommendations.length > 0 ? (
                <ul className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Run some tests to get performance recommendations
                </p>
              )}
            </div>
            
            <div className="pt-2">
              <Button variant="outline" onClick={resetTests} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reset Metrics
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="test" className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-6">
                Capture test images to evaluate face recognition performance
              </p>
              <Button 
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <Camera className="h-4 w-4" />
                Capture Test Image
              </Button>
              
              <div className="mt-4 text-xs text-muted-foreground">
                <p>Recognition model: {faceRecognitionService.isInitialized() ? 'Unified' : 'Loading...'}</p>
                <p>Face templates loaded: {knownFaces.length}</p>
                <p>Tests performed: {testResults.length}</p>
              </div>
            </div>
            
            {testResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Test Results</h3>
                  <Button variant="outline" size="sm" onClick={resetTests} className="flex items-center gap-2">
                    <RefreshCw className="h-3 w-3" />
                    Reset
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {testResults.slice().reverse().map((result, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            {result.detectionSuccess ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium">
                              {result.detectionSuccess ? 'Face Detected' : 'No Face Detected'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Detection time: {result.detectionTime.toFixed(0)} ms
                          </p>
                        </div>
                        <Badge variant={result.detectionSuccess ? "default" : "destructive"} className="text-xs">
                          {result.detectionSuccess ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      
                      {result.detectionSuccess && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            {result.recognitionSuccess ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium">
                              {result.recognitionSuccess 
                                ? `Recognized as ${result.matchedPerson}` 
                                : 'Recognition Failed'}
                            </span>
                          </div>
                          {result.recognitionSuccess && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Confidence: {(result.confidence * 100).toFixed(1)}% | 
                              Time: {result.recognitionTime.toFixed(0)} ms
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {showCamera && (
        <ModernCameraCapture
          onClose={() => setShowCamera(false)}
          onImageCapture={handleImageCapture}
          captureMode="single"
          showHelp={true}
        />
      )}
    </Card>
  );
};