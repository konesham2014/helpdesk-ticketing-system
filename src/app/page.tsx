import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // During development, always go to login
  // In production, go to dashboard if logged in
  if (process.env.NODE_ENV === "development") {
    redirect("/login");
  }

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}