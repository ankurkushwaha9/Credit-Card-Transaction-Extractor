import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Upload, RefreshCw, Lock, Timer, CheckCircle } from "lucide-react";
import { Header } from "@/components/header";
import { FileDropzone } from "@/components/file-dropzone";
import { TransactionTable } from "@/components/transaction-table";
import { FormatSelector } from "@/components/format-selector";
import { ProcessingView } from "@/components/processing-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Statement, ExportFormat } from "@shared/schema";

type AppState = "upload" | "processing" | "results";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statementId, setStatementId] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("xlsx");
  const [uploadError, setUploadError] = useState<string | undefined>();
  const [downloadCountdown, setDownloadCountdown] = useState<number | null>(null);

  const { data: statement, isLoading: isLoadingStatement } = useQuery<Statement>({
    queryKey: ["/api/statements", statementId],
    enabled: !!statementId && appState === "results",
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/statements/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setStatementId(data.statementId);
      setAppState("results");
      queryClient.invalidateQueries({ queryKey: ["/api/statements", data.statementId] });
    },
    onError: (error: Error) => {
      setUploadError(error.message);
      setAppState("upload");
      setUploadProgress(0);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async ({ id, format }: { id: string; format: ExportFormat }) => {
      const response = await fetch(`/api/statements/${id}/export?format=${format}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Export failed");
      }
      const blob = await response.blob();
      return { blob, format };
    },
    onSuccess: ({ blob, format }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadCountdown(300);
      const interval = setInterval(() => {
        setDownloadCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setUploadError(undefined);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setUploadError(undefined);
    setUploadProgress(0);
  }, []);

  const handleUpload = useCallback(() => {
    if (!selectedFile) return;
    setAppState("processing");
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    uploadMutation.mutate(selectedFile);
  }, [selectedFile, uploadMutation]);

  const handleDownload = useCallback(() => {
    if (!statementId) return;
    downloadMutation.mutate({ id: statementId, format: selectedFormat });
  }, [statementId, selectedFormat, downloadMutation]);

  const handleProcessAnother = useCallback(() => {
    setAppState("upload");
    setSelectedFile(null);
    setStatementId(null);
    setUploadProgress(0);
    setUploadError(undefined);
    setDownloadCountdown(null);
  }, []);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        {appState === "upload" && (
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-page-title">
                Financial Statement Processor
              </h1>
              <p className="mt-2 text-muted-foreground">
                Upload your bank or credit card statement to extract transaction data
              </p>
            </div>

            <FileDropzone
              onFileSelect={handleFileSelect}
              isUploading={uploadMutation.isPending}
              uploadProgress={uploadProgress}
              selectedFile={selectedFile}
              onRemoveFile={handleRemoveFile}
              error={uploadError}
            />

            {selectedFile && !uploadMutation.isPending && (
              <div className="mt-6 flex justify-center">
                <Button
                  size="lg"
                  onClick={handleUpload}
                  className="w-full sm:w-auto"
                  data-testid="button-process"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Process Statement
                </Button>
              </div>
            )}

            <Card className="mt-8 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>End-to-end encryption</span>
                </div>
                <div className="hidden sm:block h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  <span>Files auto-deleted after processing</span>
                </div>
                <div className="hidden sm:block h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>No data stored</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {appState === "processing" && (
          <ProcessingView
            filename={selectedFile?.name || "document.pdf"}
            status="Extracting transactions..."
          />
        )}

        {appState === "results" && statement && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold" data-testid="text-results-title">
                  Extracted Transactions
                </h1>
                <p className="mt-1 text-muted-foreground" data-testid="text-results-filename">
                  From: {statement.filename}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleProcessAnother}
                data-testid="button-process-another"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Process Another
              </Button>
            </div>

            <TransactionTable transactions={statement.transactions} />

            <Card className="p-6">
              <h2 className="font-medium mb-4">Download Options</h2>
              <FormatSelector
                selectedFormat={selectedFormat}
                onFormatChange={setSelectedFormat}
              />

              <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                <Button
                  size="lg"
                  onClick={handleDownload}
                  disabled={downloadMutation.isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-download"
                >
                  {downloadMutation.isPending ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download {selectedFormat.toUpperCase()}
                    </>
                  )}
                </Button>

                {downloadCountdown !== null && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span>Download expires in {formatCountdown(downloadCountdown)}</span>
                  </div>
                )}
              </div>

              {downloadMutation.isError && (
                <p className="mt-4 text-sm text-destructive" data-testid="text-download-error">
                  {downloadMutation.error.message}
                </p>
              )}
            </Card>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Secure connection • Data encrypted in transit</span>
            </div>
          </div>
        )}

        {appState === "results" && isLoadingStatement && (
          <ProcessingView
            filename={selectedFile?.name || "document.pdf"}
            status="Loading results..."
          />
        )}
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Secure Connection</span>
              <Badge variant="secondary" className="text-xs">TLS 1.3</Badge>
            </div>
            <p>Your files are processed securely and never stored.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
