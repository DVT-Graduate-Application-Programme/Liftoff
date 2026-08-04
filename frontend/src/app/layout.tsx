import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import QueryProvider from "@/components/providers/query-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ApplicantSearchProvider } from "@/components/providers/applicant-search-provider";
import AppShell from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DVT Recruiter Dashboard",
  description: "DVT graduate recruitment tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem={false}
        >
          <AuthSessionProvider>
            <QueryProvider>
              <ApplicantSearchProvider>
                <AppShell>{children}</AppShell>
                <Toaster position="top-right" />
              </ApplicantSearchProvider>
            </QueryProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
