import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      <Sidebar />
      <main className="main">
        <Header />
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
