import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReevaluateApplication } from "@/hooks/use-reevaluate-application";

export function ReevaluateButton({ applicantId }: { applicantId: string }) {
  const [open, setOpen] = useState(false);
  const reevaluate = useReevaluateApplication(applicantId);

  const handleConfirm = () => {
    reevaluate.mutate(undefined, {
      onSuccess: () => { setOpen(false); }
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => { setOpen(true); }} className="gap-2">
        <RefreshCw className={cn("size-4", reevaluate.isPending && "animate-spin")} />
        Re-evaluate
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold">Confirm Re-evaluation</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to re-evaluate this applicant? This will reset the AI summary and trigger a new analysis based on the latest uploaded documents.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => { setOpen(false); }} disabled={reevaluate.isPending}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={reevaluate.isPending}>
                {reevaluate.isPending ? "Re-evaluating..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
