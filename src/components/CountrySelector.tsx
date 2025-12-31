import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { passportStandards, type PassportStandard } from "@/data/passportStandards";

interface CountrySelectorProps {
  value: string;
  onChange: (standard: PassportStandard) => void;
}

export function CountrySelector({ value, onChange }: CountrySelectorProps) {
  const handleChange = (id: string) => {
    const standard = passportStandards.find((s) => s.id === id);
    if (standard) onChange(standard);
  };

  const selected = passportStandards.find((s) => s.id === value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Country Standard
      </label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a country">
            {selected && (
              <span className="flex items-center gap-2">
                <span className="text-lg">{selected.flag}</span>
                <span>{selected.country}</span>
                <span className="text-muted-foreground text-xs ml-1">
                  ({selected.width}×{selected.height}mm)
                </span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {passportStandards.map((standard) => (
            <SelectItem key={standard.id} value={standard.id}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{standard.flag}</span>
                <span>{standard.country}</span>
                <span className="text-muted-foreground text-xs ml-auto">
                  {standard.width}×{standard.height}mm
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Requirements:
          </p>
          <ul className="space-y-1">
            {selected.notes.map((note, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
