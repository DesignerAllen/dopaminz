"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <Button variant="secondary" onClick={logout} className="w-full max-w-[300px]">
      로그아웃
    </Button>
  );
}
