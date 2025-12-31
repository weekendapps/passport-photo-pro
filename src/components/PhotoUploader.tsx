import { useCallback, useState } from "react";
import { Upload, Camera, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
}

export function PhotoUploader({ onImageSelect }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          onImageSelect(file, reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "relative flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed p-12 transition-all duration-300",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <div
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300",
          isDragging
            ? "bg-primary text-primary-foreground scale-110"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isDragging ? (
          <Upload className="h-10 w-10 animate-bounce" />
        ) : (
          <ImageIcon className="h-10 w-10" />
        )}
      </div>

      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {isDragging ? "Drop your photo here" : "Upload Your Photo"}
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Drag and drop a photo, or click the button below to select from your
          device
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="default"
          size="lg"
          className="gap-2"
          onClick={() => document.getElementById("photo-input")?.click()}
        >
          <Upload className="h-4 w-4" />
          Choose Photo
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={() => document.getElementById("camera-input")?.click()}
        >
          <Camera className="h-4 w-4" />
          Take Photo
        </Button>
      </div>

      <input
        id="photo-input"
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        id="camera-input"
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleInputChange}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground">
        Supported formats: JPG, PNG, WebP • Max size: 10MB
      </p>
    </div>
  );
}
