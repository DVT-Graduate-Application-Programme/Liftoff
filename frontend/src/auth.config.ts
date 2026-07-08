import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const publicPaths = ["/login", "/api/auth", "/api/health"]
      const isPublic = publicPaths.some((path) =>
        nextUrl.pathname.startsWith(path),
      )
      if (isPublic) {
        return true
      }
      return isLoggedIn
    },
  },
  providers: []
} satisfies NextAuthConfig
