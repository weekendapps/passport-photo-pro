import { useState, useCallback } from "react";
import { pipeline, env } from "@huggingface/transformers";
import type { PassportStandard } from "@/data/passportStandards";

// Configure transformers.js for browser
env.allowLocalModels = false;

interface FaceBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

interface DetectedFace {
  box: FaceBox;
  score: number;
}

interface FaceValidation {
  isValid: boolean;
  headHeightValid: boolean;
  eyeLineValid: boolean;
  centeredValid: boolean;
  headHeightPercent: number;
  eyeLinePercent: number;
  centerOffset: number;
  messages: string[];
}

interface UseFaceDetectionResult {
  isLoading: boolean;
  isModelLoading: boolean;
  loadingProgress: number;
  detectedFace: DetectedFace | null;
  validation: FaceValidation | null;
  error: string | null;
  detectFace: (imageSrc: string) => Promise<DetectedFace | null>;
  validateFace: (
    face: DetectedFace,
    imageWidth: number,
    imageHeight: number,
    standard: PassportStandard
  ) => FaceValidation;
  calculateAutoPosition: (
    face: DetectedFace,
    imageWidth: number,
    imageHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    standard: PassportStandard
  ) => { scale: number; position: { x: number; y: number } };
}

let detectorPromise: Promise<any> | null = null;

