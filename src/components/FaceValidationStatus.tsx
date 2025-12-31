import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface FaceValidationStatusProps {
  validation: FaceValidation | null;
  isLoading: boolean;
  isModelLoading: boolean;
  loadingProgress: number;
  error: string | null;
}

export function FaceValidationStatus({
  validation,
  isLoading,
  isModelLoading,
  loadingProgress,
  error,
}: FaceValidationStatusProps) {
  if (isModelLoading) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Loading AI model...</p>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {loadingProgress}% - First load may take a moment
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-medium">Detecting face...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Detection Failed</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click "Auto-Detect Face" to analyze your photo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-3",
        validation.isValid
          ? "border-guide-success/50 bg-guide-success/10"
          : "border-guide-warning/50 bg-guide-warning/10"
      )}
    >
      <div className="flex items-center gap-2">
        {validation.isValid ? (
          <CheckCircle2 className="h-5 w-5 text-guide-success" />
        ) : (
          <AlertCircle className="h-5 w-5 text-guide-warning" />
        )}
        <span className="font-medium text-sm">
          {validation.isValid ? "Photo meets requirements" : "Adjustments needed"}
        </span>
      </div>

      <div className="grid gap-2">
        <ValidationItem
          label="Head Height"
          isValid={validation.headHeightValid}
          value={`${validation.headHeightPercent.toFixed(0)}%`}
        />
        <ValidationItem
          label="Eye Position"
          isValid={validation.eyeLineValid}
          value={`${validation.eyeLinePercent.toFixed(0)}% from bottom`}
        />
        <ValidationItem
          label="Centered"
          isValid={validation.centeredValid}
          value={`${validation.centerOffset.toFixed(0)}% offset`}
        />
      </div>

      {validation.messages.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          {validation.messages.map((msg, i) => (
            <p key={i} className="text-xs text-muted-foreground">
              {msg}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function ValidationItem({
  label,
  isValid,
  value,
}: {
  label: string;
  isValid: boolean;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        {isValid ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-guide-success" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-guide-warning" />
        )}
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className={cn("font-mono", isValid ? "text-guide-success" : "text-guide-warning")}>
        {value}
      </span>
    </div>
  );
}
