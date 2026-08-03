import { Sidebar } from '@/components/layout/sidebar';
import { StaffGuard } from '@/features/auth/staff-guard';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </StaffGuard>
  );
}
