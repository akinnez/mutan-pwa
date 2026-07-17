import { BottomNav } from "../../components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative">
      <main className="flex-1 pb-safe overflow-y-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
