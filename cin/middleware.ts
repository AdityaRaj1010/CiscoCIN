import { NextResponse, type NextRequest } from "next/server";

/**
 * CIN middleware — the dispatcher.
 * Path-based is the default and needs zero DNS.
 * The host-based branch is the same file if we ever buy a domain.
 */
export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const hostname = host.split(":")[0];
  const sub = hostname.split(".")[0];
  const isLocalhost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname);
  const isVercelHost = hostname === "vercel.app" || hostname.endsWith(".vercel.app");
  const isSubdomainTenant =
    !isLocalhost &&
    !isVercelHost &&
    !["www", "cin", "vercel"].includes(sub) &&
    hostname.split(".").length > 2;

  if (isSubdomainTenant && !req.nextUrl.pathname.startsWith("/t/")) {
    return NextResponse.rewrite(
      new URL(`/t/${sub}${req.nextUrl.pathname}`, req.url),
    );
  }
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
