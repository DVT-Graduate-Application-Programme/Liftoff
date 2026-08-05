import { useState } from "react";
import { Star, X } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/ui/star-rating";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useOwnership } from "@/hooks/use-ownership";
import { useRateApplication } from "@/hooks/use-rate-application";
import { ACTIVE_RECRUITER_ID } from "@/hooks/use-claim-application";
import { useShortlistApplication } from "@/hooks/use-shortlist-application";
import { useRejectApplication } from "@/hooks/use-reject-application";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { queryKeys } from "@/lib/query-keys";
import type { Ownership } from "@/types/api";

interface RateResponse {
  recruiterRating: number | null;
  recruiterRatingNote: string | null;
  ratedByRecruiterId: string | null;
  ratedAt: string | null;
}

type ReviewDecision = "shortlist" | "reject";

export function CandidateReview({ applicationId, currentStatus }: { applicationId: string; currentStatus?: string }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const ownershipQuery = useOwnership(applicationId);
  const rateMutation = useRateApplication(applicationId);
  const shortlistMutation = useShortlistApplication(applicationId);
  const rejectMutation = useRejectApplication(applicationId);

  const [ratingOverride, setRatingOverride] = useState<number | null>(null);
  const [cultureFitOverride, setCultureFitOverride] = useState<number | null>(null);
  const [techFitOverride, setTechFitOverride] = useState<number | null>(null);
  const [notesOverride, setNotesOverride] = useState<string | null>(null);
  const [decisionOverride, setDecisionOverride] = useState<ReviewDecision | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rating = ratingOverride ?? ownershipQuery.data?.recruiterRating ?? 0;
  // Culture/Tech Fit are local-only until the backend supports separate rating fields (see handleConfirmSubmit).
  const cultureFit = cultureFitOverride ?? 0;
  const techFit = techFitOverride ?? 0;
  const notes = notesOverride ?? ownershipQuery.data?.recruiterRatingNote ?? "";
  const statusUpper = currentStatus?.toUpperCase() ?? "";
  const recruiterIdentity = session?.user.email ?? ACTIVE_RECRUITER_ID;
  const isAssignedToCurrentRecruiter =
    ownershipQuery.data?.claimedByRecruiterId === recruiterIdentity ||
    ownershipQuery.data?.shortlistedByRecruiterId === recruiterIdentity ||
    ownershipQuery.data?.ratedByRecruiterId === recruiterIdentity;
  const isShortlisted = statusUpper === "SHORTLISTED";
  const isRejected = statusUpper === "REJECTED";
  const decision =
    decisionOverride ??
    (isShortlisted ? "shortlist" : isRejected ? "reject" : null);
  const isSubmitting =
    rateMutation.isPending || shortlistMutation.isPending || rejectMutation.isPending;
  const canSubmit =
    isAssignedToCurrentRecruiter &&
    (isShortlisted ? cultureFit > 0 && techFit > 0 : rating > 0) &&
    decision !== null &&
    notes.trim().length > 0 &&
    !isSubmitting;

  // Mutation to save notes only
  const notesMutation = useMutation({
    mutationFn: (notesText: string) =>
      apiFetch<RateResponse>(`/api/applications/${applicationId}/ownership/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData<Ownership | undefined>(queryKeys.ownership(applicationId), (prev) =>
        prev ? { ...prev, ...data } : prev,
      );
      setNotesOverride(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.applicationLogs(applicationId) });
      toast.success("Notes saved");
    },
    onError: () => {
      toast.error("Couldn't save notes");
    },
  });

  const isNotesChanged = notesOverride !== null && notesOverride !== (ownershipQuery.data?.recruiterRatingNote ?? "");

  const handleConfirmSubmit = () => {
    if (!decision) return;

    // TODO(#568-backend): persist cultureFit/techFit as separate fields once the backend
    // supports it. Until then, collapse them into the single `rating` field via Math.max
    // (rather than an average) so a candidate's standout dimension isn't diluted.
    const ratingToSubmit = isShortlisted ? Math.max(cultureFit, techFit) : rating;

    void (async () => {
      try {
        await rateMutation.mutateAsync({ rating: ratingToSubmit, notes });
        if (decision === "shortlist") {
          await shortlistMutation.mutateAsync(undefined);
        } else {
          await rejectMutation.mutateAsync(undefined);
        }
        setRatingOverride(null);
        // Culture/Tech Fit have no persisted field to fall back to yet (see TODO above),
        // so keep the submitted values visible instead of resetting them to 0.
        setNotesOverride(null);
        setDecisionOverride(null);
        setConfirmOpen(false);
        void queryClient.invalidateQueries({ queryKey: queryKeys.applicationLogs(applicationId) });
      } catch {
        // Mutations surface errors via react-query
      }
    })();
  };

  return (
    <Card className="shrink-0">
      <CardHeader>
        <CardTitle>Candidate Review</CardTitle>
        <p className="text-sm text-muted-foreground">
          Rate, choose shortlist or reject, add notes, then submit your review
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {!isAssignedToCurrentRecruiter ? (
          <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            You can view this applicant and add notes, but shortlist, reject, and rating actions are available only after you claim or are assigned to this applicant.
          </div>
        ) : isShortlisted ? (
          <div className="flex flex-wrap items-stretch gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Culture Fit
              </Label>
              <StarRating
                value={cultureFit}
                onChange={setCultureFitOverride}
                disabled={ownershipQuery.isLoading}
                variant="culture"
              />
            </div>
            <Separator orientation="vertical" />
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Tech Fit
              </Label>
              <StarRating
                value={techFit}
                onChange={setTechFitOverride}
                disabled={ownershipQuery.isLoading}
                variant="tech"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Rating
            </Label>
            <StarRating value={rating} onChange={setRatingOverride} disabled={ownershipQuery.isLoading} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="notes"
              className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              Notes
            </Label>
            {isNotesChanged && (
              <button
                type="button"
                disabled={notesMutation.isPending}
                onClick={() => { notesMutation.mutate(notes); }}
                className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
              >
                {notesMutation.isPending ? "Saving..." : "Save"}
              </button>
            )}
          </div>
          <Textarea
            id="notes"
            placeholder="Add notes about this candidate..."
            value={notes}
            onChange={(e) => { setNotesOverride(e.target.value); }}
            disabled={ownershipQuery.isLoading}
          />
        </div>

        {isAssignedToCurrentRecruiter ? (
          <div className="flex flex-col gap-2 pt-2">
            <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Decision
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => { setDecisionOverride("shortlist"); }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                  decision === "shortlist"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:bg-accent hover:text-white",
                )}
              >
                <Star className={cn("size-4", decision === "shortlist" && "fill-primary")} />
                Shortlist
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => { setDecisionOverride("reject"); }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                  decision === "reject"
                    ? "border-destructive bg-destructive text-destructive-foreground"
                    : "border-input hover:bg-destructive hover:text-white",
                )}
              >
                <X className="size-4" />
                Reject
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button
            size="lg"
            className="w-full font-medium text-white hover:bg-primary/80 sm:w-auto sm:min-w-40"
            disabled={!canSubmit}
            onClick={() => { setConfirmOpen(true); }}
          >
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      </CardContent>

      {confirmOpen && decision ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold">
              {decision === "shortlist" ? "Confirm Shortlist" : "Confirm Rejection"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {decision === "shortlist"
                ? "Are you sure you want to shortlist this applicant? This will submit your rating, notes, and mark them as shortlisted."
                : "Are you sure you want to reject this applicant? This will submit your rating, notes, and mark them as rejected."}
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => { setConfirmOpen(false); }} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant={decision === "reject" ? "destructive" : "default"}
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
