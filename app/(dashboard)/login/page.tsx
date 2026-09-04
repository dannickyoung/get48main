import { redirect } from "next/navigation";

// Login now lives at /login/admin and /login/client.
export default function LoginIndex() {
  redirect("/login/admin");
}
