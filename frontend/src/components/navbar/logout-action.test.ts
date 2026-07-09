import { describe, expect, it, vi } from "vitest"

const signOut = vi.fn()
vi.mock("@/auth", () => ({ signOut }))

describe("logoutAction", () => {
  it("signs the user out and redirects to /login", async () => {
    const { logoutAction } = await import("./logout-action")

    await logoutAction()

    expect(signOut).toHaveBeenCalledTimes(1)
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" })
  })
})
