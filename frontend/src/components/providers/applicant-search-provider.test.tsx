import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApplicantSearchProvider, useApplicantSearch } from "./applicant-search-provider";

describe("ApplicantSearchProvider", () => {
  it("starts with an empty search and updates via setSearch", () => {
    const { result } = renderHook(() => useApplicantSearch(), {
      wrapper: ApplicantSearchProvider,
    });

    expect(result.current.search).toBe("");

    act(() => {
      result.current.setSearch("Sarah");
    });

    expect(result.current.search).toBe("Sarah");
  });

  it("throws when used outside the provider", () => {
    expect(() => renderHook(() => useApplicantSearch())).toThrow(
      "useApplicantSearch must be used within an ApplicantSearchProvider"
    );
  });
});
