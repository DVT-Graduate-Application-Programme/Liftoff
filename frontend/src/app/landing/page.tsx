import { auth } from "@/auth"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-500/10">
          <div className="size-3 rounded-sm border-2 border-green-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Signed in as {session?.user?.email ?? "unknown user"}
          </p>
          <p className="text-xs text-muted-foreground">Session active</p>
        </div>
      </div>
    </div>
  )
}
