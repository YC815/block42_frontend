import { SiteShell } from "@/components/layout/site-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SiteShell>{children}</SiteShell>
    </ProtectedRoute>
  );
}
