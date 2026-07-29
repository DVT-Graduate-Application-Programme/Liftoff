import { describe, expect, it } from "vitest"
import { authConfig } from "./auth.config"

function authorized(pathname: string, isLoggedIn: boolean) {
  return authConfig.callbacks.authorized({
    auth: isLoggedIn ? { user: { name: "Test User" } } : null,
    request: { nextUrl: new URL(`http://localhost:3000${pathname}`) },
  } as Parameters<typeof authConfig.callbacks.authorized>[0])
}

describe("authConfig.callbacks.authorized", () => {
  it.each(["/landing", "/applicants", "/history"])(
    "denies %s when logged out",
    (pathname) => {
      expect(authorized(pathname, false)).toBe(false)
    },
  )

  it.each(["/landing", "/applicants", "/history"])(
    "allows %s when logged in",
    (pathname) => {
      expect(authorized(pathname, true)).toBe(true)
    },
  )

  it.each(["/login", "/api/auth/session", "/api/health"])(
    "always allows public path %s, even when logged out",
    (pathname) => {
      expect(authorized(pathname, false)).toBe(true)
    },
  )

  it("treats root path as protected (falls through to isLoggedIn)", () => {
    expect(authorized("/", false)).toBe(false)
    expect(authorized("/", true)).toBe(true)
  })
})
