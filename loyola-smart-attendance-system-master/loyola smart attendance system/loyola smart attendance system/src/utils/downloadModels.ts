/**
 * Browser-based script to download face-api.js models
 */

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

/**
 * Downloads a single model file and triggers browser download
 */
export async function downloadSingleModel(modelFile: string): Promise<boolean> {
  const url = `${MODELS_BASE_URL}/${modelFile}`;
  
  try {
    console.log(`Downloading ${modelFile}...`);
    
    // Fetch the model file
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.status}`);
    }
    
    // Get the file content as blob
    const blob = await response.blob();
    
    // Create a download link
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = modelFile;
    a.click();
    
    console.log(`${modelFile} download initiated`);
    return true;
  } catch (error) {
    console.error(`Error downloading ${modelFile}:`, error);
    return false;
  }
}

/**
 * Checks if a model file exists in the public/models directory
 */
export async function checkModelExists(modelFile: string): Promise<boolean> {
  try {
    const response = await fetch(`/models/${modelFile}`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if all required models exist
 */
export async function checkAllModelsExist(): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = {};
  
  for (const model of MODELS) {
    status[model] = await checkModelExists(model);
  }
  
  return status;
}

/**
 * Returns the list of required models
 */
export function getRequiredModels(): string[] {
  return [...MODELS];
}

/**
 * Downloads all face-api.js models
 */
export async function downloadFaceApiModels(): Promise<boolean> {
  try {
    console.log('Creating models directory...');
    
    // Create models directory
    await createModelsDirectory();
    
    console.log('Downloading face-api.js models...');
    
    // Download all models in parallel
    const downloadPromises = MODELS.map(model => 
      downloadModel(model)
    );
    
    await Promise.all(downloadPromises);
    
    console.log('All models downloaded successfully!');
    return true;
  } catch (error) {
    console.error('Error downloading models:', error);
    return false;
  }
}

/**
 * Creates the models directory in public folder
 */
async function createModelsDirectory(): Promise<void> {
  try {
    // Check if the directory exists using fetch
    const response = await fetch('/models/');
    if (response.status === 404) {
      console.log('Models directory does not exist, creating it...');
      // We can't create directories from the browser, so we'll show instructions
      console.warn('Please create a "models" directory in your public folder manually');
    }
  } catch (error) {
    console.log('Models directory check failed, assuming it needs to be created');
  }
}

/**
 * Downloads a single model file
 */
async function downloadModel(modelFile: string): Promise<void> {
  const url = `${MODELS_BASE_URL}/${modelFile}`;
  const dest = `/models/${modelFile}`;
  
  try {
    console.log(`Downloading ${modelFile}...`);
    
    // Fetch the model file
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.status}`);
    }
    
    // Get the file content as blob
    const blob = await response.blob();
    
    // Create a download link
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = modelFile;
    a.textContent = `Download ${modelFile}`;
    
    // Add to document for user to click
    document.body.appendChild(a);
    
    console.log(`Please save ${modelFile} to your public/models directory`);
  } catch (error) {
    console.error(`Error downloading ${modelFile}:`, error);
    throw error;
  }
}