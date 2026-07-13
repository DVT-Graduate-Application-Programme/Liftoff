"use client";

import * as React from "react";

interface ApplicantSelectionContextValue {
  selectedApplicationId: string | null;
  selectApplication: (applicationId: string) => void;
}

const ApplicantSelectionContext = React.createContext<ApplicantSelectionContextValue | null>(null);

export function ApplicantSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedApplicationId, setSelectedApplicationId] = React.useState<string | null>(null);

  const value = React.useMemo(
    () => ({ selectedApplicationId, selectApplication: setSelectedApplicationId }),
    [selectedApplicationId],
  );

  return <ApplicantSelectionContext.Provider value={value}>{children}</ApplicantSelectionContext.Provider>;
}

export function useApplicantSelection() {
  const context = React.useContext(ApplicantSelectionContext);
  if (!context) {
    throw new Error("useApplicantSelection must be used within an ApplicantSelectionProvider");
  }
  return context;
}
