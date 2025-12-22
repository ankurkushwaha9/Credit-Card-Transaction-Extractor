import { Loader2, Shield, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ProcessingViewProps {
  filename: string;
  status: string;
}

export function ProcessingView({ filename, status }: ProcessingViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium" data-testid="text-processing-filename">
              {filename}
            </p>
            <p className="text-sm text-muted-foreground">Processing document</p>
          </div>
        </div>

        <div className="flex flex-col items-center py-8">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
          <p className="mt-4 font-medium" data-testid="text-processing-status">
            {status}
          </p>
          <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">
            Extracting transaction data from your statement
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Your data is encrypted and secure</span>
        </div>
      </Card>
    </div>
  );
}
