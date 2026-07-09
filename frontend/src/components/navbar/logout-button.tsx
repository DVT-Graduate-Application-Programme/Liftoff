import { LogOut } from "lucide-react"
import { logoutAction } from "./logout-action"

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-4 rounded-md px-4 py-4 text-sm font-medium text-destructive transition-colors hover:bg-muted"
      >
        <LogOut className="size-4" />
        <span>Log out</span>
      </button>
    </form>
  )
}
