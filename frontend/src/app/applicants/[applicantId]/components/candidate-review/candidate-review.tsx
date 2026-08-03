import { useState } from "react";
import { Star, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isHighlighted = hoveredValue !== null ? star <= hoveredValue : star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => { onChange(star); }}
            onMouseEnter={() => { if (!disabled) setHoveredValue(star); }}
            onMouseLeave={() => { if (!disabled) setHoveredValue(null); }}
            aria-label={`Rate ${String(star)} star${star > 1 ? "s" : ""}`}
            className="disabled:opacity-50 transition-transform duration-100 hover:scale-110 focus:outline-none"
          >
            <Star
              className={cn(
                "size-6 text-muted-foreground transition-colors",
                isHighlighted && "fill-primary text-primary",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

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
  const [notesOverride, setNotesOverride] = useState<string | null>(null);
  const [decisionOverride, setDecisionOverride] = useState<ReviewDecision | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rating = ratingOverride ?? ownershipQuery.data?.recruiterRating ?? 0;
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
    rating > 0 &&
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
    },
  });

  const isNotesChanged = notesOverride !== null && notesOverride !== (ownershipQuery.data?.recruiterRatingNote ?? "");

  const handleConfirmSubmit = () => {
    if (!decision) return;

    void (async () => {
      try {
        await rateMutation.mutateAsync({ rating, notes });
        if (decision === "shortlist") {
          await shortlistMutation.mutateAsync(undefined);
        } else {
          await rejectMutation.mutateAsync(undefined);
        }
        setRatingOverride(null);
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
          Decide, rate, and leave notes for this applicant
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {!isAssignedToCurrentRecruiter ? (
          <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            You can view this applicant and add notes, but shortlist, reject, and rating actions are available only after you claim or are assigned to this applicant.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Rating
            </Label>
            <StarRatingInput value={rating} onChange={setRatingOverride} disabled={ownershipQuery.isLoading} />
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
                disabled={shortlistMutation.isPending}
                onClick={() => {
                  shortlistMutation.mutate(undefined, {
                    onSuccess: () => {
                      void queryClient.invalidateQueries({ queryKey: queryKeys.applicationLogs(applicationId) });
                    }
                  });
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                  isShortlisted
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:bg-accent hover:text-white",
                )}
              >
                <Star className={cn("size-4", isShortlisted && "fill-primary")} />
                {shortlistMutation.isPending ? "Shortlisting..." : "Shortlist"}
              </button>
              <button
                type="button"
                disabled={rejectMutation.isPending}
                onClick={() => {
                  rejectMutation.mutate(undefined, {
                    onSuccess: () => {
                      void queryClient.invalidateQueries({ queryKey: queryKeys.applicationLogs(applicationId) });
                    }
                  });
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                  isRejected
                    ? "border-destructive bg-destructive text-destructive-foreground"
                    : "border-input hover:bg-destructive hover:text-white",
                )}
              >
                <X className="size-4" />
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        ) : null}

        <Button
          className="h-11 w-full text-base font-medium text-white hover:bg-primary/80"
          disabled={!isAssignedToCurrentRecruiter || rating === 0 || rateMutation.isPending}
          onClick={() => {
            rateMutation.mutate(
              { rating, notes: notes.length > 0 ? notes : undefined },
              {
                onSuccess: () => {
                  setRatingOverride(null);
                  setNotesOverride(null);
                  void queryClient.invalidateQueries({ queryKey: queryKeys.applicationLogs(applicationId) });
                }
              }
            );
          }}
        >
          {rateMutation.isPending ? "Submitting..." : "Submit Rating"}
        </Button>
      </CardContent>
    </Card>
  );
}
