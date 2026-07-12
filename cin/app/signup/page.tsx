import { listTenants } from "@/lib/tenant";
import { SignupClient } from "./signup-client";

export default async function SignupPage() {
  const tenants = await listTenants();
  return <SignupClient tenants={tenants} />;
}
