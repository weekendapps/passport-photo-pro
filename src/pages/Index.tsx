import { useState } from "react";
import { PhotoUploader } from "@/components/PhotoUploader";
import { PhotoEditor } from "@/components/PhotoEditor";
import { CountrySelector } from "@/components/CountrySelector";
import { SheetSizeSelector } from "@/components/SheetSizeSelector";
import { SheetPreview } from "@/components/SheetPreview";
import {
  passportStandards,
  sheetSizes,
  type PassportStandard,
  type SheetSize,
} from "@/data/passportStandards";
import { Camera, ArrowLeft, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = "upload" | "edit" | "export";

const Index = () => {
  const [step, setStep] = useState<Step>("upload");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<PassportStandard>(
    passportStandards[0]
  );
  const [selectedSheet, setSelectedSheet] = useState<SheetSize>(sheetSizes[0]);

  const handleImageSelect = (_file: File, preview: string) => {
    setOriginalImage(preview);
    setStep("edit");
  };

  const handleCropComplete = (cropped: string) => {
    setCroppedImage(cropped);
    setStep("export");
  };

  const handleBack = () => {
    if (step === "edit") {
      setStep("upload");
      setOriginalImage(null);
    } else if (step === "export") {
      setStep("edit");
      setCroppedImage(null);
    }
  };

  const handleStartOver = () => {
    setStep("upload");
    setOriginalImage(null);
    setCroppedImage(null);
  };

  const steps = [
    { id: "upload", label: "Upload", icon: Camera },
    { id: "edit", label: "Adjust", icon: Check },
    { id: "export", label: "Export", icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">PhotoPass</h1>
                <p className="text-xs text-muted-foreground">
                  Professional Passport Photos
                </p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="hidden sm:flex items-center gap-2">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      i <= currentStepIndex
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                        i < currentStepIndex
                          ? "bg-primary text-primary-foreground"
                          : i === currentStepIndex
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i < currentStepIndex ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    {s.label}
                  </div>
                  {i < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Back button */}
        {step !== "upload" && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar - Settings */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-card rounded-2xl p-6 shadow-md border">
              <h2 className="text-lg font-semibold mb-4">Photo Settings</h2>
              <div className="space-y-6">
                <CountrySelector
                  value={selectedStandard.id}
                  onChange={setSelectedStandard}
                />
                {step === "export" && (
                  <SheetSizeSelector
                    value={selectedSheet.id}
                    onChange={setSelectedSheet}
                  />
                )}
              </div>
            </div>

            {/* Info card */}
            <div className="bg-card rounded-2xl p-6 shadow-md border">
              <h3 className="text-sm font-semibold mb-3">
                {selectedStandard.flag} {selectedStandard.country} Specifications
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Photo Size</dt>
                  <dd className="font-medium font-mono">
                    {selectedStandard.width}×{selectedStandard.height}mm
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Head Height</dt>
                  <dd className="font-medium font-mono">
                    {selectedStandard.headHeightMin}-{selectedStandard.headHeightMax}%
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Eye Line</dt>
                  <dd className="font-medium font-mono">
                    {selectedStandard.eyeLineFromBottom}% from bottom
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Background</dt>
                  <dd className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: selectedStandard.backgroundColor }}
                    />
                    <span className="font-mono text-xs">
                      {selectedStandard.backgroundColor}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-md border animate-fade-in">
              {step === "upload" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Create Professional Passport Photos
                    </h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      Upload a photo and we'll help you create print-ready passport
                      photos that comply with official standards from 10+ countries.
                    </p>
                  </div>
                  <PhotoUploader onImageSelect={handleImageSelect} />
                </div>
              )}

              {step === "edit" && originalImage && (
                <PhotoEditor
                  imageSrc={originalImage}
                  standard={selectedStandard}
                  onCropComplete={handleCropComplete}
                />
              )}

              {step === "export" && croppedImage && (
                <div className="space-y-6">
                  <SheetPreview
                    croppedImage={croppedImage}
                    standard={selectedStandard}
                    sheet={selectedSheet}
                  />
                  <div className="flex justify-center pt-4">
                    <Button variant="ghost" onClick={handleStartOver}>
                      Create Another Set
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 PhotoPass. Create professional passport photos instantly.</p>
            <div className="flex items-center gap-4">
              <span>Supports 10+ country standards</span>
              <span>•</span>
              <span>300 DPI export quality</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
