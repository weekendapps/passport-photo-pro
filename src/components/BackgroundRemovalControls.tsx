import { useState } from "react";
import { Eraser, Loader2, Check, AlertCircle, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface BackgroundRemovalControlsProps {
  isLoading: boolean;
  isModelLoading: boolean;
  loadingProgress: number;
  error: string | null;
  isBackgroundRemoved: boolean;
  selectedColor: string;
  requiredColor: string;
  onRemoveBackground: () => void;
  onColorChange: (color: string) => void;
}

const PRESET_COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Light Grey", value: "#F5F5F5" },
  { name: "Grey", value: "#E8E8E8" },
  { name: "Off White", value: "#F0F0F0" },
  { name: "Light Blue", value: "#E6F0FF" },
  { name: "Cream", value: "#FFFDD0" },
];

export function BackgroundRemovalControls({
  isLoading,
  isModelLoading,
  loadingProgress,
  error,
  isBackgroundRemoved,
  selectedColor,
  requiredColor,
  onRemoveBackground,
  onColorChange,
}: BackgroundRemovalControlsProps) {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const isColorMatching =
    selectedColor.toLowerCase() === requiredColor.toLowerCase();

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={isBackgroundRemoved ? "secondary" : "outline"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemoveBackground();
          }}
          disabled={isLoading || isModelLoading}
          className="flex-1 gap-2"
        >
          {isLoading || isModelLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isModelLoading
                ? `Loading AI (${loadingProgress}%)`
                : "Processing..."}
            </>
          ) : isBackgroundRemoved ? (
            <>
              <Check className="h-4 w-4" />
              Background Removed
            </>
          ) : (
            <>
              <Eraser className="h-4 w-4" />
              Remove Background
            </>
          )}
        </Button>

        <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative"
              disabled={!isBackgroundRemoved}
            >
              <Palette className="h-4 w-4" />
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background"
                style={{ backgroundColor: selectedColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Background Color</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onColorChange(requiredColor);
                    setIsColorPickerOpen(false);
                  }}
                >
                  Use Required
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      onColorChange(color.value);
                      setIsColorPickerOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all hover:scale-105",
                      selectedColor === color.value
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:border-border"
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-md border shadow-sm"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Custom Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isBackgroundRemoved && !error && (
        <div
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg text-sm",
            isColorMatching
              ? "bg-guide-success/10 text-guide-success"
              : "bg-guide-warning/10 text-guide-warning"
          )}
        >
          {isColorMatching ? (
            <>
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>
                Background matches country requirement ({requiredColor})
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                Recommended background: {requiredColor} (current: {selectedColor})
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
