"use client";

import * as React from "react";

export type SelectionTabKey = "pending" | "all" | "accepted";

interface ApplicantSelectionContextValue {
  selectedApplicationId: string | null;
  selectedTabKey: SelectionTabKey | null;
  selectApplication: (applicationId: string, tabKey?: SelectionTabKey) => void;
}

const ApplicantSelectionContext = React.createContext<ApplicantSelectionContextValue | null>(null);

export function ApplicantSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedApplicationId, setSelectedApplicationId] = React.useState<string | null>(null);
  const [selectedTabKey, setSelectedTabKey] = React.useState<SelectionTabKey | null>(null);

  const selectApplication = React.useCallback((applicationId: string, tabKey?: SelectionTabKey) => {
    setSelectedApplicationId(applicationId);
    setSelectedTabKey(tabKey ?? null);
  }, []);

  const value = React.useMemo(
    () => ({ selectedApplicationId, selectedTabKey, selectApplication }),
    [selectedApplicationId, selectedTabKey, selectApplication],
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
