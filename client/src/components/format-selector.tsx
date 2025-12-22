import { FileSpreadsheet, FileText, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ExportFormat } from "@shared/schema";

interface FormatSelectorProps {
  selectedFormat: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
}

const formats = [
  {
    value: "xlsx" as const,
    label: "Excel (.xlsx)",
    description: "Best for data analysis and sorting",
    icon: FileSpreadsheet,
  },
  {
    value: "docx" as const,
    label: "Word (.docx)",
    description: "Best for printing and sharing",
    icon: FileText,
  },
];

export function FormatSelector({ selectedFormat, onFormatChange }: FormatSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {formats.map((format) => {
        const isSelected = selectedFormat === format.value;
        const Icon = format.icon;
        return (
          <Card
            key={format.value}
            className={`relative cursor-pointer p-4 transition-colors hover-elevate ${
              isSelected ? "border-primary ring-1 ring-primary" : ""
            }`}
            onClick={() => onFormatChange(format.value)}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onFormatChange(format.value);
              }
            }}
            data-testid={`card-format-${format.value}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md ${
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium" data-testid={`text-format-label-${format.value}`}>
                  {format.label}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {format.description}
                </p>
              </div>
              {isSelected && (
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
