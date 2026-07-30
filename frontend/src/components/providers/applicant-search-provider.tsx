"use client";

import * as React from "react";

interface ApplicantSearchContextValue {
  search: string;
  setSearch: (value: string) => void;
}

const ApplicantSearchContext = React.createContext<ApplicantSearchContextValue | null>(null);

export function ApplicantSearchProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = React.useState("");

  const value = React.useMemo(() => ({ search, setSearch }), [search]);

  return <ApplicantSearchContext.Provider value={value}>{children}</ApplicantSearchContext.Provider>;
}

export function useApplicantSearch() {
  const context = React.useContext(ApplicantSearchContext);
  if (!context) {
    throw new Error("useApplicantSearch must be used within an ApplicantSearchProvider");
  }
  return context;
}
