import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sheetSizes, type SheetSize } from "@/data/passportStandards";

interface SheetSizeSelectorProps {
  value: string;
  onChange: (sheet: SheetSize) => void;
}

export function SheetSizeSelector({ value, onChange }: SheetSizeSelectorProps) {
  const handleChange = (id: string) => {
    const sheet = sheetSizes.find((s) => s.id === id);
    if (sheet) onChange(sheet);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Sheet Size</label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select sheet size" />
        </SelectTrigger>
        <SelectContent>
          {sheetSizes.map((sheet) => (
            <SelectItem key={sheet.id} value={sheet.id}>
              <div className="flex items-center gap-2">
                <span>{sheet.name}</span>
                <span className="text-muted-foreground text-xs">
                  ({sheet.width}×{sheet.height}mm)
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
