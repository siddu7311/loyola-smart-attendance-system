import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { checkAllModelsExist } from '@/utils/downloadModels';

export default function ModelSetupLink() {
  const [modelsReady, setModelsReady] = useState<boolean>(true);
  
  useEffect(() => {
    checkModels();
  }, []);
  
  async function checkModels() {
    const modelStatus = await checkAllModelsExist();
    const allModelsPresent = Object.values(modelStatus).every(status => status);
    setModelsReady(allModelsPresent);
  }
  
  if (modelsReady) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        variant="destructive" 
        onClick={() => window.location.href = '/model-setup'}
        className="flex items-center gap-2"
      >
        <AlertCircle className="h-4 w-4" />
        Setup Face Recognition Models
      </Button>
    </div>
  );
}