import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("./logout-action", () => ({ logoutAction: vi.fn() }))

import { LogoutButton } from "./logout-button"

describe("LogoutButton", () => {
  it("renders a submit button labelled 'Log out' inside a form wired to logoutAction", () => {
    render(<LogoutButton />)

    const button = screen.getByRole("button", { name: "Log out" })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute("type", "submit")

    const form = button.closest("form")
    expect(form).not.toBeNull()
  })
})