export function useFaceDetection(): UseFaceDetectionResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [detectedFace, setDetectedFace] = useState<DetectedFace | null>(null);
  const [validation, setValidation] = useState<FaceValidation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getDetector = useCallback(async () => {
    if (!detectorPromise) {
      setIsModelLoading(true);
      setLoadingProgress(0);
      
      detectorPromise = pipeline("object-detection", "Xenova/detr-resnet-50", {
        progress_callback: (progress: any) => {
          if (progress.status === "progress" && progress.progress) {
            setLoadingProgress(Math.round(progress.progress));
          }
        },
      });
      
      try {
        await detectorPromise;
      } finally {
        setIsModelLoading(false);
        setLoadingProgress(100);
      }
    }
    return detectorPromise;
  }, []);

  const detectFace = useCallback(async (imageSrc: string): Promise<DetectedFace | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const detector = await getDetector();
      const results = await detector(imageSrc);
      
      // Find person detections (DETR detects "person" class)
      const personDetections = results.filter(
        (r: any) => r.label === "person" && r.score > 0.7
      );
      
      if (personDetections.length === 0) {
        // Fallback: look for any high-confidence detection
        const anyDetection = results.find((r: any) => r.score > 0.5);
        if (anyDetection) {
          const face: DetectedFace = {
            box: anyDetection.box,
            score: anyDetection.score,
          };
          setDetectedFace(face);
          return face;
        }
        
        setError("No face detected. Please ensure your face is clearly visible.");
        return null;
      }
      
      // Use the highest confidence person detection
      const bestPerson = personDetections.reduce((a: any, b: any) => 
        a.score > b.score ? a : b
      );
      
      // Estimate face region from person detection (upper portion)
      const personBox = bestPerson.box;
      const faceBox: FaceBox = {
        xmin: personBox.xmin + (personBox.xmax - personBox.xmin) * 0.2,
        xmax: personBox.xmax - (personBox.xmax - personBox.xmin) * 0.2,
        ymin: personBox.ymin,
        ymax: personBox.ymin + (personBox.ymax - personBox.ymin) * 0.4,
      };
      
      const face: DetectedFace = {
        box: faceBox,
        score: bestPerson.score,
      };
      
      setDetectedFace(face);
      return face;
    } catch (err) {
      console.error("Face detection error:", err);
      setError("Failed to detect face. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getDetector]);

  const validateFace = useCallback((
    face: DetectedFace,
    imageWidth: number,
    imageHeight: number,
    standard: PassportStandard
  ): FaceValidation => {
    const { box } = face;
    const faceHeight = box.ymax - box.ymin;
    const faceWidth = box.xmax - box.xmin;
    const faceCenterX = (box.xmin + box.xmax) / 2;
    
    // Calculate head height as percentage of image height
    const headHeightPercent = (faceHeight / imageHeight) * 100;
    
    // Estimate eye line position (approximately 35% from top of face)
    const eyeY = box.ymin + faceHeight * 0.35;
    const eyeLinePercent = ((imageHeight - eyeY) / imageHeight) * 100;
    
    // Calculate center offset as percentage
    const imageCenterX = imageWidth / 2;
    const centerOffset = Math.abs(faceCenterX - imageCenterX) / imageWidth * 100;
    
    // Validate against standard
    const headHeightValid = 
      headHeightPercent >= standard.headHeightMin * 0.8 && 
      headHeightPercent <= standard.headHeightMax * 1.2;
    
    const eyeLineValid = 
      Math.abs(eyeLinePercent - standard.eyeLineFromBottom) <= 15;
    
    const centeredValid = centerOffset <= 10;
    
    const messages: string[] = [];
    
    if (!headHeightValid) {
      if (headHeightPercent < standard.headHeightMin * 0.8) {
        messages.push("Face is too small. Zoom in or move closer.");
      } else {
        messages.push("Face is too large. Zoom out or move back.");
      }
    }
    
    if (!eyeLineValid) {
      if (eyeLinePercent < standard.eyeLineFromBottom) {
        messages.push("Eyes are too low. Move the photo up.");
      } else {
        messages.push("Eyes are too high. Move the photo down.");
      }
    }
    
    if (!centeredValid) {
      messages.push("Face is not centered. Adjust horizontally.");
    }
    
    if (messages.length === 0) {
      messages.push("Photo meets passport requirements!");
    }
    
    const result: FaceValidation = {
      isValid: headHeightValid && eyeLineValid && centeredValid,
      headHeightValid,
      eyeLineValid,
      centeredValid,
      headHeightPercent,
      eyeLinePercent,
      centerOffset,
      messages,
    };
    
    setValidation(result);
    return result;
  }, []);

  const calculateAutoPosition = useCallback((
    face: DetectedFace,
    imageWidth: number,
    imageHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    standard: PassportStandard
  ): { scale: number; position: { x: number; y: number } } => {
    const { box } = face;
    const faceHeight = box.ymax - box.ymin;
    const faceWidth = box.xmax - box.xmin;
    const faceCenterX = (box.xmin + box.xmax) / 2;
    const faceCenterY = (box.ymin + box.ymax) / 2;
    
    // Target head height (middle of the allowed range)
    const targetHeadPercent = (standard.headHeightMin + standard.headHeightMax) / 2 / 100;
    const targetHeadHeight = canvasHeight * targetHeadPercent;
    
    // Calculate scale needed to fit face to target size
    const scale = targetHeadHeight / faceHeight;
    
    // Calculate position to center face and align eye line
    const scaledImageWidth = imageWidth * scale;
    const scaledImageHeight = imageHeight * scale;
    
    // Position face center at canvas center horizontally
    const scaledFaceCenterX = faceCenterX * scale;
    const targetCenterX = canvasWidth / 2;
    const offsetX = targetCenterX - scaledFaceCenterX;
    
    // Position eye line at the required percentage from bottom
    const eyeY = box.ymin + faceHeight * 0.35;
    const scaledEyeY = eyeY * scale;
    const targetEyeY = canvasHeight * (1 - standard.eyeLineFromBottom / 100);
    const offsetY = targetEyeY - scaledEyeY;
    
    // Adjust for canvas centering
    const baseX = (canvasWidth - scaledImageWidth) / 2;
    const baseY = (canvasHeight - scaledImageHeight) / 2;
    
    return {
      scale,
      position: {
        x: offsetX - baseX + (canvasWidth - scaledImageWidth) / 2,
        y: offsetY - baseY + (canvasHeight - scaledImageHeight) / 2,
      },
    };
  }, []);

  return {
    isLoading,
    isModelLoading,
    loadingProgress,
    detectedFace,
    validation,
    error,
    detectFace,
    validateFace,
    calculateAutoPosition,
  };
}
