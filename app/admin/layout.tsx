import AdminNav from "@/components/AdminNav";
import { requireAdmin } from "@/lib/authorization";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin("/admin");

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto w-full max-w-7xl px-4  sm:px-6 lg:px-8">
        <AdminNav />
      </header>
      {children}
    </div>
  );
}
