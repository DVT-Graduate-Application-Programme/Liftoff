import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLanding = nextUrl.pathname.startsWith("/landing")
      if (isOnLanding) {
        return isLoggedIn
      }
      return true
    },
  },
  providers: []
} satisfies NextAuthConfig
