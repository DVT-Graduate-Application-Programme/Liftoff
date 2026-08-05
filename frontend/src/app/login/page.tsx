import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <div>
          <Logo className="mx-auto h-20 w-auto opacity-80" />
        </div>

        <h1 className="mt-6 text-xl font-semibold text-foreground">
          Recruiter dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          DVT graduate recruitment tool
        </p>

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", {
              redirectTo: callbackUrl ?? "/landing",
            });
          }}
        >
          <Button type="submit" variant="outline" className="w-full">
            Sign in with Microsoft
          </Button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground">
          Use your existing DVT M365 account. No new account needed.
        </p>
      </div>
    </div>
  );
}
