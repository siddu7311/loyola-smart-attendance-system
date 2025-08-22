/**
 * Face Recognition Performance Optimizer
 * 
 * This utility helps optimize face recognition performance by:
 * 1. Adjusting detection and recognition thresholds
 * 2. Providing performance metrics
 * 3. Offering recommendations for optimal settings
 */

import { faceRecognitionService } from './faceRecognitionService';

interface PerformanceMetrics {
  averageDetectionTime: number;
  averageRecognitionTime: number;
  detectionSuccessRate: number;
  recognitionSuccessRate: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
}

interface OptimizationSettings {
  detectionConfidence: number;
  recognitionThreshold: number;
  preferredImageSize: number;
}

class FaceRecognitionOptimizer {
  private metrics: PerformanceMetrics = {
    averageDetectionTime: 0,
    averageRecognitionTime: 0,
    detectionSuccessRate: 0,
    recognitionSuccessRate: 0,
    falsePositiveRate: 0,
    falseNegativeRate: 0
  };

  private settings: OptimizationSettings = {
    detectionConfidence: 0.5,
    recognitionThreshold: 0.6,
    preferredImageSize: 640
  };

  private detectionTimes: number[] = [];
  private recognitionTimes: number[] = [];
  private detectionResults: boolean[] = [];
  private recognitionResults: boolean[] = [];

  constructor() {
    // Initialize with default settings
    this.applySettings(this.settings);
  }

  /**
   * Apply optimization settings to face recognition services
   */
  applySettings(settings: Partial<OptimizationSettings>): void {
    // Update settings
    this.settings = { ...this.settings, ...settings };

    // Apply to the unified face recognition service
    if (faceRecognitionService.isInitialized()) {
      faceRecognitionService.setDetectionConfidence(this.settings.detectionConfidence);
      faceRecognitionService.setRecognitionThreshold(this.settings.recognitionThreshold);
    }

    console.log('✅ Applied optimization settings:', this.settings);
  }

  /**
   * Record a detection performance result
   */
  recordDetectionResult(detectionTime: number, success: boolean): void {
    this.detectionTimes.push(detectionTime);
    this.detectionResults.push(success);
    this.updateMetrics();
  }

  /**
   * Record a recognition performance result
   */
  recordRecognitionResult(recognitionTime: number, success: boolean, isCorrect: boolean): void {
    this.recognitionTimes.push(recognitionTime);
    this.recognitionResults.push(success);
    
    // Track false positives (success but incorrect) and false negatives (failure but should have succeeded)
    if (success && !isCorrect) {
      // False positive
      this.metrics.falsePositiveRate = this.calculateRate(
        this.metrics.falsePositiveRate,
        1,
        this.recognitionResults.length
      );
    } else if (!success && isCorrect) {
      // False negative
      this.metrics.falseNegativeRate = this.calculateRate(
        this.metrics.falseNegativeRate,
        1,
        this.recognitionResults.length
      );
    }
    
    this.updateMetrics();
  }

  /**
   * Update performance metrics based on recorded results
   */
  private updateMetrics(): void {
    // Calculate average detection time
    if (this.detectionTimes.length > 0) {
      const totalDetectionTime = this.detectionTimes.reduce((sum, time) => sum + time, 0);
      this.metrics.averageDetectionTime = totalDetectionTime / this.detectionTimes.length;
    }

    // Calculate average recognition time
    if (this.recognitionTimes.length > 0) {
      const totalRecognitionTime = this.recognitionTimes.reduce((sum, time) => sum + time, 0);
      this.metrics.averageRecognitionTime = totalRecognitionTime / this.recognitionTimes.length;
    }

    // Calculate detection success rate
    if (this.detectionResults.length > 0) {
      const successfulDetections = this.detectionResults.filter(result => result).length;
      this.metrics.detectionSuccessRate = successfulDetections / this.detectionResults.length;
    }

    // Calculate recognition success rate
    if (this.recognitionResults.length > 0) {
      const successfulRecognitions = this.recognitionResults.filter(result => result).length;
      this.metrics.recognitionSuccessRate = successfulRecognitions / this.recognitionResults.length;
    }
  }

  /**
   * Calculate rate for a new value
   */
  private calculateRate(currentRate: number, newValue: number, totalCount: number): number {
    return ((currentRate * (totalCount - 1)) + newValue) / totalCount;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current optimization settings
   */
  getSettings(): OptimizationSettings {
    return { ...this.settings };
  }

  /**
   * Get recommendations for optimal settings based on current metrics
   */
  getRecommendations(): Partial<OptimizationSettings> & { recommendations: string[] } {
    const recommendations: string[] = [];
    const suggestedSettings: Partial<OptimizationSettings> = {};

    // Analyze detection performance
    if (this.metrics.detectionSuccessRate < 0.7) {
      // If detection rate is low, lower the confidence threshold
      suggestedSettings.detectionConfidence = Math.max(0.3, this.settings.detectionConfidence - 0.1);
      recommendations.push(`Lower detection confidence to ${suggestedSettings.detectionConfidence.toFixed(1)} to improve detection rate`);
    } else if (this.metrics.detectionSuccessRate > 0.95 && this.metrics.falsePositiveRate > 0.1) {
      // If detection rate is high but with many false positives, increase confidence
      suggestedSettings.detectionConfidence = Math.min(0.8, this.settings.detectionConfidence + 0.1);
      recommendations.push(`Increase detection confidence to ${suggestedSettings.detectionConfidence.toFixed(1)} to reduce false positives`);
    }

    // Analyze recognition performance
    if (this.metrics.recognitionSuccessRate < 0.7) {
      // If recognition rate is low, lower the threshold to be more lenient
      suggestedSettings.recognitionThreshold = Math.max(0.4, this.settings.recognitionThreshold - 0.1);
      recommendations.push(`Lower recognition threshold to ${suggestedSettings.recognitionThreshold.toFixed(1)} to improve match rate`);
    } else if (this.metrics.falsePositiveRate > 0.05) {
      // If too many false positives, increase threshold to be more strict
      suggestedSettings.recognitionThreshold = Math.min(0.8, this.settings.recognitionThreshold + 0.1);
      recommendations.push(`Increase recognition threshold to ${suggestedSettings.recognitionThreshold.toFixed(1)} to reduce false matches`);
    }

    // Image size recommendations
    if (this.metrics.averageDetectionTime > 300 || this.metrics.averageRecognitionTime > 500) {
      // If processing is slow, recommend smaller images
      suggestedSettings.preferredImageSize = Math.max(320, this.settings.preferredImageSize - 160);
      recommendations.push(`Reduce image size to ${suggestedSettings.preferredImageSize}px to improve performance`);
    }

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push("Current settings are optimal based on performance metrics");
    }

    recommendations.push("Consider capturing multiple images per student for better recognition accuracy");
    recommendations.push("Ensure good lighting conditions for optimal face detection");

    return {
      ...suggestedSettings,
      recommendations
    };
  }

  /**
   * Reset all metrics and recorded data
   */
  reset(): void {
    this.detectionTimes = [];
    this.recognitionTimes = [];
    this.detectionResults = [];
    this.recognitionResults = [];
    
    this.metrics = {
      averageDetectionTime: 0,
      averageRecognitionTime: 0,
      detectionSuccessRate: 0,
      recognitionSuccessRate: 0,
      falsePositiveRate: 0,
      falseNegativeRate: 0
    };
    
    console.log('✅ Performance metrics reset');
  }
}

export const faceRecognitionOptimizer = new FaceRecognitionOptimizer();