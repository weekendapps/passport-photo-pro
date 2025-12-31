import { useRef, useEffect, useCallback } from "react";
import { type PassportStandard, type SheetSize, calculatePhotosPerSheet, mmToPixels } from "@/data/passportStandards";
import { Download, Printer, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SheetPreviewProps {
  croppedImage: string;
  standard: PassportStandard;
  sheet: SheetSize;
}

export function SheetPreview({ croppedImage, standard, sheet }: SheetPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewScale = 0.5; // Scale for preview display
  const marginMm = 5;
  const gapMm = 2;

  const { columns, rows, total } = calculatePhotosPerSheet(
    standard.width,
    standard.height,
    sheet,
    marginMm,
    gapMm
  );

  const drawSheet = useCallback(async (exportMode = false) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return null;

    const dpi = sheet.dpi;
    const scale = exportMode ? 1 : previewScale;

    const sheetWidthPx = mmToPixels(sheet.width, dpi) * scale;
    const sheetHeightPx = mmToPixels(sheet.height, dpi) * scale;
    const photoWidthPx = mmToPixels(standard.width, dpi) * scale;
    const photoHeightPx = mmToPixels(standard.height, dpi) * scale;
    const marginPx = mmToPixels(marginMm, dpi) * scale;
    const gapPx = mmToPixels(gapMm, dpi) * scale;

    if (exportMode) {
      canvas.width = sheetWidthPx;
      canvas.height = sheetHeightPx;
    }

    // Fill white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw the cropped image
    const img = new Image();
    img.src = croppedImage;

    await new Promise<void>((resolve) => {
      img.onload = () => {
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < columns; col++) {
            const x = marginPx + col * (photoWidthPx + gapPx);
            const y = marginPx + row * (photoHeightPx + gapPx);
            ctx.drawImage(img, x, y, photoWidthPx, photoHeightPx);

            // Draw border around each photo
            ctx.strokeStyle = "#E5E5E5";
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, photoWidthPx, photoHeightPx);
          }
        }
        resolve();
      };
    });

    // Draw cut guides (corner marks)
    ctx.strokeStyle = "#CCCCCC";
    ctx.lineWidth = 0.5;
    const guideLength = 10 * scale;

    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= columns; col++) {
        const x = marginPx + col * (photoWidthPx + gapPx) - gapPx / 2;
        const y = marginPx + row * (photoHeightPx + gapPx) - gapPx / 2;

        // Draw corner marks
        if (col < columns && row < rows) {
          // Top-left
          ctx.beginPath();
          ctx.moveTo(marginPx + col * (photoWidthPx + gapPx), marginPx + row * (photoHeightPx + gapPx) - guideLength);
          ctx.lineTo(marginPx + col * (photoWidthPx + gapPx), marginPx + row * (photoHeightPx + gapPx));
          ctx.lineTo(marginPx + col * (photoWidthPx + gapPx) - guideLength, marginPx + row * (photoHeightPx + gapPx));
          ctx.stroke();
        }
      }
    }

    return canvas.toDataURL("image/jpeg", 0.95);
  }, [croppedImage, standard, sheet, columns, rows]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sheetWidthPx = mmToPixels(sheet.width, sheet.dpi) * previewScale;
    const sheetHeightPx = mmToPixels(sheet.height, sheet.dpi) * previewScale;

    canvas.width = sheetWidthPx;
    canvas.height = sheetHeightPx;

    drawSheet(false);
  }, [drawSheet, sheet.width, sheet.height, sheet.dpi]);

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create high-res export
    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    const dpi = sheet.dpi;
    tempCanvas.width = mmToPixels(sheet.width, dpi);
    tempCanvas.height = mmToPixels(sheet.height, dpi);

    // Fill white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    const photoWidthPx = mmToPixels(standard.width, dpi);
    const photoHeightPx = mmToPixels(standard.height, dpi);
    const marginPx = mmToPixels(marginMm, dpi);
    const gapPx = mmToPixels(gapMm, dpi);

    const img = new Image();
    img.src = croppedImage;

    await new Promise<void>((resolve) => {
      img.onload = () => {
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < columns; col++) {
            const x = marginPx + col * (photoWidthPx + gapPx);
            const y = marginPx + row * (photoHeightPx + gapPx);
            ctx.drawImage(img, x, y, photoWidthPx, photoHeightPx);
          }
        }
        resolve();
      };
    });

    const dataUrl = tempCanvas.toDataURL("image/jpeg", 0.95);
    const link = document.createElement("a");
    link.download = `passport-photos-${standard.countryCode}-${sheet.id}-${Date.now()}.jpg`;
    link.href = dataUrl;
    link.click();

    toast.success("Sheet downloaded successfully!", {
      description: `${total} photos on ${sheet.name} sheet`,
    });
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Passport Photos - ${standard.country}</title>
          <style>
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            img { max-width: 100%; height: auto; }
            @media print {
              body { margin: 0; }
              img { width: ${sheet.width}mm; height: ${sheet.height}mm; }
            }
          </style>
        </head>
        <body>
          <img src="${canvas.toDataURL("image/jpeg", 0.95)}" />
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sheet Preview</h3>
          <p className="text-sm text-muted-foreground">
            {total} photos ({columns}×{rows}) on {sheet.name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Grid className="h-4 w-4" />
          {standard.width}×{standard.height}mm per photo
        </div>
      </div>

      <div className="flex justify-center p-6 bg-muted/30 rounded-xl">
        <div className="relative shadow-lg">
          <canvas
            ref={canvasRef}
            className="rounded-sm"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleDownload} className="flex-1 gap-2" size="lg">
          <Download className="h-4 w-4" />
          Download High-Res ({sheet.dpi} DPI)
        </Button>
        <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2" size="lg">
          <Printer className="h-4 w-4" />
          Print Sheet
        </Button>
      </div>

      <div className="p-4 bg-accent/10 rounded-lg">
        <p className="text-sm text-accent-foreground">
          <strong>Print Tips:</strong> For best results, use photo paper and ensure your printer is set to "Actual Size" or 100% scale. The sheet includes subtle cut guides for easy trimming.
        </p>
      </div>
    </div>
  );
}
