# Face Recognition Setup

This project uses face-api.js for accurate face detection and recognition. Follow these steps to set up the face recognition models:

## 1. Install Dependencies

First, install the required dependencies:

```bash
npm install
```

## 2. Download Face Recognition Models

The face recognition models need to be downloaded to the `public/models` directory. You can do this manually or use the provided script:

### Option 1: Manual Download

1. Create a `models` directory inside the `public` folder
2. Download the following files from the [face-api.js GitHub repository](https://github.com/justadudewhohacks/face-api.js/tree/master/weights):

   - SSD MobileNet (face detection):
     - `ssd_mobilenetv1_model-weights_manifest.json`
     - `ssd_mobilenetv1_model-shard1`
     - `ssd_mobilenetv1_model-shard2`
   
   - Face Landmark Model:
     - `face_landmark_68_model-weights_manifest.json`
     - `face_landmark_68_model-shard1`
   
   - Face Recognition Model:
     - `face_recognition_model-weights_manifest.json`
     - `face_recognition_model-shard1`
     - `face_recognition_model-shard2`

3. Place all these files in the `public/models` directory

### Option 2: Using the Download Script

Run the provided script to automatically download the models:

```bash
npx ts-node src/utils/downloadFaceApiModels.ts
```

## 3. Verify Setup

After downloading the models, verify that they are correctly placed in the `public/models` directory. Your directory structure should look like this: