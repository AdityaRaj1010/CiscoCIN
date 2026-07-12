import { Navigate, Route, Routes } from "react-router-dom";
import { SystemBar } from "@/components/system-bar";
import { AppShell } from "@/components/app-shell";
import { useSession } from "@/context/SessionContext";
import { useTenant } from "@/context/TenantContext";
import { LoginPage } from "@/pages/LoginPage";
import { FeedPage } from "@/pages/FeedPage";
import { ProposalDetailPage } from "@/pages/ProposalDetailPage";
import { TallyPage } from "@/pages/TallyPage";
import { BudgetingPage } from "@/pages/BudgetingPage";
import { ProvisionPage } from "@/pages/ProvisionPage";
import type { ReactNode } from "react";

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthed } = useSession();
  return isAuthed ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireFeature({
  feature,
  children,
}: {
  feature: string;
  children: ReactNode;
}) {
  const { hasFeature } = useTenant();
  return hasFeature(feature) ? <>{children}</> : <Navigate to="/feed" replace />;
}

export default function App() {
  return (
    <div className="min-h-screen">
      <SystemBar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/provision"
          element={
            <div className="px-6 py-10">
              <ProvisionPage />
            </div>
          }
        />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/p/:id" element={<ProposalDetailPage />} />
          <Route
            path="/tally"
            element={
              <RequireFeature feature="tally">
                <TallyPage />
              </RequireFeature>
            }
          />
          <Route
            path="/budgeting"
            element={
              <RequireFeature feature="participatory_budgeting">
                <BudgetingPage />
              </RequireFeature>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </div>
  );
}
