// @ts-nocheck
// Custom module wrapper for face-api.js
// This resolves import issues by directly importing face-api.js

import * as faceapi from 'face-api.js';

// Export everything
export default faceapi;
export const nets = faceapi.nets;
export const draw = faceapi.draw;
export const utils = faceapi.utils;
export const tinyFaceDetector = faceapi.tinyFaceDetector;
export const ssdMobilenetv1 = faceapi.ssdMobilenetv1;
export const faceLandmark68Net = faceapi.faceLandmark68Net;
export const faceRecognitionNet = faceapi.faceRecognitionNet;
export const faceExpressionNet = faceapi.faceExpressionNet;
export const ageGenderNet = faceapi.ageGenderNet;
export const resizeResults = faceapi.resizeResults;
export const detectAllFaces = faceapi.detectAllFaces;
export const detectSingleFace = faceapi.detectSingleFace;
export const matchDimensions = faceapi.matchDimensions;
export const createCanvasFromMedia = faceapi.createCanvasFromMedia;
export const euclideanDistance = faceapi.euclideanDistance;
export const computeFaceDescriptor = faceapi.computeFaceDescriptor;
export const loadTinyFaceDetectorModel = faceapi.loadTinyFaceDetectorModel;
export const loadFaceLandmarkModel = faceapi.loadFaceLandmarkModel;
export const loadFaceRecognitionModel = faceapi.loadFaceRecognitionModel;
export const loadSsdMobilenetv1Model = faceapi.loadSsdMobilenetv1Model;
export const loadFaceExpressionModel = faceapi.loadFaceExpressionModel;
export const loadAgeGenderModel = faceapi.loadAgeGenderModel;