import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <TopBar />
        <main className="p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
