import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Download, AlertTriangle } from 'lucide-react';

// Base URL for the models on GitHub
const MODELS_BASE_URL = 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights';

// Models to download
const MODELS = [
  // SSD MobileNet
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  
  // Face Landmark Model
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  
  // Face Recognition Model
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

export default function ModelSetupPage() {
  const [modelStatus, setModelStatus] = useState<Record<string, boolean>>({});
  const [isChecking, setIsChecking] = useState(true);
  const [allModelsPresent, setAllModelsPresent] = useState(false);

  useEffect(() => {
    checkModels();
  }, []);

  useEffect(() => {
    // Check if all models are present
    const allPresent = Object.values(modelStatus).every(status => status);
    setAllModelsPresent(allPresent);
  }, [modelStatus]);

  async function checkModels() {
    setIsChecking(true);
    const status: Record<string, boolean> = {};

    for (const model of MODELS) {
      try {
        const response = await fetch(`/models/${model}`);
        status[model] = response.ok;
      } catch (error) {
        status[model] = false;
      }
    }

    setModelStatus(status);
    setIsChecking(false);
  }

  async function downloadModel(model: string) {
    try {
      const url = `${MODELS_BASE_URL}/${model}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }
      
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = model;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Update status after download
      setTimeout(() => {
        checkModels();
      }, 1000);
    } catch (error) {
      console.error(`Error downloading ${model}:`, error);
      alert(`Failed to download ${model}. Please try again.`);
    }
  }

  function createModelsDirectory() {
    alert('Please create a "models" folder in the "public" directory of your project.');
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Face Recognition Model Setup</CardTitle>
          <CardDescription>
            Download and install the required models for face recognition
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              After downloading each model file, please save it to the <code>public/models</code> directory in your project.
              If the directory doesn't exist, create it first.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Models Directory</h3>
              <Button variant="outline" onClick={createModelsDirectory}>
                Create Directory
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              First, create a "models" folder inside the "public" directory if it doesn't exist.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Required Model Files</h3>
            <div className="border rounded-md divide-y">
              {MODELS.map((model) => (
                <div key={model} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    {isChecking ? (
                      <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
                    ) : modelStatus[model] ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-mono text-sm">{model}</span>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant={modelStatus[model] ? "outline" : "default"}
                    onClick={() => downloadModel(model)}
                    disabled={isChecking}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {modelStatus[model] ? "Re-download" : "Download"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          {allModelsPresent && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>All Models Installed</AlertTitle>
              <AlertDescription>
                All required models are present. Face recognition should work properly now.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={checkModels} disabled={isChecking}>
            Check Models
          </Button>
          <Button disabled={!allModelsPresent} onClick={() => window.location.href = '/'}>
            Continue to App
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}