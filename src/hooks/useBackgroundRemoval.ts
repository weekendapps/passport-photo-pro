import { useState, useCallback } from "react";
import { pipeline, env } from "@huggingface/transformers";

// Configure transformers.js for browser
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 1024;

let segmenter: any = null;

function resizeImageIfNeeded(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement
): boolean {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export function useBackgroundRemoval() {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadModel = useCallback(async () => {
    if (segmenter) return segmenter;

    setIsModelLoading(true);
    setLoadingProgress(0);

    try {
      console.log("Loading segmentation model...");
      segmenter = await pipeline(
        "image-segmentation",
        "Xenova/segformer-b0-finetuned-ade-512-512",
        {
          progress_callback: (progress: any) => {
            if (progress.progress) {
              setLoadingProgress(Math.round(progress.progress));
            }
          },
        }
      );
      console.log("Segmentation model loaded successfully");
      return segmenter;
    } catch (err) {
      console.error("Failed to load segmentation model:", err);
      throw err;
    } finally {
      setIsModelLoading(false);
    }
  }, []);

  const removeBackground = useCallback(
    async (
      imageElement: HTMLImageElement,
      backgroundColor: string = "#FFFFFF"
    ): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const model = await loadModel();

        // Convert HTMLImageElement to canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) throw new Error("Could not get canvas context");

        // Resize image if needed and draw it to canvas
        resizeImageIfNeeded(canvas, ctx, imageElement);
        console.log(`Processing image: ${canvas.width}x${canvas.height}`);

        // Get image data as base64
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        console.log("Image converted to base64");

        // Process the image with the segmentation model
        console.log("Processing with segmentation model...");
        const result = await model(imageData);

        console.log("Segmentation result:", result);

        if (!result || !Array.isArray(result) || result.length === 0) {
          throw new Error("Invalid segmentation result");
        }

        // Find the person/face segment (usually labeled as "person" or similar)
        // The model outputs multiple segments - we need to find the main subject
        let personMask = result.find(
          (r: any) => r.label === "person" || r.label === "face"
        );

        if (!personMask) {
          // If no person found, use the largest non-background segment
          personMask = result.reduce((largest: any, current: any) => {
            if (!current.mask) return largest;
            const currentScore = current.score || 0;
            const largestScore = largest?.score || 0;
            return currentScore > largestScore ? current : largest;
          }, null);
        }

        if (!personMask || !personMask.mask) {
          // If still no mask, create mask from all segments except common backgrounds
          const bgLabels = [
            "wall",
            "floor",
            "ceiling",
            "sky",
            "building",
            "tree",
            "grass",
          ];
          const foregroundSegments = result.filter(
            (r: any) => r.mask && !bgLabels.includes(r.label?.toLowerCase())
          );

          if (foregroundSegments.length === 0) {
            throw new Error(
              "Could not identify subject in image. Please try a clearer photo."
            );
          }

          // Combine foreground masks
          personMask = {
            mask: {
              data: new Float32Array(foregroundSegments[0].mask.data.length),
              width: foregroundSegments[0].mask.width,
              height: foregroundSegments[0].mask.height,
            },
          };

          for (const seg of foregroundSegments) {
            for (let i = 0; i < seg.mask.data.length; i++) {
              personMask.mask.data[i] = Math.max(
                personMask.mask.data[i],
                seg.mask.data[i]
              );
            }
          }
        }

        // Create output canvas at original dimensions
        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = imageElement.naturalWidth;
        outputCanvas.height = imageElement.naturalHeight;
        const outputCtx = outputCanvas.getContext("2d");

        if (!outputCtx) throw new Error("Could not get output canvas context");

        // Fill with background color
        outputCtx.fillStyle = backgroundColor;
        outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

        // Create a temporary canvas for the mask at original resolution
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = personMask.mask.width;
        maskCanvas.height = personMask.mask.height;
        const maskCtx = maskCanvas.getContext("2d");

        if (!maskCtx) throw new Error("Could not get mask canvas context");

        // Create mask image data
        const maskImageData = maskCtx.createImageData(
          personMask.mask.width,
          personMask.mask.height
        );

        for (let i = 0; i < personMask.mask.data.length; i++) {
          const alpha = Math.round(personMask.mask.data[i] * 255);
          maskImageData.data[i * 4] = 255;
          maskImageData.data[i * 4 + 1] = 255;
          maskImageData.data[i * 4 + 2] = 255;
          maskImageData.data[i * 4 + 3] = alpha;
        }

        maskCtx.putImageData(maskImageData, 0, 0);

        // Scale mask to original image size
        const scaledMaskCanvas = document.createElement("canvas");
        scaledMaskCanvas.width = imageElement.naturalWidth;
        scaledMaskCanvas.height = imageElement.naturalHeight;
        const scaledMaskCtx = scaledMaskCanvas.getContext("2d");

        if (!scaledMaskCtx)
          throw new Error("Could not get scaled mask canvas context");

        scaledMaskCtx.drawImage(
          maskCanvas,
          0,
          0,
          personMask.mask.width,
          personMask.mask.height,
          0,
          0,
          imageElement.naturalWidth,
          imageElement.naturalHeight
        );

        // Draw original image with mask
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = imageElement.naturalWidth;
        tempCanvas.height = imageElement.naturalHeight;
        const tempCtx = tempCanvas.getContext("2d");

        if (!tempCtx) throw new Error("Could not get temp canvas context");

        tempCtx.drawImage(imageElement, 0, 0);

        // Get image data and apply mask
        const originalData = tempCtx.getImageData(
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );
        const maskData = scaledMaskCtx.getImageData(
          0,
          0,
          scaledMaskCanvas.width,
          scaledMaskCanvas.height
        );

        for (let i = 0; i < originalData.data.length / 4; i++) {
          originalData.data[i * 4 + 3] = maskData.data[i * 4 + 3];
        }

        tempCtx.putImageData(originalData, 0, 0);

        // Draw masked image on top of background
        outputCtx.drawImage(tempCanvas, 0, 0);

        console.log("Background removed successfully");

        return outputCanvas.toDataURL("image/png", 1.0);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Background removal failed";
        setError(message);
        console.error("Error removing background:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadModel]
  );

  return {
    isLoading,
    isModelLoading,
    loadingProgress,
    error,
    removeBackground,
  };
}
