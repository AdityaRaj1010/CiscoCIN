"use client";

import { useRouter } from "next/navigation";

export function AdminSignOut() {
  const router = useRouter();

  function signOut() {
    document.cookie = "cin_admin=; path=/; max-age=0";
    router.replace("/");
  }

  return (
    <button
      onClick={signOut}
      className="text-xs font-medium text-ink-2 hover:text-ink"
    >
      Sign out
    </button>
  );
}
