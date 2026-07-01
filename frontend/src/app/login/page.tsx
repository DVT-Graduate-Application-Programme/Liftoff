import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("microsoft-entra-id")
      }}
    >
      <button type="submit">Sign in with Microsoft</button>
    </form>
  )
}
