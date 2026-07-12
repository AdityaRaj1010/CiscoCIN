import { listTenants } from "@/lib/tenant";
import { LoginClient } from "./login-client";

export default async function LoginPage() {
  const tenants = await listTenants();
  return <LoginClient tenants={tenants} />;
}
