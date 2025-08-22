/// <reference types="vite/client" />

declare module 'face-api.js' {
  export interface FaceDetection {
    detection: any;
  }
  
  export class FaceMatcher {
    constructor(labeledDescriptors: any, distanceThreshold?: number);
    findBestMatch(descriptor: Float32Array): any;
  }
  
  export interface WithFaceDescriptor<T> {
    descriptor: Float32Array;
  }
  
  export interface WithFaceDetection<T> {
    detection: FaceDetection;
  }
  
  export interface WithFaceLandmarks<T, U> {
    landmarks: any;
    alignedRect: any;
  }
  
  export class LabeledFaceDescriptors {
    constructor(label: string, descriptors: Float32Array[]);
  }

  export interface IFaceLandmarks68 {}
  
  export const nets: {
    ssdMobilenetv1: any;
    faceLandmark68Net: any;
    faceRecognitionNet: any;
  };
  
  export function detectAllFaces(input: any, options?: any): any;
  export function detectSingleFace(input: any, options?: any): any;
  export function createFaceMatcher(labeledDescriptors: any, distanceThreshold?: number): FaceMatcher;
  
  export class SsdMobilenetv1Options {
    constructor(options?: { minConfidence?: number });
  }
  
  export default {
    nets,
    detectAllFaces,
    detectSingleFace,
    createFaceMatcher,
    LabeledFaceDescriptors,
    SsdMobilenetv1Options,
    FaceMatcher,
  };
}