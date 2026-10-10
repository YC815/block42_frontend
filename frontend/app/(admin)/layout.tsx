import { SiteShell } from "@/components/layout/site-shell";
import { AdminRoute } from "@/components/layout/admin-route";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRoute>
      <SiteShell>{children}</SiteShell>
    </AdminRoute>
  );
}
