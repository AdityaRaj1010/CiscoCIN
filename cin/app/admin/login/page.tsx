"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DuoModal } from "@/components/duo-modal";

/**
 * /admin/login — matches the request: a real fork on the home page between
 * "client" and "admin". This mirrors how the rest of the app already
 * mocks auth (Duo push simulation, see components/duo-modal.tsx) rather
 * than inventing a separate real auth system — there's no admin backend
 * to check credentials against, same as there's no member login backend.
 * On "verify", it sets a plain (non-httpOnly, this is a demo gate — not a
 * security boundary) cookie that /admin reads server-side.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [duoOpen, setDuoOpen] = useState(false);

  useEffect(() => {
    if (document.cookie.includes("cin_admin=1")) {
      router.replace("/admin");
    }
  }, [router]);

  function onVerified() {
    document.cookie = "cin_admin=1; path=/; max-age=" + 60 * 60 * 8; // 8h
    setDuoOpen(false);
    router.replace("/admin");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(120%_100%_at_50%_-20%,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_70%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-system text-white shadow-lg">
            <UserCog size={26} />
          </div>
          <h1 className="mt-5 font-display text-[26px] font-semibold leading-tight tracking-tight text-ink">
            Admin console
          </h1>
          <p className="mx-auto mt-1.5 max-w-xs text-[14.5px] text-ink-2">
            Manage every tenant — review live activity and provision new civic apps.
          </p>
        </div>

        <div className="mt-8">
          <Button size="lg" className="w-full" onClick={() => setDuoOpen(true)}>
            Continue as Administrator
            <ArrowRight size={17} />
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[11px] text-ink-3">
            <ShieldCheck size={13} className="text-ok" />
            Protected by two-factor authentication
          </p>
        </div>

        <p className="mt-8 text-center text-[13px] text-ink-3">
          Not an administrator?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up as a client
          </Link>
        </p>
      </div>

      <DuoModal
        open={duoOpen}
        onClose={() => setDuoOpen(false)}
        onVerified={onVerified}
        title="Confirm admin sign-in"
        context="Signing in to the CIN admin console"
      />
    </div>
  );
}
