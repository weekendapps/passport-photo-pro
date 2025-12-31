export interface PassportStandard {
  id: string;
  country: string;
  countryCode: string;
  flag: string;
  width: number; // in mm
  height: number; // in mm
  headHeightMin: number; // percentage of total height
  headHeightMax: number;
  eyeLineFromBottom: number; // percentage from bottom
  backgroundColor: string;
  notes: string[];
}

export const passportStandards: PassportStandard[] = [
  {
    id: "us",
    country: "United States",
    countryCode: "US",
    flag: "🇺🇸",
    width: 51,
    height: 51,
    headHeightMin: 50,
    headHeightMax: 69,
    eyeLineFromBottom: 56,
    backgroundColor: "#FFFFFF",
    notes: [
      "Head must be centered",
      "Neutral expression required",
      "Eyes must be open and visible",
    ],
  },
  {
    id: "uk",
    country: "United Kingdom",
    countryCode: "GB",
    flag: "🇬🇧",
    width: 35,
    height: 45,
    headHeightMin: 66,
    headHeightMax: 75,
    eyeLineFromBottom: 55,
    backgroundColor: "#FFFFFF",
    notes: [
      "Plain cream or light grey background accepted",
      "Mouth closed",
      "No glasses with tinted lenses",
    ],
  },
  {
    id: "eu",
    country: "European Union (Schengen)",
    countryCode: "EU",
    flag: "🇪🇺",
    width: 35,
    height: 45,
    headHeightMin: 70,
    headHeightMax: 80,
    eyeLineFromBottom: 60,
    backgroundColor: "#F0F0F0",
    notes: [
      "ICAO compliant",
      "Light background required",
      "Face must be clearly visible",
    ],
  },
  {
    id: "india",
    country: "India",
    countryCode: "IN",
    flag: "🇮🇳",
    width: 35,
    height: 45,
    headHeightMin: 50,
    headHeightMax: 70,
    eyeLineFromBottom: 55,
    backgroundColor: "#FFFFFF",
    notes: [
      "White background only",
      "80% face coverage",
      "No border around photo",
    ],
  },
  {
    id: "china",
    country: "China",
    countryCode: "CN",
    flag: "🇨🇳",
    width: 33,
    height: 48,
    headHeightMin: 62,
    headHeightMax: 73,
    eyeLineFromBottom: 50,
    backgroundColor: "#FFFFFF",
    notes: [
      "Ears must be visible",
      "No head covering",
      "Natural complexion required",
    ],
  },
  {
    id: "canada",
    country: "Canada",
    countryCode: "CA",
    flag: "🇨🇦",
    width: 50,
    height: 70,
    headHeightMin: 45,
    headHeightMax: 56,
    eyeLineFromBottom: 55,
    backgroundColor: "#FFFFFF",
    notes: [
      "White or light-colored background",
      "Neutral expression",
      "Both eyes clearly visible",
    ],
  },
  {
    id: "australia",
    country: "Australia",
    countryCode: "AU",
    flag: "🇦🇺",
    width: 35,
    height: 45,
    headHeightMin: 60,
    headHeightMax: 75,
    eyeLineFromBottom: 55,
    backgroundColor: "#FFFFFF",
    notes: [
      "Plain light background",
      "Head centered in frame",
      "Glasses allowed if eyes visible",
    ],
  },
  {
    id: "japan",
    country: "Japan",
    countryCode: "JP",
    flag: "🇯🇵",
    width: 35,
    height: 45,
    headHeightMin: 60,
    headHeightMax: 70,
    eyeLineFromBottom: 55,
    backgroundColor: "#FFFFFF",
    notes: [
      "White background only",
      "No shadows on face",
      "Hair should not cover forehead",
    ],
  },
  {
    id: "germany",
    country: "Germany",
    countryCode: "DE",
    flag: "🇩🇪",
    width: 35,
    height: 45,
    headHeightMin: 70,
    headHeightMax: 80,
    eyeLineFromBottom: 60,
    backgroundColor: "#F5F5F5",
    notes: [
      "Light grey background preferred",
      "Biometric compliant",
      "Face 70-80% of photo height",
    ],
  },
  {
    id: "france",
    country: "France",
    countryCode: "FR",
    flag: "🇫🇷",
    width: 35,
    height: 45,
    headHeightMin: 70,
    headHeightMax: 80,
    eyeLineFromBottom: 60,
    backgroundColor: "#E8E8E8",
    notes: [
      "Light blue-grey background accepted",
      "Neutral expression required",
      "No smiling",
    ],
  },
];

export interface SheetSize {
  id: string;
  name: string;
  width: number; // in mm
  height: number; // in mm
  dpi: number;
}

export const sheetSizes: SheetSize[] = [
  { id: "4x6", name: '4" × 6"', width: 101.6, height: 152.4, dpi: 300 },
  { id: "5x7", name: '5" × 7"', width: 127, height: 177.8, dpi: 300 },
  { id: "a4", name: "A4", width: 210, height: 297, dpi: 300 },
  { id: "letter", name: "US Letter", width: 215.9, height: 279.4, dpi: 300 },
  { id: "a5", name: "A5", width: 148, height: 210, dpi: 300 },
];

export function calculatePhotosPerSheet(
  photoWidth: number,
  photoHeight: number,
  sheet: SheetSize,
  marginMm: number = 5,
  gapMm: number = 2
): { columns: number; rows: number; total: number } {
  const usableWidth = sheet.width - 2 * marginMm;
  const usableHeight = sheet.height - 2 * marginMm;

  const columns = Math.floor((usableWidth + gapMm) / (photoWidth + gapMm));
  const rows = Math.floor((usableHeight + gapMm) / (photoHeight + gapMm));

  return { columns, rows, total: columns * rows };
}

export function mmToPixels(mm: number, dpi: number = 300): number {
  return Math.round((mm / 25.4) * dpi);
}

export function pixelsToMm(pixels: number, dpi: number = 300): number {
  return (pixels * 25.4) / dpi;
}
