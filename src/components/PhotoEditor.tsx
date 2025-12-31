import { useRef, useEffect, useState, useCallback } from "react";
import { type PassportStandard } from "@/data/passportStandards";
import { ZoomIn, ZoomOut, RotateCcw, Move, Sparkles, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { FaceValidationStatus } from "@/components/FaceValidationStatus";
import { toast } from "sonner";

interface PhotoEditorProps {
  imageSrc: string;
  standard: PassportStandard;
  onCropComplete: (croppedImage: string) => void;
}

export function PhotoEditor({
  imageSrc,
  standard,
  onCropComplete,
}: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showFaceBox, setShowFaceBox] = useState(false);

  const {
    isLoading,
    isModelLoading,
    loadingProgress,
    detectedFace,
    validation,
    error,
    detectFace,
    validateFace,
    calculateAutoPosition,
  } = useFaceDetection();

  const aspectRatio = standard.width / standard.height;
  const canvasSize = 400;
  const canvasWidth = aspectRatio >= 1 ? canvasSize : canvasSize * aspectRatio;
  const canvasHeight = aspectRatio >= 1 ? canvasSize / aspectRatio : canvasSize;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      const scaleX = canvasWidth / img.width;
      const scaleY = canvasHeight / img.height;
      const initialScale = Math.max(scaleX, scaleY) * 1.2;
      setScale(initialScale);
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc, canvasWidth, canvasHeight]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = standard.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imgWidth = image.width * scale;
    const imgHeight = image.height * scale;
    const x = (canvas.width - imgWidth) / 2 + position.x;
    const y = (canvas.height - imgHeight) / 2 + position.y;

    ctx.drawImage(image, x, y, imgWidth, imgHeight);

    // Draw face detection box if available
    if (showFaceBox && detectedFace && image) {
      const { box } = detectedFace;
      const boxX = x + box.xmin * scale;
      const boxY = y + box.ymin * scale;
      const boxWidth = (box.xmax - box.xmin) * scale;
      const boxHeight = (box.ymax - box.ymin) * scale;

      ctx.strokeStyle = validation?.isValid ? "hsl(142, 76%, 36%)" : "hsl(38, 92%, 50%)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      ctx.setLineDash([]);
    }
  }, [image, scale, position, standard.backgroundColor, showFaceBox, detectedFace, validation]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleReset = () => {
    if (!image) return;
    const scaleX = canvasWidth / image.width;
    const scaleY = canvasHeight / image.height;
    const initialScale = Math.max(scaleX, scaleY) * 1.2;
    setScale(initialScale);
    setPosition({ x: 0, y: 0 });
    setShowFaceBox(false);
  };

  const handleAutoDetect = async () => {
    if (!image) return;

    const face = await detectFace(imageSrc);
    if (face) {
      setShowFaceBox(true);
      validateFace(face, image.width, image.height, standard);
      toast.success("Face detected! Review the validation results below.");
    }
  };

  const handleAutoCenter = async () => {
    if (!image) return;

    let face = detectedFace;
    if (!face) {
      face = await detectFace(imageSrc);
    }

    if (face) {
      const autoPos = calculateAutoPosition(
        face,
        image.width,
        image.height,
        canvasWidth,
        canvasHeight,
        standard
      );

      setScale(autoPos.scale);
      setPosition(autoPos.position);
      setShowFaceBox(true);

      // Re-validate with new position
      setTimeout(() => {
        if (face) {
          validateFace(face, image.width, image.height, standard);
        }
      }, 100);

      toast.success("Photo auto-centered to meet passport requirements!");
    }
  };

  const exportCroppedImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    onCropComplete(dataUrl);
  };

  const headTop = canvasHeight * (1 - standard.headHeightMax / 100);
  const headBottom = canvasHeight * (1 - standard.headHeightMin / 100);
  const eyeLine = canvasHeight * (1 - standard.eyeLineFromBottom / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Adjust Your Photo</h3>
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* AI Face Detection Controls */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleAutoDetect}
          disabled={isLoading || isModelLoading}
          className="flex-1 gap-2"
        >
          <ScanFace className="h-4 w-4" />
          {isLoading ? "Detecting..." : "Detect Face"}
        </Button>
        <Button
          onClick={handleAutoCenter}
          disabled={isLoading || isModelLoading}
          className="flex-1 gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {isLoading ? "Processing..." : "Auto-Center"}
        </Button>
      </div>

      {/* Validation Status */}
      <FaceValidationStatus
        validation={validation}
        isLoading={isLoading}
        isModelLoading={isModelLoading}
        loadingProgress={loadingProgress}
        error={error}
      />

      <div
        ref={containerRef}
        className="relative mx-auto rounded-xl overflow-hidden shadow-lg bg-card"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        />

        {/* Guide overlay */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={canvasWidth}
          height={canvasHeight}
        >
          {/* Head height guides */}
          <line
            x1={0}
            y1={headTop}
            x2={canvasWidth}
            y2={headTop}
            className="guide-overlay stroke-2"
            strokeDasharray="8,4"
            opacity={0.7}
          />
          <line
            x1={0}
            y1={headBottom}
            x2={canvasWidth}
            y2={headBottom}
            className="guide-overlay stroke-2"
            strokeDasharray="8,4"
            opacity={0.7}
          />

          {/* Eye line guide */}
          <line
            x1={0}
            y1={eyeLine}
            x2={canvasWidth}
            y2={eyeLine}
            stroke="hsl(var(--guide-success))"
            strokeWidth={2}
            strokeDasharray="4,4"
            opacity={0.8}
          />

          {/* Center guides */}
          <line
            x1={canvasWidth / 2}
            y1={0}
            x2={canvasWidth / 2}
            y2={canvasHeight}
            stroke="hsl(var(--guide-color))"
            strokeWidth={1}
            strokeDasharray="4,8"
            opacity={0.4}
          />

          {/* Face oval guide */}
          <ellipse
            cx={canvasWidth / 2}
            cy={canvasHeight * 0.42}
            rx={canvasWidth * 0.28}
            ry={canvasHeight * 0.35}
            fill="none"
            stroke="hsl(var(--guide-color))"
            strokeWidth={2}
            strokeDasharray="6,4"
            opacity={0.6}
          />

          {/* Labels */}
          <text
            x={8}
            y={headTop - 4}
            fill="hsl(var(--guide-color))"
            fontSize={10}
            fontWeight={500}
          >
            Top of head
          </text>
          <text
            x={8}
            y={eyeLine - 4}
            fill="hsl(var(--guide-success))"
            fontSize={10}
            fontWeight={500}
          >
            Eye line
          </text>
          <text
            x={8}
            y={headBottom + 12}
            fill="hsl(var(--guide-color))"
            fontSize={10}
            fontWeight={500}
          >
            Chin
          </text>
        </svg>

        {/* Drag indicator */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md glass-effect text-xs text-muted-foreground">
          <Move className="h-3 w-3" />
          Drag to adjust
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Slider
          value={[scale]}
          min={0.5}
          max={3}
          step={0.05}
          onValueChange={([v]) => setScale(v)}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setScale((s) => Math.min(3, s + 0.1))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-3">
        <Button onClick={exportCroppedImage} className="flex-1" size="lg">
          Confirm & Continue
        </Button>
      </div>

      {/* Guide legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-guide rounded" />
          <span>Head height zone ({standard.headHeightMin}-{standard.headHeightMax}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-guide-success rounded" />
          <span>Eye line ({standard.eyeLineFromBottom}% from bottom)</span>
        </div>
      </div>
    </div>
  );
}
