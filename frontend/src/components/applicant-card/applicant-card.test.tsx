import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ApplicantCard from "./applicant-card";

describe("ApplicantCard", () => {
  it("renders the status label with a colored background matching the tone", () => {
    render(
      <ApplicantCard
        name="Jane Doe"
        institute="Example University"
        systemScore={82}
        statusLabel="Approved"
        statusTone="positive"
      />,
    );

    const statusLabel = screen.getByText("Approved");
    expect(statusLabel.className).toContain("bg-primary/10");
  });
});
