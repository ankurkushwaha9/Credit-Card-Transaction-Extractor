import { useCallback, useState } from "react";
import { Upload, FileText, X, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
  selectedFile: File | null;
  onRemoveFile: () => void;
  error?: string;
}

export function FileDropzone({
  onFileSelect,
  isUploading,
  uploadProgress,
  selectedFile,
  onRemoveFile,
  error,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
      e.target.value = "";
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium" data-testid="text-filename">
                {selectedFile.name}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-filesize">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          {!isUploading && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onRemoveFile}
              data-testid="button-remove-file"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isUploading && (
          <div className="mt-4 space-y-2">
            <Progress value={uploadProgress} className="h-2" data-testid="progress-upload" />
            <p className="text-center text-sm text-muted-foreground">
              {uploadProgress < 100 ? "Uploading..." : "Processing..."}
            </p>
          </div>
        )}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span data-testid="text-upload-error">{error}</span>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <label
        htmlFor="file-upload"
        className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="dropzone-upload"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <div className="mt-4 text-center">
          <p className="text-lg font-medium">Drag and drop your statement</p>
          <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Badge variant="secondary" className="text-xs">
            PDF format
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Up to 10MB
          </Badge>
        </div>
        <input
          id="file-upload"
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={handleFileInput}
          data-testid="input-file-upload"
        />
      </label>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Bank-grade encryption • Your data stays private</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span data-testid="text-error">{error}</span>
        </div>
      )}
    </div>
  );
}
